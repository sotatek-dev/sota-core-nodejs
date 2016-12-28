var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseController.extends({
  classname: 'FacebookController',

  login: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      fb_access_token: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var AuthService = req.getService('AuthService');
    AuthService.getUserFacebook(params.fb_access_token, this.ok.bind(this, req, res));
  },

  link: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      fb_access_token: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var FacebookService = req.getService('FacebookService');
    FacebookService.linkUserByToken(
      req.user.id, params.fb_access_token,
      this.created.bind(this, req, res)
    );
  },

  unlink: function(req, res) {
    var self = this;
    var userId = req.user.id;

    var UserFacebookModel = req.getModel('UserFacebookModel');
    UserFacebookModel.remove(userId, this.deleted.bind(this, req, res));
  },

});
