
var request = require('request');
var qs = require('querystring');

var icons = {
  '01d': ['sunny'],
  '01n': ['moon'],
  '02d': ['cloud', 'sunny'],
  '02n': ['cloud', 'moon'],
  '03': ['cloud'],
  '04': ['cloud', 'cloud'],
  '09': ['droplet', 'droplet', 'droplet'],
  '10': ['droplet', 'cloud'],
  '11': ['cloud', 'zap'],
  '13': ['cloud', 'snowflake'],
  '50': ['foggy']
};

var tempUnit = {
  'metric': '°C',
  'imperial': '°F',
  'default': '°K'
};

var main = function main(argv, response, logger) {
  var queryLoc = argv.slice(1).join(' ') || main.metadata.defaultLoc;

  // config things
  var apiRoot = main.metadata.apiRoot;
  var appId = main.metadata.appId;
  var unitSystem = main.metadata.units;

  if (!appId) {
    response.end(':question: :key: (API key not properly configured)')
    return;
  }

  logger.log('Got weather command with arguments', argv.slice(1));
  var reqUrl = apiRoot + qs.stringify({
    appid: appId,
    q: queryLoc,
    units: unitSystem
  });

  request.get(reqUrl, function(err, res, body) {
    body = JSON.parse(body);

    if (err || res.statusCode != 200 || body.cod != 200 ) {
      logger.error('Weather API call to', reqUrl, 'errored', err,
        'with status code', body.cod || res.statusCode)
      response.end(':question: :exclamation:');
      return;
    }

    var wIcon = body.weather[0].icon;
    var resBody = (icons[wIcon] || icons[wIcon.slice(0, 2)])
      .map(function(emoji) {
        return ':' + emoji + ':';
      })
      .join(' ') + ' ';

    if (queryLoc.toLowerCase() != body.name.toLowerCase()) {
      resBody = 'Assuming ' + body.name + ', ' + body.sys.country +': ' + resBody
    }

    if (typeof body.main.temp === 'number') {
      resBody += body.main.temp + tempUnit[unitSystem];
    }
    response.end(resBody);
  });
};

main.metadata = require('./plugin');
module.exports = main;
