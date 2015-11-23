'use strict';

exports.formatMention = function(id) {
  return '<@' + id + '>';
};

exports.mentionAll = function(ids) {
  return ids.map(exports.formatMention).join(' ');
};

exports.mentionAllSet = function(ids) {
  var result = [];
  ids.forEach(function(id) {
    result.push(exports.formatMention(id));
  });
  return result.join(' ');
};

exports.prefix = function(str, prefix) {
  return (str.startsWith(prefix) ? '' : prefix) + str;
};

exports.prefixList = function(list, prefix) {
  return list.map(function(item) {
    return exports.prefix(item, prefix);
  });
};
