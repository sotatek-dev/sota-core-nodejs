/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var async                 = require('async');
var google                = require('googleapis');
var SocialNetworkService  = require('./SocialNetworkService');
var ErrorFactory          = require('../error/ErrorFactory');
var GooglePlus            = google.plus('v1');
var GooglePeople          = google.people('v1');
var OAuth2                = google.auth.OAuth2;
var logger                = log4js.getLogger('Core.GoogleService');

module.exports = SocialNetworkService.extends({
  classname: 'GoogleService',

  getUserSocialModel: function () {
    return this.getModel('UserGoogleModel');
  },

  getSocialConnectedProperty: function () {
    return 'isGoogleConnected';
  },

  getUserDefFromInfo: function (info, callback) {
    return callback(null, {
      email: info.email,
      full_name: info.displayName,
      avatar_url: info.image ? info.image.url : null,
      is_google_connected: 1
    });
  },

  _getGoogleInfo: function (params, callback) {
    var self = this;
    var oauth2Client = null;

    async.waterfall([
      function (next) {
        self.getOauth2Client(params, next);
      },

      function (ret, next) {
        oauth2Client = ret;
        self.getGooglePlus().people.get({
          userId: 'me',
          auth: oauth2Client
        }, next);
      }
    ], function (err, info) {
      // Invalid Credentials, try to refresh token once
      if (err && err.code === 401 && oauth2Client !== null) {
        logger.error('Unauthorized from Google. Trying to refresh token and request again');
        return self._retryGetGoogleInfo(oauth2Client, callback);
      }

      return callback(err, _.assign(info, params));
    });
  },

  _retryGetGoogleInfo: function (oauth2Client, callback) {
    var self = this;
    oauth2Client.refreshAccessToken(function (err, tokens) {
      if (err) {
        return callback(err);
      }

      var plus = self.getGooglePlus();

      plus.people.get({
        userId: 'me',
        auth: oauth2Client
      }, callback);
    });
  },

  getUserByToken: function (params, callback) {
    var self = this;
    async.waterfall([
      function info(next) {
        self._getGoogleInfo(params, next);
      },

      function getUser(info, next) {
        return self.findOrCreateUserBySocialInfo(info, next);
      }
    ], callback);
  },

  linkUserByToken: function (userId, params, callback) {
    var self = this;
    async.waterfall([
      function info(next) {
        self._getGoogleInfo(params, next);
      },

      function tryToLinkUser(info, next) {
        return self.linkUserBySocialInfo(userId, info, next);
      }
    ], callback);
  },

  getOauth2Client: function (params, callback) {
    if (params.accessToken && params.refreshToken) {
      return callback(null, this.getOauth2ClientSync(params.accessToken, params.refreshToken));
    }

    if (!params.authCode) {
      return callback(ErrorFactory.badRequest('Auth code is required.'));
    }

    var oauth2Client = new OAuth2(
      process.env.GOOGLE_APP_ID,
      process.env.GOOGLE_APP_SECRET,
      process.env.APP_ENDPOINT
    );

    oauth2Client.getToken(params.authCode, function (err, tokens) {
      if (err) {
        logger.warn(err);
        return callback(err);
      }

      params.access_token = tokens.access_token;
      params.refresh_token = tokens.refresh_token;
      oauth2Client.setCredentials(tokens);
      return callback(null, oauth2Client);
    });
  },

  getOauth2ClientSync: function (accessToken, refreshToken) {
    var oauth2Client = new OAuth2(
      process.env.GOOGLE_APP_ID,
      process.env.GOOGLE_APP_SECRET,
      process.env.APP_ENDPOINT
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    return oauth2Client;
  },

  getGooglePlus: function () {
    return GooglePlus;
  },

  getGooglePeople: function () {
    return GooglePeople;
  }

});
