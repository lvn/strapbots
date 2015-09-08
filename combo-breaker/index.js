'use strict';

var counts = {};

var timeDiffSeconds = function timeDiff(a, b) {
  a = a || Date.now();
  b = b || Date.now();
  return Math.abs(a - b) / 1000;
};

var comboBreaker = function(message, channel, response, logger) {
  // get channel
  var channelId = channel.id;
  counts[channelId] = counts[channelId] || {};
  var channelCounts = counts[channelId];

  if (message.text) {
    // normalize text
    var text = message.text.trim().toLowerCase();
    channelCounts[text] = channelCounts[text] || [];

    // insert text time into record
    var now = Date.now();
    channelCounts[text].unshift(now);
    logger.log(message, channelCounts[text].length);

    if (timeDiffSeconds(channelCounts[text][0]) < 21600 &&
        channelCounts[text].length >= 2) {
      logger.log('breaking combo', message);
      response.end('C-C-C-COMBO BREAKER');
      delete counts[channelId][text];
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
