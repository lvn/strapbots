'use strict';

let nodeUtil = require('util');

exports.formatName = (member) => `${member.first_name || ''} ${member.last_name || ''}`;

exports.formatAmount = (amount, currencyCode, currencyConfig) => {
  let formatStr = (currencyConfig && currencyConfig[currencyCode]) ||
    `%d ${currencyCode}`;

  return nodeUtil.format(formatStr, amount);
};

exports.parseAmount = (amount) => {
  return Number(amount);
};

exports.listFormat = (list) => {
  return list.map(item => `* ${item}`).join('\n');
};

exports.parseUserTag = (tag) => tag.match(/@(\w*)/)[1];
