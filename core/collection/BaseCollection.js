var BaseClass     = require('../common/BaseClass');
var IAdaptative   = require('../interface/IAdaptative');
var logger        = require('log4js').getLogger('BaseCollection');

module.exports = BaseClass.extend({
  classname: 'BaseCollection',

  initialize: function(model, alias) {
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

  innerJoin: function(tableName, alias, conditions) {
    return this._join(' inner join ', tableName, alias, conditions);
  },

  leftJoin: function(tableName, alias, conditions) {
    return this._join(' left join ', tableName, alias, conditions);
  },

  _join: function(type, tableName, alias, conditions) {
    this._joints.push({
      type: type,
      tableName: tableName,
      alias: alias,
      conditions: this._resolveConditions(conditions)
    });

    return this;
  },

  getFromClause: function() {
    return '`' + this._model.tableName + '` AS `' + this._alias + '`' +
          _.map(this._joints, function(j) {
            return j.type + '`' + j.tableName + '` AS `' + j.alias + '` on ' + j.conditions;
          });
  },

  getAdapterForSelect: function() {
    return this._model.getAdapterForSelect();
  },

  $_resolveConditions: function(conditions) {
    if (typeof conditions === 'string') {
      return conditions;
    }

    var self = this;
    if (_.isArray(conditions)) {
      return '(' + _.map(conditions, function(condition) {
        return self._resolveConditions(condition);
      }).join(' AND ') + ')';
    }

    if (_.isObject(conditions)) {
      let _conditions = conditions['or'];
      if (!_.isArray(_conditions) || _conditions.length < 2) {
        return '';
      }

      return '(' + _.map(_conditions, function(condition) {
        return self._resolveConditions(condition);
      }).join(' OR ') + ')';
    }

    throw new Error('Invalid conditions format.');
  },

}, [IAdaptative]);
