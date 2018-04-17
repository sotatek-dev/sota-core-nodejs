/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _               = require('lodash');
const async           = require('async');
const LocalCache      = require('../cache/foundation/LocalCache');
const MongooseEntity  = require('../entity/MongooseEntity');
const Const           = require('../common/Const');
const BaseModel       = require('./BaseModel');
const logger          = require('log4js').getLogger('MongooseModel');

/**
 * 2018-04-16
 * Since BaseModel is a failure in being interface for both data from MySQL and MongoDB
 * Try to wrap all methods and handle in mongoose-way in this class
 * Time to refactor BaseModel
 * Or just find and use another mature framework
 * TBD when MongoDB 4 is be released with multi-document transaction support
 */
module.exports = BaseModel.extends({
  classname: 'MongooseModel',

  $_mongooseSchema: null,
  $Entity: MongooseEntity,
  $excludedCols: ['created_at', 'updated_at', 'created_by', 'updated_by'],
  $excludedProps: ['_id', '__v'],

  add: function (data, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }

    if (!_.isPlainObject(data)) {
      return callback(`MongooseModel::add only supports plain object data for now.`);
    }

    this.constructEntity(data, options).save(callback);
  },

  _parseQueryParams: function (projection, options, callback) {
    if (typeof projection === 'function') {
      callback = projection;
      projection = null;
    }

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    // Select all fields/columns
    if (projection === '*') {
      projection = null;
    }

    return { projection, options, callback };
  },

  find: function (conditions, _projection = null, _options = {}, _callback) {
    const { projection, options, callback } = this._parseQueryParams(_projection, _options, _callback);
    this.getMasterAdapter().find(this, conditions, projection, options, callback);
  },

  findOne: function (conditions, _projection = null, _options = {}, _callback) {
    const { projection, options, callback } = this._parseQueryParams(_projection, _options, _callback);
    this.getMasterAdapter().findOne(this, conditions, projection, options, callback);
  },

  findById: function (id, _projection = null, _options = {}, _callback) {
    const { projection, options, callback } = this._parseQueryParams(_projection, _options, _callback);
    this.getMasterAdapter().findById(this, id, projection, options, callback);
  },

  findByIds: function (ids, _projection = null, _options = {}, _callback) {
    const { projection, options, callback } = this._parseQueryParams(_projection, _options, _callback);
    const conditions = {
      _id: {
        $in: ids
      }
    };

    this.getMasterAdapter().find(this, conditions, projection, options, callback);
  },

});
