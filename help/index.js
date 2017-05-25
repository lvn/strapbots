'use strict';

var lfmt = require('lfmt');

var errorMsgs = {
  noSuchCommand: 'Could not find the command {{query}}',
  noHelpData: 'No documentation was provided for the command {{name}}',
  noDesc: '(No description was provided for the command {{name}})'
};

var helpPageTemplate = '{{name}} -- {{description}}';

// given a root (as an object), find subcommand as a path.
var findCommand = function findCommand(root, query) {

  var node = root;
  var child;
  var path = query.slice();
  while (path.length > 0) {
    var target = path.shift();

    var subcommands = node.metadata && node.metadata.subcommands || node;
    child = subcommands[target];

    if (child.alias) {
      child = subcommands[child.alias];
    }

    if (!child) {
      break;
    }
    node = child;
  };

  return node;
};

var renderHelpPage = function buildHelpPage(query, command) {
  if (!command) {
    return lfmt.format(errorMsgs.noSuchCommand, {
      query: query
    });
  }

  if (!command.metadata && !command.description) {
    return lfmt.format(errorMsgs.noHelpData, {
      name: command.name || query.join(' ')
    });
  }

  var metadata = command.metadata || command;

  var rendered = lfmt.format(helpPageTemplate, {
    name: query.join(' '),
    description: (metadata.info && metadata.info.description) ||
      metadata.description ||
      errorMsgs.noDesc
  });

  var usage = metadata.info ? metadata.info.usage : metadata.usage;
  if (usage) {
    usage = Array.isArray(usage) ? usage : [usage];
    rendered += lfmt.format('\nUsage:');
    usage.forEach(function(item) {
      rendered += lfmt.format('\n- `{{item}}`', {
        item: item
      });
    });
  }

  var subcommands = metadata.subcommands;
  if (subcommands) {
    rendered += lfmt.format('\nSubcommands:')
    Object.keys(subcommands).forEach(function(key) {
      var subcommand = subcommands[key];
      rendered += lfmt.format('\n- `{{name}}`: {{description}}', {
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

        if (!command.metadata.info && !command.metadata.description) {
          return lfmt.format('`{{name}}`', {
            name: name
          });
        }
        var description = command.metadata.info ?
          command.metadata.info.description :
          command.metadata.description;

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

help.setup = (bot) => {
  bot.service('helpService', (bot, logger) => {
    return {
      findCommand: findCommand,
      renderHelpPage: renderHelpPage,
      getHelpPage: query => renderHelpPage(query,
        findCommand(bot.commands, query))
    };
  });

  bot.command('help', help);
}

module.exports = help;
