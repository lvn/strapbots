'use strict';

var cp = require('child_process'),
  stream = require('stream');

var trim = function trim(str, characters) {
  characters = Array.isArray(characters) ? characters.join('') : characters;
  var trimWrapper = '[' + characters + ']*';
  var trimRegex = new RegExp('^' + trimWrapper + '(.*?)' + trimWrapper + '$'),
    match = trimRegex.exec(str);

  return match ? match[1] : str;
};

// get list of cowfiles
var cowfiles = cp.execSync('cowsay -l')
  .toString().split('\n').slice(1)
  .filter(function(l) {
    return l.length > 0;
  })
  .map(function(l) {
    return l.split(' ');
  })
  .reduce(function(acc, next) {
    return acc.concat(next);
  }, []);

var cowsay = function(argv, response, logger, config) {
  var rawMsg = trim(argv.slice(1).join(' ').trim(), '`');
  logger.log('cowsaying', rawMsg);

  // construct cowsay command
  var cmd = 'cowsay';
  var args = [];
  if (cowfiles.length > 0 && Math.random() < config.randomCowfileProb) {
    args.push('-f');
    args.push(cowfiles[Math.floor(Math.random() * cowfiles.length)]);
  }

  var cmdProcess = cp.spawn(cmd, args);
  cmdProcess.stdout.on('data', function(message) {
    response.end('```' + message + '```');
    cmdProcess.kill();
  });
  cmdProcess.stdin.write(rawMsg);
  cmdProcess.stdin.write('\r');
  cmdProcess.stdin.end();

};

cowsay.metadata = {
  name: 'cowsay',
  command: ['cowsay'],
  info: {
    description: 'Cowsay!',
    usage: 'cowsay [messsage]'
  },
  randomCowfileProb: 0.2
};

module.exports = cowsay;
