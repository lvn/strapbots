
var pointTable = {};

module.exports = function(match, response) {
  var points = Number(match[1]),
    multiplier = ('to' === match[2]) - ('from' === match[2]),
    target = match[3];


  pointTable[target] = (pointTable[target] || 0) + (points * multiplier);
  response.end(target + ': ' + pointTable[target] + ' points');
}
