var Evaluator = require('./evaluator');

var unescape = function unescape(value){
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

module.exports = function(argv, channel, response, logger) {
  var input = unescape(argv.slice(1).join('')),
    inputSplit = input.split(/\"/g);
    code = inputSplit[0],
    stdin = inputSplit[1].split('').map(function(c) {
      return c.charCodeAt(0);
    });

  logger.log('evaluating', code);
  try {
    result = '';
    Evaluator.bfEval(code, {
      input: function() {
        return stdin.shift() || 0;
      },
      output: function(value) {
        result += String.fromCharCode(value);
      }
    });
    response.end(result || 'Program produced no output');
  } catch(e) {
    logger.error(e);
    response.end('Invalid BF program');
  }
};
