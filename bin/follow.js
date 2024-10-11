#!/usr/bin/env node
const pull = require('pull-stream')
const client = require('../../tre-cli-client')

client( (err, ssb, conf, keys) => {
  if (err) exit(err)

  /*
  ssb.manifest( (err, data)=>{
    if (err) exit(err)
    console.log(data)
  })
  */

  ssb.publish({
    type: 'contact',
    following: true,
    contact: ''
  }, (err, msg) => {
    if (err) exit(err)
    console.log(msg)
    list()
  });

  function list() {
    pull(
      ssb.messagesByType('contact'),
      pull.drain(e=>{
        console.log(e)
      }, exit)
    )
  }

  function exit(err) {
    const code = err ? 1 : 0;
    if (err) console.error(err.message)
    if (ssb) {
      ssb.close( ()=>{
        process.exit(code)
      })
    } else {
      process.exit(code)
    }
  }

})

/*
pull(
  ssb.revisions.messagesByType('role', {keys: false, seqs: false}),
  //ssb.messagesByType('about'),

  pull.map( ({key, value}) =>{
    const {author, content} = value;
    const self = author == content.about
    delete content.type
    content.self = self
    return content
  }),
  
  pull.drain(printFeed, exit)
)
*/


function printFeed(f) {
  console.log(f)
}
