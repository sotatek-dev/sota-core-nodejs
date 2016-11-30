var util            = require('util');
var passport        = require('passport');
var LocalStrategy   = require('passport-local').Strategy;
var JwtStrategy     = require('passport-jwt').Strategy;
var logger          = require('log4js').getLogger('Init.Passport');

module.exports = function(app) {

  // Serialize user for the session: from entity to id
  passport.serializeUser(function(user, done) {
    logger.debug('Passport::serializeUser: ' + util.inspect(user));
    done(null, user.id);
  });

  // Deserialize user for the session: id to entity
  passport.deserializeUser(function(id, done) {
    logger.debug('Passport::deserializeUser: ' + id);
    var UserModel = ModelFactory.create('UserModel');
    UserModel.findById(id, function(err, user) {
      // When a model is not got from request, need to destroy manually
      // to prevent connection leak
      // TODO: Implement a generic mechanism to handle this
      UserModel.destroy();
      delete UserModel;

      if (err) {
        return done(err);
      }

      done(err, user.toJSON());
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

    if (req.allParams && req.allParams[jwtBodyField]) {
      return req.allParams[jwtBodyField];
    }

    return null;
  };

  passport.use(new JwtStrategy(opts, function(req, jwtPayload, done) {
    var UserModel = req.getModel('UserModel');
    UserModel.findCacheOne(jwtPayload.userId, function(err, user) {
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

};
