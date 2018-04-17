/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _                 = require('lodash');
const async             = require('async');
const util              = require('util');
const mongoose          = require('mongoose');
const logger            = require('log4js').getLogger('MongoAdapter');

function initMongoose() {
  const e = process.env;
  if (!e.MONGODB_HOST || !e.MONGODB_DBNAME) {
    return;
  }

  let url = 'mongodb://';
  if (e.MONGODB_USERNAME && e.MONGODB_PASSWORD) {
    url += `${e.MONGODB_USERNAME}:${e.MONGODB_PASSWORD}@`;
  }
  url += e.MONGODB_HOST;
  if (process.env.MONGODB_PORT) {
    url += `:${e.MONGODB_PORT}`;
  }
  url += `/${e.MONGODB_DBNAME}`;

  mongoose.connect(url);
  mongoose.Promise = global.Promise;
  mongoose.connection.on('error', (err) => {
    throw new Error(`MongoAdapter connection on error: ${err}`);
  });
};

initMongoose();

class MongoAdapter {

  constructor (exSession, mode) {
    this._exSession = exSession;
    this._mode = mode;
    this._isDestroyed = false;
  }

  createMongooseDocument (entity) {
    const MongooseModelClass = mongoose.model(entity.getModel().tableName);
    return new MongooseModelClass();
  }

  find (model, conditions, projection, options, callback) {
    const query = mongoose.model(model.tableName).find(conditions, projection, options);

    query.exec((err, ret) => {
      if (err) {
        return callback(err);
      }

      const entities = _.map(ret, (e) => {
        const entity = model.constructEntity(e);
        return entity;
      });

      return callback(null, entities);
    });
  }

  findOne (model, conditions, projection, options, callback) {
    const query = mongoose.model(model.tableName).findOne(conditions, projection, options);

    query.exec((err, ret) => {
      if (err) {
        return callback(err);
      }

      return callback(null, model.constructEntity(ret));
    });
  }

  commit (callback) {
    // TODO: implement me
    return callback(null, null);
  }

  rollback (callback) {
    // TODO: implement me
    return callback(null, null);
  }

  destroy () {
    /**
     * Since the destroy methods can be called multiple-times from multi models
     * We need a flag to mark the destroying process is being done
     */
    if (this._isDestroyed) {
      return;
    }

    this._isDestroyed = true;
  }

};

module.exports = MongoAdapter;
