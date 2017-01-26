var util            = require('util');
var passport        = require('passport');
var LocalStrategy   = require('passport-local').Strategy;
var JwtStrategy     = require('passport-jwt').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var logger          = log4js.getLogger('Init.Passport');

module.exports = function(app) {

  // Serialize user for the session: from entity to id
  passport.serializeUser(function(user, done) {
    logger.debug('Passport::serializeUser: ' + util.inspect(user));
    done(null, user.id);
  });

  // Deserialize user for the session: id to entity
  passport.deserializeUser(function(id, done) {
    logger.debug('Passport::deserializeUser: ' + id);
    CacheFactory.getOneUser(id, function(err, user) {
      if (err) {
        return done(err);
      }

      done(err, user);
    });
  });

  var jwtBodyField = app.get('jwtBodyField');
  var opts = {
    tokenBodyField: jwtBodyField,
    secretOrKey: app.get('jwtSecret'),
    passReqToCallback: true
  };

  opts.jwtFromRequest = function(req) {
    if (req.headers['x-auth-token']) {
      return req.headers['x-auth-token'];
    }

    if (req.body && req.body[jwtBodyField]) {
      return req.body[jwtBodyField];
    }

    if (req.query && req.query[jwtBodyField]) {
      return req.query[jwtBodyField];
    }

    if (req.allParams && req.allParams[jwtBodyField]) {
      return req.allParams[jwtBodyField];
    }

    return null;
  };

  passport.use(new JwtStrategy(opts, function(req, jwtPayload, done) {
    CacheFactory.getOneUser(jwtPayload.userId, function(err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        done(null, user);
      } else {
        logger.error('User not found jwtPayload=' + util.inspect(jwtPayload));
        done(ErrorFactory.unauthorized('User not found.'));
      }
    });
  }));

  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, done) {
      var UserModel = req.getModel('UserModel');
      UserModel.findOne({
        where   : 'email=?',
        params  : [email.toLowerCase()],
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          logger.error('User not found email=' + email);
          return done(ErrorFactory.notFound('User not found.'));
        }

        if (!user.isValidPassword(password)) {
          logger.error('Invalid password for email=' + email + ', password=' + password);
          return done(ErrorFactory.badRequest('Wrong password.'));
        }

        return done(null, user);

      });
    }
  ));

  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_APP_ID,
    consumerSecret: process.env.TWITTER_APP_SECRET,
    callbackURL: util.format('%s/auth/twitter2/callback', process.env.APP_ENDPOINT)
  }, function(token, tokenSecret, profile, cb) {
    logger.trace('TwitterStrategy callback token: ' + util.inspect(token));
    logger.trace('TwitterStrategy callback tokenSecret: ' + util.inspect(tokenSecret));
    logger.trace('TwitterStrategy callback profile: ' + util.inspect(profile.id));
    cb(null, {
      token: token,
      tokenSecret: tokenSecret,
      profile: profile,
    });
  }));

};
