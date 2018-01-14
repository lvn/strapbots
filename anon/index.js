'use strict';

let usernames = {};

let usedNames = new Set();
let getAnonName = (userId) => {
  if (!usernames[userId]) {
    usernames[userId] = getNextEmoji()
  }
}

let parseChannelId = (str) => {
  let match = /<#(\w*)(\|.*)?>/.exec(str);
  let channelId = (match || [])[1];
  return channelId;
};

let anon = function anon(argv, channels, response, config, logger, message, emojiService) {
  let userId = message.sender.id;
  let subcmd = argv[1];
  if (subcmd == 'reset') {
    let channelId = parseChannelId(argv[2]);
    Object.keys(usernames)
      .map(JSON.parse)
      .filter((uname) => { return uname.userId == userId })
      .filter((uname) => { return uname.channelId ?
          name.channelId == channelId : true; })
      .map(JSON.stringify)
      .forEach((uname) => { delete usernames[uname] });
    message.react('+1');
  } else {
    let channelId = parseChannelId(argv[1]);
    let msg = argv.slice(2).join(' ');
    let channel = channels[channelId];

    if (channel && !channel.is_archived && msg && msg.length < 4000) {

      if (!channel.is_member) {
        response.endf('Thanks for invite to {{channel}}', {
          channel: channelIdFmt
        });
        return;
      }

      // assign anonName:
      let userKey = JSON.stringify({
        userId: userId,
        channelId: channelId
      });
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
