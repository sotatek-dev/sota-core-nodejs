var LocalStrategy   = require('passport-local').Strategy;
var JwtStrategy     = require('passport-jwt').Strategy;
var logger          = log4js.getLogger('Initializer');

module.exports = function(app, passport) {

  // Serialize user for the session: from entity to id
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // Deserialize user for the session: id to entity
  passport.deserializeUser(function(id, done) {
    var UserModel = ModelFactory.create('UserModel');
    UserModel.findById(id, function(err, user) {
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
  };

  opts.jwtFromRequest = function(req) {
    if (req.params && req.params[jwtBodyField]) {
      return req.params[jwtBodyField];
    }
    return null;
  };

  passport.use(new JwtStrategy(opts, function(jwtPayload, done) {
    var UserModel = ModelFactory.create('UserModel');
    UserModel.findOne({
      id: jwtPayload.sub
    }, function(err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        done(null, user);
      } else {
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
          return done(ErrorFactory.notFound('User not found.'));
        }

        if (!user.isValidPassword(password)) {
          return done(ErrorFactory.badRequest('Wrong password.'));
        }

        return done(null, user);

      });
    }
  ));

};
