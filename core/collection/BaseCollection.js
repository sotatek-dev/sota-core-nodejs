/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash');
var util            = require('util');
var Class           = require('sota-class').Class;
var IAdaptative     = require('../interface/IAdaptative');
var logger          = log4js.getLogger('BaseCollection');

module.exports = Class.extends({
  classname: 'BaseCollection',

  initialize: function (model, alias) {
    // logger.trace('created collection from model: ' + model.classname + ' as: ' + alias)

    if (!model || !model.tableName) {
      throw new Error('initialize: invalid model');
    }

    if (typeof alias !== 'string') {
      throw new Error('initialize: invalid alias');
    }

    this._model = model;
    this._alias = alias;
    this._joints = [];
  },

  innerJoin: function (tableName, alias, conditions, fields) {
    return this._join(' inner join ', tableName, alias, conditions, fields);
  },

  leftJoin: function (tableName, alias, conditions, fields) {
    return this._join(' left join ', tableName, alias, conditions, fields);
  },

  _join: function (type, tableName, alias, conditions, fields) {
    this._joints.push({
      fields,
      type,
      tableName,
      alias,
      conditions: this._resolveConditions(conditions)
    });

    return this;
  },

  getFromClause: function () {
    let firstAlias = '`' + this._model.tableName + '` AS `' + this._alias + '`';
    let secondAlias =
      _.map(this._joints, function (j) {
        let rightClause;
        if (!j.fields || _.isEmpty(j.fields) || !_.isArray(j.fields) || j.fields === '*' ) {
          rightClause = '`' + j.tableName + '` AS `' + j.alias + '` on ' + j.conditions;
        }
        else {
          rightClause = '(SELECT ' + _.map(j.fields, e => '`' + e + '`').join(',') + ' FROM ' + '`' + j.tableName + '`)' + 'AS `' + j.alias + '` on ' + j.conditions;
        }

        return j.type + rightClause;
      }).join(' ');

    return firstAlias + secondAlias;
  },

  getAdapterForSelect: function () {
    return this._model.getAdapterForSelect();
  },

  $_resolveConditions: function (conditions) {
    if (typeof conditions === 'string') {
      return conditions;
    }

    var self = this;
    if (_.isArray(conditions)) {
      return '(' + _.map(conditions, function (condition) {
        return self._resolveConditions(condition);
      }).join(' AND ') + ')';
    }

    if (_.isObject(conditions)) {
      let _conditions = conditions.or;
      if (!_.isArray(_conditions) || _conditions.length < 2) {
        return '';
      }

      return '(' + _.map(_conditions, function (condition) {
        return self._resolveConditions(condition);
      }).join(' OR ') + ')';
    }

    logger.error(util.format('Invalid conditions format: %j', conditions));
    throw new Error('Invalid conditions format.');
  }

}).implements([IAdaptative]);
