'use strict';

var counts = {};

var comboBreaker = function(message, response, logger) {
  var text = message.text.trim().toLowerCase();
  counts[text] = (counts[text] || 0) + 1;
  logger.log(message, counts[text]);
  if (counts[text] >= 2) {
    logger.log('breaking combo', message);
    response.end('C-C-C-COMBO BREAKER');
    delete counts[text];
  }
};


comboBreaker.metadata = {
  name: 'combo-breaker',
  type: 'event',
  event: 'message',
  info: {
    description: 'I break combos.'
  }
};


module.exports = comboBreaker;
