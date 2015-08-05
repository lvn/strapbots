
var math = require('mathjs');

var pointTable = {};

var renderPoints = function renderPoints(points) {
  if (typeof points !== 'number' || points !== points) {
    return 'wat';
  }

  if (points === Infinity) {
    return 'way too many points';
  }

  return points.toString + ' points';
};

var points = function points(match, response) {
  var matchExpr = match[1],
    points = Math.round(math.eval(matchExpr)),
    multiplier = ('to' === match[3]) - ('from' === match[3]),
    target = match[4];

  pointTable[target] = (pointTable[target] || 0) + (points * multiplier);
  response.end(target + ': ' + renderPoints(pointTable[target]));
};

module.exports = points;
