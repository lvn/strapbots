'use strict';

var fs = require('fs'),
  lfmt = require('lfmt');

var saveFile = process.cwd() + '/saved.macros';

var macros = {};

var errMsgs = {
  incorrectUsage: '`macro`: you did something wrong.',
  noMacro: 'Can\'t find that!',
  cantBeEmpty: 'Macro can\'t be empty!',
  cantBeRecursive: 'Macro can\'t be recursive!',
  badBrackets: 'Macro has mismatched brackets!'
};

var loadMacros = function loadMacros() {
  if (Object.keys(macros).length > 0) return;

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

var applyMacro = function applyMacro(name, args, cb) {
  var template = macros[name];
  if (!template) {
    cb && cb(new Error('Macro not found'));
    return;
  }

  var result = template
    .replace(/\$@/g, args.join(' '))
    .replace(/\$(\d+)/g, function(match, p1) {
      return (args[Number(p1)] || '');
    });

  cb && resolveNesting(result, cb);
};

var resolveNesting = function resolveNesting(template, cb) {
  var lastNested = template.lastIndexOf('$(');
  if (lastNested === -1) cb(null, template);
  else {
    var brackets = 1;
    var index = lastNested + 2;

    while (brackets > 0) {
      if (template[index+1] && template[index] === '$' && template[index+1] === '(') {
        brackets += 1;
      } else if (template[index] === ')') {
        brackets -= 1;
      }
      index += 1;
    }

    var nestedMacro = template.substring(lastNested+2, index-1),
      firstSpace = nestedMacro.indexOf(' '),
      name = firstSpace === -1 ? nestedMacro : nestedMacro.substring(0, firstSpace),
      args = firstSpace === -1 ? [] : nestedMacro.substring(firstSpace+1).split(' ');

    applyMacro(name, args, function(err, result) {
      resolveNesting(template.slice(0, lastNested) + result + template.slice(index), cb);
    });
  }
};

var isRecursive = function isRecursive(name, template) {
  var nestedMacros = template.match(/\$\(.*?(\)|\ )/g);

  if (!nestedMacros) return false;

  nestedMacros = nestedMacros.map(function (str) {
    var firstSpace = str.indexOf(' ');
    return str.substring(2, firstSpace === -1 ? (str.length - 1) : firstSpace);
  });

  return nestedMacros.some(function (macro) {
    return macro === name || (macros[macro] && isRecursive(name, macros[macro]));
  });
};

var badBrackets = function badBrackets(template) {
  var index = 0,
    brackets = 0;

  while (template[index]) {
    if (template.substring(index, index + 2) === '$(') {
      brackets += 1;
    } else if (template[index] === ')') {
      brackets -= 1;
    }
    index += 1;
  }
  if (brackets > 0) return true;
  return false;
};

var macro = function macro(argv, response, logger) {
  loadMacros();

  if (argv.length < 2) {
    logger.error('`macro` called incorrectly: ', argv);
    response.end(errMsgs.incorrectUsage);
    return;
  }

  var subcmd = argv[1];

  if (subcmd === 'set') {
    var name = argv[2];
    var template = argv.slice(3).join(' ').split('\n')[0];

    if (template.length <= 0) {
      response.end(errMsgs.cantBeEmpty);
      return;
    } else if (badBrackets(template)) {
      response.end(errMsgs.badBrackets);
      return;
    } else if (isRecursive(name, template)) {
      response.end(errMsgs.cantBeRecursive);
      return;
    }

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
      var reply = result || errMsgs.noMacro;
      logger.log(lfmt.format('Sending reply: {{reply}}', {
        reply: reply
      }));
      response.end(reply);
    });
  }
};

macro.metadata = {
  name: 'macro',
  command: 'macro',
  info: {
    description: 'Set a string template macro',
    usage: 'macro [set {template}|{name} {variables...}]'
  }
};

module.exports = macro;
