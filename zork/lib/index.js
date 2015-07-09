var ZorkClient = require('./zork-client').ZorkClient;

var zork;

var _channel;
zork = new ZorkClient(function(data) {
  _channel && _channel.send(data);
});

module.exports = function zorkCmd(argv, response, channel) {
  var cmd = argv.slice(1).join(' ');
  _channel = channel;
  zork.send(cmd);
};
