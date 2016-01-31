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
  badBrackets: 'Macro has mismatched brackets!',
  noMacros: 'There are no macros.',
  nameReserved: 'Can\'t overwrite a builtin macro.',
  emptyResponse: '<result was empty>',
  removedMacro: `It is done. The macro \`{{name}}\` will trouble you no more.
For the record, it used to be \`\`\`{{template}}\`\`\``
};

var builtInMacros = {};
builtInMacros.echo = function(cb, args) {
  cb(null, args.join(' '));
};
builtInMacros.echo.description = 'returns the arguments';
builtInMacros.e = builtInMacros.echo;

builtInMacros.if = function(cb, args) {
  cb(null, args[0] ? args[1] : args[2]);
};
builtInMacros.if.description = 'if $0, then returns $1, else $2'

builtInMacros.random = function(cb, args) {
  cb(null, args[Math.floor(Math.random() * args.length)]);
};
builtInMacros.random.description = 'returns randomly from arguments';

builtInMacros.hmap = function(cb, args) {
  var valmap = {};
  var key = args.pop();
  while (args.length > 0) {
    valmap[args.shift()] = args.shift();
  };
  cb(null, valmap[key]);
};
builtInMacros.hmap.description = 'takes the last argument as a lookup key in a mapping of every first argument to every second argument.';

builtInMacros.map = function(cb, args) {
  var callee = args.shift();
  var aggResult = [];
  var stack = this.stack;
  Array.prototype.concat.apply([], args).forEach(function(arg) {
    baseApplyMacro(callee, [arg], function(err, result) {
      aggResult.push(result);
    }, stack);
  });
  cb(null, aggResult.join(' '));
};
builtInMacros.map.description = 'Returns the aggregate result of every argument passed through the same macro.';

builtInMacros.apply = function(cb, args) {
  baseApplyMacro(args[0], args[1].split(' '), cb, this.stack);
};
builtInMacros.apply.description = 'Applies the macro as given by $0, using $1 (split by spaces) as the arguments.';

builtInMacros.splitc = function(cb, args) {
  cb(null, args.join('').split('').join(' '));
};
builtInMacros.apply.description = 'Returns the arguments split into string-delmited characters';

builtInMacros.grid = function(cb, args) {
  var parts = args.join(' ').split(' ');
  var result = '';
  parts.forEach(function() {
    result += parts.join(' ') + '\n';
    parts.push(parts.shift());  // cycle first element to the end
  });
  cb(null, result);
};
builtInMacros.grid.description = 'Makes a grid out of word shifts';

builtInMacros.replace = function(cb, args) {
  var text = args[0] || '';
  var pattern = args[1];
  var replacement = args[2];

  try {
    var result = text.replace(new RegExp(pattern, 'g'), replacement);
    cb(null, result);
  }
  catch (e) {
    cb(new Error('Bad regex `' + pattern + '`'));
  }
};
builtInMacros.replace.description = 'Given $0 as text, replace all instances of $1 (regex) with $2';

const OPENBRK = '$(';
const CLOSEBRK = ')';

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
          template = decodeURIComponent(record.slice(spaceIndex + 1));

        template.length > 0 ?
          (macros[name] = template) :
          (delete macros[name]);

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
  template.length > 0 ?
    (macros[name] = template) :
    (delete macros[name]);

  fs.appendFile(saveFile, lfmt.format('{{name}} {{template}}\n', {
    name: name,
    template: encodeURIComponent(template)
  }), function(err) {
    if (err) console.error(err);
    cb && cb(null);
  });
};

var removeMacro = function removeMacro(name, cb) {
  if (macros[name]) {
    var oldTemplate = macros[name];
    addMacro(name, '', function(err) {
      if (err) console.error(err);
      cb && cb(null, oldTemplate);
    });
  }
  else {
    cb && cb(new Error(errMsgs.noMacro));
  }
};

var baseApplyMacro = function baseApplyMacro(callee, args, cb, callStack) {
  var template = macros[callee];
  if (!template) {
    cb && cb(new Error('Macro not found'));
    return;
  }

  var result;
  if (typeof template === 'function') {
    template.call({
      stack: callStack
    }, cb, args);
  }
  else {
    // this converts it to valid macro source.
    var resultSrc = template
      .replace(/\$@/g, args.join(' '))
      .replace(/\$(\d+)/g, function(match, p1) {
        return (args[Number(p1)] || '');
      });

    // tokenize and parse this source
    var tokens = tokenizeExpr(resultSrc);
    if (tokens.indexOf(OPENBRK) !== -1) {
      parseTokens(tokens, 'echo', cb, callStack);
    } else {
      cb(null, resultSrc);
    }
  }
};


var tokenizeExpr = function tokenizeExpr(expr) {
  return expr.split(/(\$\(|\)|\s)/g)
    .filter(function(s) {
      return s.trim().length
    });
};

