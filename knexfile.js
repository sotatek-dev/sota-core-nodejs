// Update with your config settings.
require('dotenv').config();

_           = require('lodash');
util        = require('util');
generator   = require('lorem-ipsum');
log4js      = require('log4js');

logger      = log4js.getLogger('knexfile');
Utils       = require('./core/util/Utils');
ConstCore   = require('./core/common/Const');
ConstApp    = require('./app/common/Const');
Const       = _.assign(ConstCore, ConstApp);

now = Utils.now();
dayInMillis = 24 * 60 * 60 * 1000;

var adapters = require('./config/Adapters');
var localConfig = require('./config/Local');
if (localConfig.adapters) {
  adapters = _.merge(adapters, localConfig.adapters);
}
var adapter = adapters['mysql-master'];
var testAdapter = adapters['mysql-master-test'];

addPredefinedColumns = function(seeds) {
  return _.map(seeds, function(def) {
    if (!def.created_at) {
      def.created_at = now + _.random(0, 100000);
    }

    if (!def.updated_at) {
      def.updated_at = now + _.random(0, 100000);
    }

    if (!def.created_by) {
      def.created_by = 0;
    }

    if (!def.updated_by) {
      def.updated_by = 0;
    }

    return def;
  });
};

generateTasks = function(knex, Promise, table, seeds, isRaw) {
  var tasks = [];

  // Deletes ALL existing entries
  tasks.push(knex(table).del());

  // Add new entries
  tasks = tasks.concat(_.map(isRaw ? seeds : addPredefinedColumns(seeds), function(def) {
    return knex(table).insert(def);
  }));

  return Promise.all(tasks);
}

module.exports = {

  test: {
    client: 'mysql',
    connection: {
      host: testAdapter.dbHost,
      user: testAdapter.dbUser,
      database: testAdapter.dbName,
      password: testAdapter.dbPwd,
      charset: 'utf8',
    },
    migrations: {
      directory: './db/migrations_knex'
    },
    seeds: {
      directory: './db/seeds/test'
    },
  },

  development: {
    client: 'mysql',
    connection: {
      host: adapter.dbHost,
      user: adapter.dbUser,
      database: adapter.dbName,
      password: adapter.dbPwd,
      charset: 'utf8',
    },
    migrations: {
      directory: './db/migrations_knex'
    },
    seeds: {
      directory: './db/seeds/development'
    },
  },

  staging: {

  },

  production: {

  }

};
