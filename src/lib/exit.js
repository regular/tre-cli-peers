
module.exports = function(ssb) {

  return function exit(err) {
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
}
