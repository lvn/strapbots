
var pointTable = {};

module.exports = function(match, response) {
  var points = match[1],
    multiplier = ('to' in match[2]) - ('from' in match[2]),
    target = match[3];


  pointTable[target] = (pointTable[target] || 0) + (points * multiplier);
  response.end(target + ': ' + pointTable[target] + ' points');
}
