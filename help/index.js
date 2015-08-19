'use strict';

var lfmt = require('lfmt');

var errorMsgs = {
  noSuchCommand: 'Could not find the command {{query}}',
  noHelpData: 'No documentation was provided for the command {{name}}',
  noDesc: '(No description was provided for the command {{name}})'
};

var helpPageTemplate = '{{name}} -- {{description}}';

var renderHelpPage = function buildHelpPage(query, command) {
  if (!command) {
    return lfmt.format(errorMsgs.noSuchCommand, {
      query: query
    });
  }

  if (!command.metadata || !command.metadata.info) {
    return lfmt.format(errorMsgs.noHelpData, {
      name: command.name || query
    });
  }

  var rendered = lfmt.format(helpPageTemplate, {
    name: command.name || query,
    description: command.metadata.info.description || errorMsgs.noDesc
  });

  if (command.metadata.info.usage) {
    rendered += lfmt.format('\nUsage: `{{usage}}`', {
      usage: command.metadata.info.usage
    });
  }

  return rendered;
}

var help = function help(argv, bot, response, logger) {
  logger.log(lfmt.format('Got help query "{{command}}"', {
    command: argv.join(' ')
  }));

  var query = argv.slice(1)[0],
    commands = bot.commands;

  if (query) {
    var command = commands[query];
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
          return name;
        }

        name = command.metadata.name || name;

        if (!command.metadata.info) {
          return name;
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
  info: {
    description: 'Shows help page for commands',
    usage: 'help {command}'
  }
};

module.exports = help;
