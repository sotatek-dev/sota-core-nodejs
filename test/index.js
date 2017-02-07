require('dotenv').config();

process.env.PORT  = 3333;

var requireDir    = require('require-dir');
var SotaServer    = require('../core/SotaServer');

setupLog();
setupMiddlewares();

var queryLogger   = log4js.getLogger('Query');
var config        = require('../knexfile').test;
var knex          = require('knex')(config);

var client = redis.createClient({
  host: process.env.REDIS_SERVER_ADDRESS,
  port: process.env.REDIS_SERVER_PORT,
});

knex.on('query', function (data) {
  queryLogger.info(knex.raw(data.sql, data.bindings).toString());
});

getUrl = function(route) {
  return util.format('http://localhost:%s%s', process.env.PORT, route);
};

before(function(done) {
  logger.fatal('Setting up the test DB before running tests...');
  knex.migrate.rollback()
    .then(function() {
      logger.fatal('Migrate latest DB schema...');
      return knex.migrate.latest();
    })
    .then(function () {
      logger.fatal('Creating DB seeds...');
      return knex.seed.run();
    })
    .then(function () {
      logger.fatal('Done initializing...');
      client.flushdb(function() {
        var app = new SotaServer(null, done);
      });
    });
});

afterEach(cleanDBAndFlushCache);

requireDir('core', { recurse: true });
requireDir('usercases', { recurse: true });

function cleanDBAndFlushCache(done) {
  logger.info('Cleaning the test DB after each test...');
  knex.seed.run()
    .then(function () {
      client.flushdb(done);
    })
    .catch(function(err) {
      logger.warn('Got error: ' + err.toString() + '. Retrying...');
      cleanDBAndFlushCache(done);
    });
}

function setupLog() {
  var logConfig = {
    "appenders": [
      {
        "type": "clustered",
        "appenders": [
          {
            "type": "logLevelFilter",
            "level": process.env.LOG_LEVEL || "ERROR",
            "appender": {
              "type": "console"
            }
          }
        ]
      }
    ]
  };
  log4js.configure(logConfig);
  require('log4js').configure(logConfig);
}

function setupMiddlewares() {
  // We don't need request logger when running test
  var middlewares = require('../config/Middlewares');
  _.pull(middlewares.list, 'requestLogger');
}
