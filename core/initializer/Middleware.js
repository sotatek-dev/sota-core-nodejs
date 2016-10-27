module.exports = function(app, config) {
  // Middlewares setup
  // TODO: make this more configurable
  let sessionOpts = {
    secret: config.secret,
    resave: true,
    saveUninitialized: true,
  };
  app.use(morgan('dev'));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(session(sessionOpts));
  app.use(express.static(config.publicDir));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  // TODO: implement the mechanism for customized middlewares
  app.use(function(req, res, next) {
    req.files = req.files || {};
    var form = new multiparty.Form();
    form.keepExtensions = true;
    form.uploadDir = path.join(app.get('rootDir'), 'public/uploads');
    form.parse(req, function(err, fields, files) {
      req.params = req.params || {};
      _.forEach(_.keys(fields), function(key) {
        req.body[key] = fields[key][0];
      });
      _.forEach(_.keys(files), function(key) {
        req.files[key] = files[key][0];
      });
      next();
    });
  });
};
