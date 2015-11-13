'use strict';

var request = require('request');
var qs = require('querystring');
var chrono = require('chrono-node');
var moment = require('moment');

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

var iconToEmoji = function iconToEmoji(key) {
  var result = (icons[key] || icons[key.slice(0, 2)])
    .map(function(emoji) {
      return ':' + emoji + ':';
    })
    .join(' ') + ' ';
  return result;
};

var tempUnit = {
  'metric': '°C',
  'imperial': '°F',
  'default': '°K'
};

var ms = {}
ms.inSecond = 1000;
ms.inMinute = 60 * ms.inSecond;
ms.inHour = 60 * ms.inMinute;
ms.inDay = 24 * ms.inHour;

var NONE = 'none';

var normalize = function(str) {
  return str.toLowerCase().replace(/\s/g, '');
};

// Basic date comparator that checks if a is greater than, less than, or equal
// to b, where some threshold (defaulting to 1000 ms) is given for checking
// approximate equivalency.
// If a > b, returns some d > 0.
// If a ~= b, return 0.
// If a < b, returns some d < 0.
var cmpDate = function cmpDate(a, b, threshold) {
  a = a || Date.now();
  b = b || Date.now();
  threshold = threshold || ms.inSecond;

  var diff = a - b;
  return Math.abs(diff) > threshold ? diff : 0;
};

// parse a query for the location and time.
var parseQuery = function parseQuery(query) {
  var result = {};
  var parsedChrono = chrono.parse(query)[0];

  if (parsedChrono) {
    result.when = parsedChrono.start.date();
    result.where = query.split(parsedChrono.text)[0].trim();

    if (!result.where) {
      delete result.where;
    }
  }
  else {
    result.where = query;
  }

  return result;
};

var parseBody = function parseBody(body, query, config) {
  var wIcon = body.weather[0].icon;
  var resBody = iconToEmoji(body.weather[0].icon);

  var queryName = normalize(query.where);
  var location = body.sys;
  var cityName = body.name || body.sys.name;
  var actualName = normalize(((location.country === NONE) ?
    [body.name] :
    [body.name, location.country]).join(','));

  if (queryName != actualName) {
      resBody = 'Assuming ' + cityName + ', '
        + location.country + ': ';
  }

  if (typeof body.main.temp === 'number') {
    resBody += body.main.temp + ' ' + tempUnit[config.units];
  }

  return resBody;
};

var parseBodyForecast = function parseBodyForecast(body, query, config) {
  var forecastStart = new Date((body.list[0].dt * ms.inSecond));
  var queryWhenUtc = new Date(query.when +
    (forecastStart.getTimezoneOffset() * ms.inMinute));
  var indx = Math.round((queryWhenUtc - forecastStart) / (3 * ms.inHour));

  if (indx >= 0 && indx < body.list.length) {
    var forecastEntry = body.list[indx];

    forecastEntry.sys = body.city;  // hack: normalize forcast format
    var resBody = parseBody(forecastEntry, query, config);

    resBody += ' on ' + moment(forecastEntry.dt * ms.inSecond)
      .format(config.dateFormat);

    return resBody;
  };

  return config.errMsgs.cantSeeFuture;
};

var parseBodyHistory = function parseBodyForecast(body, query, config) {
  return config.errMsgs.cantSeePast;
};

var bodyParsers = {
  history: parseBodyHistory,
  forecast: parseBodyForecast,
  weather: parseBody
};

var main = function main(argv, response, logger, config) {
  var query = parseQuery(argv.slice(1).join(' '));
  query.where = query.where || config.defaultLoc;
  var queryTime = query.when;
  var timeDiff = cmpDate(queryTime);

  // config things
  var apiRoot = config.apiRoot;
  var apiEndpoint = (
    (timeDiff > 0 && config.endpoints.forecast) ||
    (timeDiff < 0 && config.endpoints.history) ||
    config.endpoints.default);
  var appId = config.appId;

  if (!appId) {
    response.end(config.errMsgs.apiKey)
    return;
  }

  logger.log('Got weather command with query', query);
  var reqUrl = apiRoot + apiEndpoint + '?' + qs.stringify({
    appid: appId,
    q: query.where,
    units: config.units
  });

  if (apiEndpoint === config.endpoints.history) {
    // hack: no API access to history endpoint for now
    response.end(config.errMsgs.cantSeePast);
    return;
  }

  request.get(reqUrl, function(err, res, body) {
    if (err) {
      logger.error('Weather API call to', reqUrl, 'errored', err)
      response.end(config.errMsgs.generic);
      return;
    }

    body = JSON.parse(body);
    if ((res.statusCode != 200) ||
      (parseInt(body.cod) != 200)) {
      logger.error('Weather API call to', reqUrl, 'errored',
        'with status code', body.cod || res.statusCode)
      response.end(config.errMsgs.generic);
      return;
    }

    var resBody = bodyParsers[apiEndpoint](body, query, config);
    response.end(resBody);
  });
};

main.metadata = require('./plugin');
module.exports = main;
