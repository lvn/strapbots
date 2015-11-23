'use strict';

var util = require('./util');

var at = '@';

var psh = function psh(argv, response, user, pshService, config) {
  argv.shift();  // remove the main command name from argv.
  var subcmd = argv.shift();

  if (subcmd === 'subscribe' || subcmd === 'sub') {
    pshService.subscribe(user, util.prefixList(argv, at),
      function(err, result) {
        (!err) && (response.end('ok'));
      });
  }
  else if (subcmd === 'unsubscribe' || subcmd === 'unsub') {
    pshService.unsubscribe(user, util.prefixList(argv, at),
      function(err, result) {
        (!err) && (response.end('ok'));
      });
  }
  else if (subcmd === 'list') {
    pshService.list(function(err, result) {
      var resBody = result.length > 0 ?
        result.join(' ') :
        config.errMsgs.noGroups;
      response.end(resBody);
    });
  }
  else {
    response.end(config.errMsgs.generic);
  };
};

psh.metadata = require('./plugin');
module.exports = psh;
