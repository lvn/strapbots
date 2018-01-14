'use strict';

let usernames = {};

let usedNames = new Set();
let getAnonName = (userId) => {
  if (!usernames[userId]) {
    usernames[userId] = getNextEmoji()
  }
}

let anon = function anon(argv, channels, response, config, logger, message, emojiService) {
  let userId = message.sender.id;
  let subcmd = argv[1];
  if (subcmd == 'reset') {
    Object.keys(usernames)
      .filter((uname) => { uname.startsWith(userId) })
      .forEach((uname) => { delete usernames[uname] });
  } else {
    let channelIdFmt = argv[1];
    let msg = argv.slice(2).join(' ');
    let match = /<#(\w*)(\|.*)?>/.exec(channelIdFmt);
    let channelId = (match || [])[1];
    let channel = channels[channelId];

    if (channel && !channel.is_archived && msg && msg.length < 4000) {

      if (!channel.is_member) {
        response.endf('Thanks for invite to {{channel}}', {
          channel: channelIdFmt
        });
        return;
      }

      // assign anonName:
      let userKey = `${userId}/${channelId}`;
      if (!usernames[userKey]) {
        var anonName = '';
        do {
          anonName = emojiService.random();
        } while (usedNames.has(anonName));
        usedNames.add(anonName);
        usernames[userKey] = anonName;
      }
      var anonName = usernames[userKey];

      response.channel = channel;
      response.endf(':{{anonName}}: said: \n>>>{{msg}}', {
        anonName: anonName,
        msg: msg
      });
    }
    else {
      logger.error('Cannot find channel', channelId || 'with unknown ID');
      response.end(config.errMsgs.noChannel);
    }
  }
};

anon.metadata = require('./plugin');

module.exports = anon;
