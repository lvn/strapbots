'use strict';

var wolfram;

var wa = function(argv, response, config, logger, channel) {
  wolfram = wolfram || require('wolfram-alpha')
    .createClient(config.apiKey, config.opts);
  var expr = argv.slice(1).join(' ');
  logger.log('Got request at', channel.name, 'for:', expr);
  wolfram.query(expr, function(err, result) {
    if (err) {
      return;
    }
    result.shift();  // ignore the first subpod about input interpretation
    var subpod = result[0];
    var reply;
    if (subpod) {
      reply = subpod.subpods[0].text || subpod.subpods[0].image;
      logger.log('Sending reply:', reply);
    }
    else {
      reply = config.errMsgs.exprError;
    }
    response.end(reply);
  });
};

wa.metadata = require('./plugin');

module.exports = wa;
