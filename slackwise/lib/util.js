'use strict';

exports.formatName = (member) => `${member.first_name || ''} ${member.last_name || ''}`;

exports.formatDebtLabel = (debt, defaultCurrencyCode) => {
  return debt.currency_code == defaultCurrencyCode ? `${debt.amount}` :
  `${debt.amount} ${debt.currency_code}`;
};
