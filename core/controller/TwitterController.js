var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseController.extends({
  classname: 'TwitterController',

  link: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      tokenKey: ['required', 'string'],
      tokenSecret: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var TwitterService = req.getService('TwitterService');
    TwitterService.linkUserByToken(
      req.user.id, params.tokenKey, params.tokenSecret,
      this.created.bind(this, req, res)
    );
  },

  unlink: function(req, res) {
     // TODO
  },

});
