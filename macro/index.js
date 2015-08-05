'use strict';

var fs = require('fs'),
  lfmt = require('lfmt');

var saveFile = process.cwd() + '/saved.macros';

var macros = {};

var errMsgs = {
  incorrectUsage: '`macro`: you did something wrong.',
  noMacro: 'Can\'t find that!'
};

var loadMacros = function loadMacros() {
  if (Object.keys(macros) > 0) return;

  try {
    // this scheme does not account for duplicate keys. later records with
    // the same key will simply overwrite the template.
    var rawMacros = fs.readFileSync(saveFile).toString()
      .split('\n')
      .forEach(function(record) {
        if (!record) return;

        // TODO: catch errors for records with no space
        var spaceIndex = record.indexOf(' '),
          name = record.slice(0, spaceIndex),
          template = record.slice(spaceIndex + 1);
        macros[name] = template;

        console.log(lfmt.format('loading macro {{name}} `{{template}}`', {
          name: name,
          template: template
        }));
      });
  } catch (err) {
    // log the error and clean the macros.
    console.error(err);
    macros = {};
  }
};

var addMacro = function addMacro(name, template, cb) {
  macros[name] = template;
  fs.appendFile(saveFile, lfmt.format('{{name}} {{template}}\n', {
    name: name,
    template: template
  }), function(err) {
    if (err) console.error(err);
    cb && cb();
  });
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
      return (macros[Number(p1)] || '');
    });

  cb && cb(null, result);
};

var macro = function macro(argv, response, logger) {
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

module.exports = macro;
