'use strict';

var request = require('request');
var qs = require('querystring');
var chrono = require('chrono-node');
var moment = require('moment');

var util = require('./lib/util');
var normalize = util.normalize;
var cmpDate = util.cmpDate;
var tryRemove = util.tryRemove;
var iconToEmoji = util.iconToEmoji;
var toKmPerHr = util.toKmPerHr;
var renderWindEmoji  = util.renderWindEmoji;

const tempUnit = {
  'metric': '°C',
  'imperial': '°F',
  'default': '°K'
};

const tempUnitWords = {
  'metric': ['c', 'celsius', 'metric'],
  'imperial': ['f', 'fahrenheit', 'imperial'],
  'default': ['k', 'kelvin']
};

var ms = {}
ms.inSecond = 1000;
ms.inMinute = 60 * ms.inSecond;
ms.inHour = 60 * ms.inMinute;
ms.inDay = 24 * ms.inHour;

const NONE = 'none';

// parse a query for the location and time.
var parseQuery = function parseQuery(query, config) {
  config = config || {};
  var result = {};

  var queryWords = query.split(' ');
  result.units = Object.keys(tempUnitWords).find(function(unit) {
    return tempUnitWords[unit].some(function(word) {
      return tryRemove(queryWords, word);
    });
  }) || config.units;

  result.detailed = !!tryRemove(queryWords, 'detailed');
  query = queryWords.join(' ');

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
  var resBody = '';

  var queryName = normalize(query.where);
  var location = body.sys;
  var cityName = body.name || body.sys.name;
  var actualName = normalize(((location.country === NONE) ?
    [body.name] :
    [body.name, location.country]).join(','));


  if (queryName != actualName) {
      resBody += `Assuming ${cityName}, ${location.country}: `;
  }

  // add weather icons
  var wIcon = body.weather[0].icon;
  resBody += iconToEmoji(body.weather[0].icon);

  // add wind icons
  resBody += renderWindEmoji(body.wind.speed, query.units) + ' ';

  if (typeof body.main.temp === 'number') {
    resBody += `${body.main.temp} ${tempUnit[query.units]}`;
  }

  if (query.mode != config.endpoints.default) {
    resBody += ' on ' + moment(query.when)
      .format(config.dateFormat);
  }

  if (query.detailed) {
    resBody += '\n\n';
    resBody += `low: ${body.main.temp_min} ${tempUnit[query.units]}\n`;
    resBody += `high: ${body.main.temp_max} ${tempUnit[query.units]}\n`;
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
    query.when = forecastEntry.dt * ms.inSecond

    return parseBody(forecastEntry, query, config);
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
  var query = parseQuery(argv.slice(1).join(' '), config);
  query.where = query.where || config.defaultLoc;
  var queryTime = query.when;
  var timeDiff = cmpDate(queryTime);

  // config things
  var apiRoot = config.apiRoot;
  var apiEndpoint = query.mode = (
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
    units: query.units
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
