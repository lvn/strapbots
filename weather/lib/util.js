'use strict';

exports.normalize = function normalize(str) {
  return str.toLowerCase().replace(/\s/g, '');
};

// Basic date comparator that checks if a is greater than, less than, or equal
// to b, where some threshold (defaulting to 1000 ms) is given for checking
// approximate equivalency.
// If a > b, returns some d > 0.
// If a ~= b, return 0.
// If a < b, returns some d < 0.
exports.cmpDate = function cmpDate(a, b, threshold) {
  a = a || Date.now();
  b = b || Date.now();
  threshold = threshold || ms.inSecond;

  var diff = a - b;
  return Math.abs(diff) > threshold ? diff : 0;
};

// in-place remove the item from the array, if it exists.
exports.tryRemove = function tryRemove(arr, item) {
  var indx = arr.indexOf(item);
  return indx == -1 ? arr[-1] : arr.splice(indx, 1);
};

const icons = {
  '01d': ['sunny'],
  '01n': ['moon'],
  '02d': ['cloud', 'sunny'],
  '02n': ['cloud', 'moon'],
  '03': ['cloud'],
  '04': ['cloud', 'cloud'],
  '09': ['droplet', 'droplet', 'droplet'],
  '10': ['droplet', 'cloud'],
  '11': ['cloud', 'zap'],
  '13': ['cloud', 'snowflake'],
  '50': ['foggy']
};
exports.iconToEmoji = function iconToEmoji(key) {
  var result = (icons[key] || icons[key.slice(0, 2)])
    .map(function(emoji) {
      return ':' + emoji + ':';
    })
    .join(' ') + ' ';
  return result;
};

const KmInMile = 1.60934;
const kmHInMs = 3.6;
exports.toKmPerHr = function toKmPerHr(speed, units) {
  if (units == 'imperial') {
    return speed * KmInMile;
  }

  // units should be m/s by default
  return speed * kmHInMs;
};

// draw wind emoji to correspond with wind speed.
// the formula for the number of emoji drawn is essentially:
// Math.floor(((wind speed as beaufort number) / 2) - 1)
exports.renderWindEmoji = function renderWindEmoji(speed, units) {
  var bounds = [12.0, 29.0, 50.0, 75.0, 103.0];  // in km/h
  return bounds.filter(function(bound) {
    return toKmPerHr(speed, units) > bound;
  }).map(function() {
    return ':dash:';
  }).join(' ');
};
