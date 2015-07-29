'use strict';

var fs = require('fs'),
  lfmt = require('lfmt');

var macros = {};

var errMsgs = {
  incorrectUsage: '```macro```: you did something wrong.',
  noMacro: 'Can\'t find that!'
};

var loadMacros = function loadMacros() {

};

var addMacro = function addMacro(name, template, cb) {
  macros[name] = template;
  cb && cb();
};

var applyMacro = function loadMacros(name, args, cb) {
  var template = macros[name];
  if (!template) {
    cb && cb(new Error('Macro not found'));
    return;
  }

  var result = template
    .replace('$@', args.join(' '))
    .replace(/\$(\d+)/g, function(match, p1) {
      return macros[p1];
    });

  cb && cb(null, result);
};

module.exports = function(argv, response, logger) {
  loadMacros();

  var subcmd = argv[1];
  if (!subcmd) {
    logger.error('`macro` called incorrectly: ', argv);
    response.end(errMsgs.incorrectUsage);
    return;
  }

  if (subcmd === 'set') {
    var name = argv[2];
    var template = argv.slice(3).join(' ');
    addMacro(name, template, function(err) {
      if (!err) {
        response.end(lfmt.format('Successfully macroed {{name}} to `{{template}}`', {
          name: name,
          template: template
        }));
      }
    });
  }
  else {
    var name = subcmd;
    applyMacro(name, argv.slice(2), function(err, result) {
      response.end(result || errMsgs.noMacro);
    });
  }
};

addMacro('pk', '(☞ﾟ∀ﾟ)☞ $@ (☞ﾟ∀ﾟ)☞');
applyMacro('pk', ['#smash'], function(err, result) {
  console.log(result);
});
