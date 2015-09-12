'use strict';

var counts = {};

var STACK_LIMIT = 5;

var timeDiffSeconds = function timeDiff(a, b) {
  a = a || Date.now();
  b = b || Date.now();
  return Math.abs(a - b) / 1000;
};

var comboBreaker = function(message, channel, response, logger) {
  // get channel
  var channelId = channel.id;
  counts[channelId] = counts[channelId] || [];
  var channelCounts = counts[channelId];

  if (message.text && message.text[0] != '!') {
    // normalize text
    var text = message.text.trim().toLowerCase();

    // insert text time into record
    var textIndex = channelCounts.indexOf(text);
    if (textIndex != -1) {
      logger.log('breaking combo', message);
      response.end('C-C-C-COMBO BREAKER');
      channelCounts.splice(textIndex, 1);
    }
    else {
      channelCounts.unshift(text);
      if (channelCounts.length > 5) {
        channelCounts.pop();
      }
    }
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
