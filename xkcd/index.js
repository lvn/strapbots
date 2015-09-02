

var google = require('google');

module.exports = function xkcd(argv, response) {
  var siteQuery = 'site:xkcd.com/*/ -site:*.xkcd.com -site:*-*.xkcd.com';
  var query = [siteQuery].concat(argv).join(' ');
  google(query, function handleResults(err, next, links) {
    if (err) {
      console.error(err);
      return;
    }

    if (links.length <= 0) {
      console.error('no xkcd found for', argv.join(' '));
      return;
    }

    var result = links[0];
    response.write(result.title + ' ' + result.link);
    response.end();
  });
};
