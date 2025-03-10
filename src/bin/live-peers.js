#!/usr/bin/env node

require('../extra-modules-path')

const pull = require('pull-stream')
const client = require('../lib/tre-client')
const multicb = require('multicb')
const {inspect} = require('util')
const config = require('rc')('tre-peers')

const about = require('../lib/about')
const LivePeers = require('../lib/live-peers')

client( config.remote, config, (err, ssb, conf, keys) => {
  const exit = require('../lib/exit')(ssb)
  if (err) exit(err)

  const o = {
    live: true,
    sync: true
  }
  
  const cache = {}
  function add(e, name, value, front) {
    if (value == undefined) return
    l = e[name]
    if (l.includes(value)) return
    if (front) l.push(value)
    else l.unshift(value)
  }

  pull(
    about(ssb, o),
    pull.drain(a => {
      if (a.sync) {
        // By this point, we gathered all knowledge
        // about feeds to be able to augment our output
        // We keep updating the cahce though
        //console.log(cache)
        listLivePeers(ssb, cache)
        return
      }
      const {about, name, station, aboutSelf} = a
      const e = cache[about] || {names: [], stations: []}
      add(e, 'names', name, aboutSelf)
      add(e, 'stations', station, aboutSelf)
      cache[about] = e
    }, err=>{
      console.error('about strem ended: ' + err.message)
      //exit(err)
    })
  )

})


function listLivePeers(ssb, nameCache) {
  const exit = require('../lib/exit')(ssb)
  pull(
    LivePeers(config.remote, config),
    pull.asyncMap( (peer, cb)=>{
      const e = nameCache[peer]
      const result = {peer}
      if (!e) return cb(null, result)
      if (e.names.length) result.names = e.names
      if (e.stations.length) {
        const done = multicb({pluck: 1})
        e.stations.forEach(msgid=>{
          ssb.revisions.getLatestRevision(msgid, {allowAllAuthors: true}, done())
        })
        done( (err, stations)=>{
          result.stations = stations.map(kvm=>{
            const {name, hostnames} = kvm.value.content
            return {name, hostnames}
          })
          cb(null, result)
        })
      } else cb(null, result)
    }),
    pull.drain(e=>{
      console.log(e.peer, e.names, e.stations && e.stations.map(s=>[s.name, s.hostnames]).flat().flat())
    }, exit)
  )
}

