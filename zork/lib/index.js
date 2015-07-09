var ZorkClient = require('./zork-client').ZorkClient;

var zork;

var _channel;
zork = new ZorkClient(function(data) {
  _channel && _channel.send(data);
});

var BANNED_WORDS = new Set(['quit']);

module.exports = function zorkCmd(argv, response, channel) {
  var words = argv.slice(1);
  for (var i in words) {
    if BANNED_WORDS.has(words[i]) {
      return;
    }
  }
  var cmd = words.join(' ');
  _channel = channel;
  zork.send(cmd);
};
