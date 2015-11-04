'use strict';

var identity = function(arg) {
  return arg;
};

var RANGE_FLAG = '--range';
var RANGE_FLAG_SHORT = '-r';
var INTRANGE_FLAG = '--intrange';
var INTRANGE_FLAG_SHORT = '-ir';

var isRangeFlag = function isRangeFlag(str) {
  return str === RANGE_FLAG ||
    str === RANGE_FLAG_SHORT ||
    str === INTRANGE_FLAG ||
    str === INTRANGE_FLAG_SHORT;
};

var isIntRangeFlag = function isIntRangeFlag(str) {
  return str === INTRANGE_FLAG ||
  str === INTRANGE_FLAG_SHORT;
};

var main = function main(argv, response, logger, config) {
  var items = argv.slice(1);
  var result;
  (items.length <= 0) &&
    (items = Array.apply(null, new Array(6))
      .map(function(_, i) {
        return i+1;
      }));

  if (isRangeFlag(argv[1])) {
    var a = parseFloat(argv[2]),
      b = parseFloat(argv[3]);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      response.end(config.errMsgs.generic);
      return;
    }

    var low = Math.min(a, b),
      hi = Math.max(a, b);

    result = (isIntRangeFlag(argv[1]) ? Math.round : identity)
      (low + (Math.random() * (hi - low)));
  }

  return result ?
    response.end(result) :
    response.random(items);
};

main.metadata = require('./plugin');
module.exports = main;
