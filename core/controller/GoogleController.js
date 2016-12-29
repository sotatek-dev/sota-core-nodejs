var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseController.extends({
  classname: 'GoogleController',

  login: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      accessToken: ['required', 'string'],
      refreshToken: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var AuthService = req.getService('AuthService');
    AuthService.getUserGoogle(
      params.accessToken, params.refreshToken,
      this.ok.bind(this, req, res)
    );
  },

  link: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      accessToken: ['required', 'string'],
      refreshToken: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var GoogleService = req.getService('GoogleService');
    GoogleService.linkUserByToken(
      req.user.id, params.accessToken, params.refreshToken,
      this.created.bind(this, req, res)
    );
  },

  unlink: function(req, res) {
    var self = this;
    var userId = req.user.id;

    var UserGoogleModel = req.getModel('UserGoogleModel');
    UserGoogleModel.remove(userId, this.deleted.bind(this, req, res));
  },

});
