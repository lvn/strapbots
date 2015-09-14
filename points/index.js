
var math = require('mathjs');

var pointTable = {};

var renderPoints = function renderPoints(points) {
  if (typeof points !== 'number' || points !== points) {
    return 'wat';
  }

  if (points === Infinity) {
    return 'way too many points';
  }

  if (points === -Infinity) {
    return 'the opposite of way too many points';
  }

  return JSON.stringify(points) + ' points';
};

var points = function points(match, response, logger) {
  var matchExpr = match[1],
    points = 0,
    multiplier = ('to' === match[3]) - ('from' === match[3]),
    target = match[4];

  try {
    points = Math.round(math.eval(matchExpr));
  }
  catch (e) {
    logger.log('points eval error');
    points = 0;
  }

  pointTable[target] = (pointTable[target] || 0) + (points * multiplier);
  response.end(target + ': ' + renderPoints(pointTable[target]));
};

points.metadata = {
  name: 'points',
  match: /^(.*) point(s?) (to|from) (.*)$/,
  info: {
    description: 'Give arbitrary points to people'
  }
};

module.exports = points;
