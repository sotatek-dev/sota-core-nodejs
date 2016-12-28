var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseController.extends({
  classname: 'SocialNetworkController',

  linkFacebookAccount: function(req, res) {
    // TODO
  },

  linkTwitterAccount: function(req, res) {
    // TODO
  },

});
