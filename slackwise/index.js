'use strict';

let util = require('./lib/util');
let Splitwise = require('./lib/splitwise').Splitwise;
let imgur = require('imgur');
let graphviz = require('graphviz');
let fs = require('fs');

let sw = null;

let slackwise = (user, message, config, logger, response) => {
  sw.getGroup(config.swGroupId, (error, data, _) => {
    if (error) {
      logger.error(`Splitwise API error ${JSON.stringify(error)}`);
      return;
    }

    let groupData = JSON.parse(data).group;
    let groupMembers = {};
    let balanceGraph = graphviz.digraph("Debts");

    groupData.members.forEach(member => {
      member.fullName = util.formatName(member);
      groupMembers[member.id] = member.fullName;
      member.graphNode = balanceGraph.addNode(`${member.id}`, {
        label: member.fullName
      });
    });

    groupData.simplified_debts.forEach(debt => {
      let edge = balanceGraph.addEdge(`${debt.from}`, `${debt.to}`, {
        label: util.formatDebtLabel(debt, config.defaultCurrencyCode)
      });
    });

    let imgPath = `/tmp/balanceGraph${Date.now()}.png`;
    balanceGraph.output('png', (rendered) => {
      fs.writeFile(imgPath, rendered, () => {
        imgur.uploadFile(imgPath)
          .then(res => response.end(res.data.link))
          .catch(error => {
            logger.error(`Error uploading splitwise graph to imgur: ${error.message}`);
          });
      });
    });
  });
};

slackwise.setup = (config) => {
  sw = new Splitwise(config.swConsumerKey, config.swConsumerSecret,
    config.swAccessToken, config.swAccessTokenSecret);
  imgur.setClientId(config.imgurClientId);
};

slackwise.metadata = require('./plugin');
module.exports = slackwise;
