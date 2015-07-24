
var http = require('http'),
  exec = require('child_process').exec,
  escape = require('js-string-escape'),
  lfmt = require('lfmt'),
  phantom = require('phantom');

var DEFAULT_BRANCHES = [
  'master',
  'develop',
  'feature/PLAT-{{number}}',
  'chore/APP-{{number}}',
  'bugfix/EXT-{{number}}'
];

var CLFLN_URL = 'http://www.commitlogsfromlastnight.com/?page={{page}}';

var arrayRandom = function arrayRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};

var randomBranch = function randomBranch(branches) {
  var num = Math.ceil(Math.random() * 5000 + 10);
  var branchName = arrayRandom(DEFAULT_BRANCHES);
  return lfmt.format(branchName, {
    number: num
  });
};

var generateMessage = function generateMessage(cb) {
  http.request({
    hostname: 'whatthecommit.com',
    path: '/index.txt'
  }, function(res) {
    res.on('data', function(chunk) {
      cb(chunk);
    });
  }).end();
  return;

  var url = lfmt.format(CLFLN_URL, {
    page: Math.ceil(Math.random() * 500)
  });
};

var generateHash = function generateHash(text, cb) {
  var _text = escape(text);
  exec('echo "' + _text + '" | git hash-object --stdin | head -c 7',
    function(err, stdout, stderr) {
      err && console.error(err);
      var hash = stdout && stdout.toString();
      cb && cb(err, hash);
    });
};

var gc = function gc(response) {
  var commitMessageBase = '```[{{branch}} {{hash}}] {{message}}```';

  generateMessage(function(message) {
    generateHash(message, function(err, hash) {
      response.end(lfmt.format(commitMessageBase, {
        branch: randomBranch(),
        hash: hash,
        message: message
      }).replace(/\n/g, ''));
    });
  });
};

module.exports = gc;
