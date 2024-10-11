const pull = require('pull-stream')
const client = require('../../tre-cli-client')
const next = require('pull-next')
const Catch = require('pull-catch')
const defer = require('pull-defer')

module.exports = function(ssb) {
  return pull(
    next( ()=>{
      const deferred = defer.source()
      client( (err, ssb, conf, keys) => {
        if (err) return deferred.resolve(pull.error(err))
        deferred.resolve(
          pull(
            ssb.conn.peers(),
            Catch(),
            pull.flatten(),
            pull.map( ([address, {key, state}]) =>{
              return {address, key, state}
            }),
            pull.filter( ({state})=>state == 'connected'),
            pull.filter( ({key})=> !key.includes(keys.public)),
          )
        )
      })
      return deferred
    }),
    pull.unique("key"),
    pull.map("key")
  )
}
