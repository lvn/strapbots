'use strict';

var redisNamespace = require('redis-namespace');
var util = require('./util');

var initPshService = function initPshService(bot, config) {
  var client = redisNamespace.createClient(
    config.redisNamespace,
    config.redisOpts);

  var service = {};

  var getGroupKey = function(group) {
    return util.prefix(
      util.prefix(group, '@'),
      config.redisKeys.groups + ':');
  };

  service.subscribe = function subscribe(user, groups, cb) {
    var added = 0;
    groups.forEach(function(group) {
      client.sadd(getGroupKey(group), user.id);
      client.sadd(config.redisKeys.groups, group, function(err) {
        if (!err) {
          added++;
          if (added === groups.length) {
            cb();
          }
        }
      });
    });
  };

  service.unsubscribe = function unsubscribe(user, groups, cb) {
    var remd = 0;
    groups.forEach(function(group) {
      client.srem(getGroupKey(group), user.id, function(err) {
        if (!err) {
          remd++;
          if (remd === groups.length) {
            cb();
          }
        }
      });
    });
  };

  service.list = function list(cb) {
    client.smembers(config.redisKeys.groups, cb);
  };

  bot.onMessage(function(message, response) {
    // some heuristics for early return
    if (message.text.startsWith('!')) {
      return;
    }

    var words = message.text.split(' ');

    var mentionGroups = words
      .filter(function(s) {
        return s.startsWith('@');
      })
      .filter(function(s) {
        return s.length > 1;
      })
      .reduce(function(acc, mg) {
        acc[mg] || (acc[mg] = []);
        return acc;
      }, {});

    if (Object.keys(mentionGroups).length <= 0) {
      return;
    }

    var responseMsg = message.text;
    var listedGroupsCount = 0;
    Object.keys(mentionGroups).forEach(function(mg) {
      client.smembers(getGroupKey(mg), function(err, mlist) {
        (mlist.length > 0) ?
          (mentionGroups[mg] = mlist) :
          (delete mentionGroups[mg]);
        listedGroupsCount++;

        if (listedGroupsCount === Object.keys(mentionGroups).length) {
          var res = words.reduce(function(acc, word) {
            mentionGroups[word] && (acc.shouldRespond = true);
            if (mentionGroups[word]) {
              mentionGroups[word].forEach(function(id) {
                acc.combinedMentions.add(id);
              });
            }
            else {
              acc.body.push(util.mentionAllSet(acc.combinedMentions));
              acc.body.push(word);
              acc.combinedMentions.clear();
            }
            return acc;
          }, {
            shouldRespond: false,
            body: [],
            combinedMentions: new Set()
          });
          res.combinedMentions.size &&
            res.body.push(util.mentionAllSet(res.combinedMentions));
          res.shouldRespond && response.end(res.body.join(' '));
        }
      });
    });
  });

  return service;
};

initPshService.metadata = require('./service');
module.exports = initPshService;
