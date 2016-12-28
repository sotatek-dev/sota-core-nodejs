var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseController.extends({
  classname: 'SocialNetworkController',

  linkFacebookAccount: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      fb_access_token: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var FacebookService = req.getService('FacebookService');
    FacebookService.linkUser(req.user.id, params.fb_access_token, this.ok.bind(this, req, res));
  },

  linkTwitterAccount2: function(req, res) {
    // TODO
  },

});