var parseTokens = function parseTokens(tokens, callee, cb, callStack) {
  // hack: if no cb, we don't have to do anything since everything we do
  // is invisible.
  if (!cb) {
    return;
  }

  // do call stack things
  callStack = callStack || [];
  callStack.push(callee);

  // initialize nesting stack
  var stack = [];
  var stackFrame = {
    callee: callee,
    args: []
  };

  callStack = callStack || [];

  // read tokens left to right
  while (tokens.length > 0) {
    var token = tokens.shift();
    if (token === OPENBRK) {
      var newCallee = tokens.shift();
      if (callStack.length > 500) {
        cb(new Error(errMsgs.cantBeRecursive));
        break;
      }
      else if (macros[newCallee] === undefined) {
        cb(new Error(errMsgs.noMacro));
        break;
      }
      else {
        stack.push(stackFrame);
        stackFrame = {
          callee: newCallee,
          args: []
        };
      }
    }
    else if (token === CLOSEBRK && stack.length > 0) {
      baseApplyMacro(stackFrame.callee, stackFrame.args,
        function (err, result) {
          if (err) {
            cb(err);
            return;
          }
          stackFrame = stack.pop();
          stackFrame.args.push(result);
        });
    }
    else {
      stackFrame.args.push(token);
    }
  }

  baseApplyMacro(stackFrame.callee, stackFrame.args, cb);
};

var interpretExpr = function interpretExpr(expr, cb) {
  var tokens = tokenizeExpr(expr);
  parseTokens(tokens, 'echo', cb);
};

// extract and replace formatted URLs.
var unescapeLinks = function unescape(message) {
  var linkRegex = /<([^(#C)(@U)\!][^\|]*)\|*(.*)>/;
  return message.replace(linkRegex, function(match, p1, p2) {
    return p2 || p1;
  });
};

var macro = function macro(argv, message, response, config, logger) {
  logger.log('macro called with message', message);
  loadMacros();

  // load builtins
  macros = Object.assign(macros, builtInMacros);

  if (argv.length < 2) {
    logger.error('`macro` called incorrectly: ', argv.join(' '));
    response.end(errMsgs.incorrectUsage);
    return;
  }

  var subcmd = argv[1];

  if (subcmd === 'set') {
    var name = argv[2];
    if (builtInMacros[name]) {
      response.end(errMsgs.nameReserved);
      return;
    };

    var template = unescapeLinks(argv.slice(3).join(' '));

    var oldTemplate = macros[name];
    addMacro(name, template, function(err) {
      if (!err) {
        if (template.length >= 0) {
          var respBody = (oldTemplate ?
            lfmt.format('Overwriting old template ```{{oldTemplate}}```\n', {
              oldTemplate: oldTemplate
            }) : '');
          respBody += lfmt.format('Successfully macroed {{name}} to ```{{template}}```', {
            name: name,
            template: template
          });
        }
        else {
          response.endf(errMsgs.removedMacro, {
            name: name,
            template: oldTemplate
          });
        }
        response.end(respBody);
      }
    });
  }
  else if (subcmd === 'list') {
    var expand = (argv.indexOf('--expand') !== -1);
    var resBody = Object.keys(macros)
      .filter(function(key) {
        return (!expand || argv.length < 4 || argv.slice(3).indexOf(key) !== -1);
      })
      .map(function(key) {
        if (!expand) return key;
        var macro = macros[key];
        return lfmt.format('{{name}} - ```{{template}}```', {
          name: key,
          template: typeof macro === 'function' ?
            lfmt.format('<builtin - {{description}}>', macro) :
            macro
        });
      })
      .join(expand ? '\n': ', ');

    resBody = resBody || errMsgs.noMacros;
    response.end(resBody);
  }
  else if (subcmd === 'unset') {
    var name = argv[2];
    if (builtInMacros[name]) {
      response.end(errMsgs.nameReserved);
      return;
    };

    removeMacro(name, function(err, result) {
      if (!err) {
        response.endf(errMsgs.removedMacro, {
          name: name,
          template: result
        });
      }
      else {
        response.endf('Error unsetting macro {{name}}: {{error}}', {
          name: name,
          error: err
        });
      }
    });
  }
  else {
    var callee = subcmd;
    var tokens = tokenizeExpr(argv.slice(2).join(' '));
    parseTokens(tokens, callee, function(err, result) {
      if (err) {
        logger.log(lfmt.format('Got error: {{error}}', {
          error: err
        }));
        response.end(err.toString());
      }
      else {
        var reply = result || errMsgs.emptyResponse;
        logger.log(lfmt.format('Sending reply to {{channel}}: {{reply}}', {
          channel: response.channel.name,
          reply: reply
        }));
        response.end(reply);
      }
    });
  }
};

macro.metadata = require('./plugin');

module.exports = macro;
