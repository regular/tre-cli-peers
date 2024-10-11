#!/usr/bin/env node
const pull = require('pull-stream')
const many = require('pull-many')

module.exports = function(ssb, opts) {
  opts = opts || {}
  const {live, sync} = opts
  let awaitSyncs = sync ? 2 : 0

  return pull(
    many([
      ssb.messagesByType({type: 'about', live, sync}),
      ssb.revisions.messagesByType('role', {keys: false, seqs: false, live, sync})
    ]),

    pull.filter(v=>{
      if (v.sync) {
        awaitSyncs--
        if (!awaitSyncs) {
          return true
        }
        return false
      }
      return true
    }),

    pull.map( ({sync, key, value}) =>{
      if (sync) return {sync}
      const {author, content} = value;
      const aboutSelf = author == content.about
      delete content.type
      content.aboutSelf = aboutSelf
      return content
    })
  )
}

