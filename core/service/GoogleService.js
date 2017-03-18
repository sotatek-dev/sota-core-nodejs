/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var async                 = require('async')
var google                = require('googleapis')
var SocialNetworkService  = require('./SocialNetworkService')
var GooglePlus            = google.plus('v1')
var GooglePeople          = google.people('v1')
var OAuth2                = google.auth.OAuth2
var logger                = log4js.getLogger('GoogleService')

module.exports = SocialNetworkService.extends({
  classname: 'GoogleService',

  getUserSocialModel: function () {
    return this.getModel('UserGoogleModel')
  },

  getSocialConnectedProperty: function () {
    return 'isGoogleConnected'
  },

  getUserDefFromInfo: function (info, callback) {
    return callback(null, {
      email: info.email,
      full_name: info.displayName,
      avatar_url: info.image ? info.image.url : null,
      is_google_connected: 1
    })
  },

  _getGoogleInfo: function (accessToken, refreshToken, callback) {
    var self = this

    var oauth2Client = new OAuth2(
      process.env.GOOGLE_APP_ID,
      process.env.GOOGLE_APP_SECRET,
      process.env.APP_ENDPOINT
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // return this._retryGetGoogleInfo(oauth2Client, callback)

    var plus = this.getGooglePlus()

    plus.people.get({
      userId: 'me',
      auth: oauth2Client
    }, function (err, info) {
      // Invalid Credentials, try to refresh token once
      if (err && err.code === 401) {
        logger.error('Unauthorized from Google. Trying to refresh token and request agaim')
        return self._retryGetGoogleInfo(oauth2Client, callback)
      }

      return callback(err, info)
    })
  },

  _retryGetGoogleInfo: function (oauth2Client, callback) {
    var self = this
    oauth2Client.refreshAccessToken(function (err, tokens) {
      if (err) {
        return callback(err)
      }

      var plus = self.getGooglePlus()

      plus.people.get({
        userId: 'me',
        auth: oauth2Client
      }, callback)
    })
  },

  getUserByToken: function (accessToken, refreshToken, callback) {
    var self = this
    async.waterfall([
      function info (next) {
        self._getGoogleInfo(accessToken, refreshToken, next)
      },
      function getUser (info, next) {
        info.access_token = accessToken
        info.refresh_token = refreshToken
        return self.findOrCreateUserBySocialInfo(info, next)
      }
    ], callback)
  },

  linkUserByToken: function (userId, accessToken, refreshToken, callback) {
    var self = this
    async.waterfall([
      function info (next) {
        self._getGoogleInfo(accessToken, refreshToken, next)
      },
      function tryToLinkUser (info, next) {
        return self.linkUserBySocialInfo(userId, info, next)
      }
    ], callback)
  },

  getOauth2Client: function (accessToken, refreshToken) {
    var oauth2Client = new OAuth2(
      process.env.GOOGLE_APP_ID,
      process.env.GOOGLE_APP_SECRET,
      process.env.APP_ENDPOINT
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    return oauth2Client
  },

  getGooglePlus: function () {
    return GooglePlus
  },

  getGooglePeople: function () {
    return GooglePeople
  }

})
