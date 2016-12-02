var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseController.extends({
  classname: 'AuthController',

  generateAccessToken: function(user, expiredTime) {
    expiredTime = expiredTime || Const.DAY_IN_MILLISECONDS / 1000 * 30;

    return jwt.sign({
      userId: user.id
    }, process.env.SECRET, {
      expiresIn: expiredTime
    });
  },

  facebook: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      'fb_access_token': ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var UserModel = req.getModel('UserModel'),
        UserProfileModel = req.getModel('UserProfileModel'),
        secret = process.env.FACEBOOK_APP_SECRET,
        fbAcessToken = params.fb_access_token,
        hash = crypto.createHmac('sha256', secret).update(fbAcessToken),
        appsecretProof = hash.digest('hex'),
        fields = 'id,name,email,first_name,last_name,gender,link,picture.type(large)';
        url = util.format(
          'https://graph.facebook.com/v2.8/me?fields=%s&access_token=%s&appsecret_proof=%s',
          fields, fbAcessToken, appsecretProof
        ),
        fbid = '';

    async.auto({
      fbInfo: function(next) {
        request({
          json: true,
          url: url
        }, next);
      },
      existedUser: ['fbInfo', function(ret, next) {
        var result = ret.fbInfo;
        if (result && result.length && result[0].statusCode === 200) {
          fbid = result[1].id;
          UserModel.findOne({
            where: 'facebook_id=?',
            params: [fbid],
          }, next);
          return;
        }
        next('FB authentication failed.');
      }],
      user: ['existedUser', function(ret, next) {
        // If user that associated with fb account is existed, just continue
        if (ret.existedUser) {
          next(null, ret.existedUser);
          return;
        }

        var profile = ret.fbInfo[1];
        var data = {
          facebook_id: profile.id,
          username: profile.id,
          email: profile.email || profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.picture.data.url,
        };

        UserModel.add(data, next);

      }],
      userProfile: ['user', function(ret, next) {
        // If user that associated with fb account is existed, just continue
        if (ret.existedUser) {
          next(null, null);
          return;
        }

        UserProfileModel.add({
          user_id: ret.user.id,
        }, next);
      }],
      commit: ['userProfile', function(ret, next) {
        req.commit(next);
      }],
    }, function(err, ret) {
      if (err) {
        req.rollback(function() {
          res.sendError(err);
        });
        return;
      }

      if (!ret.user) {
        res.notFound('Cannot find or create user');
        return;
      }

      var user = ret.user,
          token = self.generateAccessToken(user);

      res.ok({
        user: user,
        token: token
      });
    });
  },

  login: function(req, res) {
    var self = this,
        redirectUrl = '/';

    if (req.allParams && req.allParams['redirect_url']) {
      redirectUrl = req.allParams['redirect_url'];
    }

    passport.authenticate('local', {
      successRedirect   : redirectUrl,
      failureRedirect   : '/login',
      failureFlash      : true,
    }, function(err, user, info) {
      logger.trace('login err=' + util.inspect(err));
      logger.trace('login user=' + util.inspect(user));
      logger.trace('login info=' + util.inspect(info));

      if (err) {
        return res.sendError(err);
      }

      if (user === false) {
        if (info && info.message) {
          return res.sendError(info.message);
        }

        res.sendError(info);
      }

      var token = self.generateAccessToken(user);

      res.ok(user.setExtra({
        token: token
      }));

    })(req, res);
  },

  logout: function(req, res) {
    res.ok();
  },

});
