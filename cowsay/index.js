'use strict';

var execSync = require('child_process').execSync;

var trim = function trim(str, characters) {
  characters = Array.isArray(characters) ? characters.join('') : characters;
  var trimWrapper = '[' + characters + ']*';
  var trimRegex = new RegExp('^' + trimWrapper + '(.*?)' + trimWrapper + '$'),
    match = trimRegex.exec(str);

  return match ? match[1] : str;
};

var cowsay = function(argv, response, logger) {
  var rawMsg = trim(argv.slice(1).join(' ').trim(), '`');
  logger.log('cowsaying', rawMsg);
  var result = execSync('echo \'' + rawMsg + '\' | cowsay')
    .toString();
  response.end('```' + result + '```');
};

cowsay.metadata = {
  name: 'cowsay',
  command: ['cowsay'],
  info: {
    description: 'Cowsay!',
    usage: 'cowsay [messsage]'
  }
};

module.exports = cowsay;
