
var slaquarium = require('./lib');

module.exports = function(argv, response) {

  response.end('https://www.youtube.com/watch?v=fKV5Ol_W3YY');
  return;

  if (argv.length < 3) {
    return;
  }



  var w = Math.min(Number(argv[1]) || 5, 100);
  var h = Math.min(Number(argv[2]) || 5, 100);
  var result = slaquarium.testDraw(w, h );
  response.end('```' + result + '```');
};
