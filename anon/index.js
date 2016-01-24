'use strict';

let anon = function anon(argv, channels, response, config, logger) {
  let channelIdFmt = argv[1];
  let msg = argv.slice(2).join(' ');
  let match = /<#(\w*)(\|.*)?>/.exec(channelIdFmt);
  let channelId = (match || [])[1];
  let channel = channels[channelId];

  if (channel && !channel.is_archived && msg && msg.length < 4000) {
    response.channel = channel;
    response.endf('{{anonName}} said: \n>>>{{msg}}', {
      anonName: config.anonName,
      msg: msg
    });
  }
  else {
    logger.error('Cannot find channel', channelId || 'with unknown ID');
    response.end(config.errMsgs.noChannel);
  }
};

anon.metadata = require('./plugin');

module.exports = anon;
