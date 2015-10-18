'use strict';

var lfmt = require('lfmt');

var errorMsgs = {
  noSuchCommand: 'Could not find the command {{query}}',
  noHelpData: 'No documentation was provided for the command {{name}}',
  noDesc: '(No description was provided for the command {{name}})'
};

var helpPageTemplate = '{{name}} -- {{description}}';

// given a root (as an object), find subcommand as a path.
var findCommand = function findCommand(root, path) {

  var node = root;
  var child;
  while (path.length > 0) {
    var target = path.shift();

    child = node.subcommands &&
      node.subcommands.length > 0 &&
      node.subcommands[target];

    if (!child) {
      break;
    }
  };

  return child;
};

var renderHelpPage = function buildHelpPage(query, command) {
  if (!command) {
    return lfmt.format(errorMsgs.noSuchCommand, {
      query: query
    });
  }

  if (!command.metadata || command.metadata.info) {
    return lfmt.format(errorMsgs.noHelpData, {
      name: command.name || query
    });
  }

  var rendered = lfmt.format(helpPageTemplate, {
    name: command.name || query,
    description: command.metadata.info.description ||
      command.metadata.description ||
      errorMsgs.noDesc
  });

  var usage = command.metadata.info ?
    command.metadata.info.usage : command.metadata.usage;
  if (usage) {
    rendered += lfmt.format('\nUsage: `{{usage}}`', {
      usage: usage
    });
  }

  var subcommands = command.metadata.subcommands;
  if (subcommands && subcommands.length > 0) {
    rendered += lfmt.format('\nSubcommands:')
    subcommands.forEach(function(subcommand) {
      rendered += lfmt.format('\n- {{name}}: `{{description}}`', {
        name: subcommand.name,
        description: subcommand.description || errorMsgs.noDesc
      });
    });
  };

  return rendered;
}

var help = function help(argv, bot, response, logger) {
  logger.log(lfmt.format('Got help query "{{command}}"', {
    command: argv.join(' ')
  }));

  var query = argv.slice(1),
    commands = bot.commands;

  if (query.length > 0) {
    var command = findCommand(commands, query);
    response.end(renderHelpPage(query, command));
  }
  else {
    var commandSet = new Set();
    var commandList = Object.keys(commands)
      .filter(function filterStep(name) {
        return !commandSet.has(commands[name]) && commandSet.add(commands[name]);
      })
      .map(function renderStep(name) {
        var command = commands[name];
        if (!command.metadata) {
          return lfmt.format('`{{name}}`', {
            name: name
          });
        }

        name = command.metadata.name || name;

        if (!command.metadata.info) {
          return lfmt.format('`{{name}}`', {
            name: name
          });
        }
        var description = command.metadata.info.description;

        return lfmt.format('`{{name}}` - {{description}}', {
          name: name,
          description: description
        });
      })
      .join('\n');

    response.end(commandList);
  };
};

help.metadata = {
  name: 'help',
  command: 'help',
  description: 'Shows help page for commands',
  usage: 'help {command}'
};

module.exports = help;
