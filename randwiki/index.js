
var wikipedia = require('node-wikipedia'),
  lfmt = require('lfmt');

var randwiki = function(match, response, logger) {
  wikipedia.dial({
    rnnamespace: 0,
    action: 'query',
    list: 'random',
    rnlimit: 1
  }, {
    lang: 'en'
  }, function(body, url) {
    var id = body.query.random[0].id;

    wikipedia.dial({
      action: 'query',
      pageids: id,
      prop: 'extracts',
      explaintext: 1,
      exsentences: 2
    }, { lang: 'en' }, function(body, url) {
      var item = body.query.pages[id],
        title = item.title,
        result = item.extract;

      logger.log(lfmt.format('got article {{title}} with body: {{body}}', {
        title: title,
        body: result
      }))

      response.end(lfmt.format('wikipedia says {{topic}} is "{{result}}"', {
        topic: match[4],
        result: result
      }));
    })
  });
};

module.exports = randwiki;
