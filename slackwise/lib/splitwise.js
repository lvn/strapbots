'use strict';

let OAuth = require('oauth');

const apiRoot = 'https://secure.splitwise.com/api/v3.0';

let getEndpointUrl = (endpoint) => `${apiRoot}/${endpoint}`;

let swAuthorize = (consumerKey, consumerSecret) => {
  let consumer = new OAuth.OAuth(
    getEndpointUrl('get_request_token'),
    getEndpointUrl('get_access_token'),
    consumerKey,
    consumerSecret,
    '1.0',
    null,
    'HMAC-SHA1');

  return consumer;
};

class Splitwise {
  constructor(consumerKey, consumerSecret, accessToken, accessTokenSecret, groupId) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;
    this.groupId = groupId;
    this.consumer = swAuthorize(consumerKey, consumerSecret);
  }

  getGroup(callback) {
    this.consumer.get(
      `${getEndpointUrl('get_group')}/${this.groupId}`,
      this.accessToken,
      this.accessTokenSecret,
      callback
    );
  }
}

exports.Splitwise = Splitwise;
