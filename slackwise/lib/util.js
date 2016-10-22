'use strict';

exports.formatName = (member) => `${member.first_name || ''} ${member.last_name || ''}`;

exports.formatDebtLabel = (debt, defaultCurrencyCode) => {
  return debt.currency_code == defaultCurrencyCode ? `${debt.amount}` :
  `${debt.amount} ${debt.currency_code}`;
};

exports.formatAmount = (amount, currenyCode) => {
  return `${amount} ${currenyCode}`;
};

exports.parseAmount = (amount) => {
  return Number(amount);
};

exports.listFormat = (list) => {
  return list.map(item => `* ${item}`).join('\n');
};

exports.parseUserTag = (tag) => tag.match(/@(\w*)/)[1];
