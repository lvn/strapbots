'use strict';

let nodeUtil = require('util');

exports.formatName = (member) => `${member.first_name || ''} ${member.last_name || ''}`;

let getCurrencyFormat = exports.getCurrencyFormat = (currencyConfig, currencyCode) => {
  currencyConfig = currencyConfig[currencyCode];

  if (!currencyConfig) {
    return `%d ${currencyCode}`
  } else {
    return currencyConfig.format || currencyConfig;
  }
};

let getCurrencyColor = exports.getCurrencyColor = (currencyConfig, currencyCode) => {
  currencyConfig = currencyConfig[currencyCode];

  if (currencyConfig && currencyConfig.color) {
    return currencyConfig.color;
  } else {
    return '#000000';
  }
};

exports.formatAmount = (amount, currencyCode, currencyConfig) => {
  return nodeUtil.format(getCurrencyFormat(currencyConfig, currencyCode), amount);
};

exports.parseAmount = (amount) => {
  return Number(amount);
};

exports.listFormat = (list) => {
  return list.map(item => `* ${item}`).join('\n');
};

exports.parseUserTag = (tag) => tag.match(/@(\w*)/)[1];

exports.getEdgeWidth = (amount) => Math.min(Math.cbrt(amount / 15), 6);

exports.getBalanceColor = (colors, balances) => {
  let neutralColor = colors.NEUTRAL || '#000000';
  let owingColor = colors.OWING || '#FF0000';
  let owedColor = colors.OWED || '#006400';

  let total = balances.map(bal => new Number(bal.amount))
    .reduce((acc, val) => acc + val, 0);
  if (total == 0) {
    return neutralColor;
  }

  return (total < 0) ? owingColor : owedColor;
}
