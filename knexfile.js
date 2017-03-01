/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
// Update with your config settings.
require('dotenv').config()

var _ = global._ = require('lodash')
global.log4js = require('log4js')

var Utils         = require('./core/util/Utils')
var ConstCore     = require('./core/common/Const')
var ConstApp      = require('./app/common/Const')
var adapters      = require('./config/Adapters')
var localConfig   = require('./config/Local')

global.Const = _.assign(ConstCore, ConstApp)
var now = global.now = Utils.now()

if (localConfig.adapters) {
  adapters = _.merge(adapters, localConfig.adapters)
}
var adapter = adapters['mysql-master']
var testAdapter = adapters['mysql-master-test']

var addPredefinedColumns = function (seeds) {
  return _.map(seeds, function (def) {
    if (!def.created_at) {
      def.created_at = now + _.random(0, 100000)
    }

    if (!def.updated_at) {
      def.updated_at = now + _.random(0, 100000)
    }

    if (!def.created_by) {
      def.created_by = 0
    }

    if (!def.updated_by) {
      def.updated_by = 0
    }

    return def
  })
}

global.generateTasks = function (knex, Promise, table, seeds, isRaw) {
  var tasks = []

  // Deletes ALL existing entries
  tasks.push(knex(table).del())

  // Add new entries
  tasks = tasks.concat(_.map(isRaw ? seeds : addPredefinedColumns(seeds), function (def) {
    return knex(table).insert(def)
  }))

  return Promise.all(tasks)
}

module.exports = {

  test: {
    client: 'mysql',
    connection: {
      host: testAdapter.dbHost,
      user: testAdapter.dbUser,
      database: testAdapter.dbName,
      password: testAdapter.dbPwd,
      charset: 'utf8'
    },
    migrations: {
      directory: './db/migrations_knex'
    },
    seeds: {
      directory: './db/seeds/test'
    }
  },

  development: {
    client: 'mysql',
    connection: {
      host: adapter.dbHost,
      user: adapter.dbUser,
      database: adapter.dbName,
      password: adapter.dbPwd,
      charset: 'utf8'
    },
    migrations: {
      directory: './db/migrations_knex'
    },
    seeds: {
      directory: './db/seeds/development'
    }
  },

  staging: {

  },

  production: {

  }

}
