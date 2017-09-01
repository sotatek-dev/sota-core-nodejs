/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash');
var async           = require('async');
var util            = require('util');
var Utils           = require('../util/Utils');
var ErrorFactory    = require('../error/ErrorFactory');
var BaseEntity      = require('../entity/BaseEntity');
var Paginator       = require('./Paginator');
var logger          = log4js.getLogger('Paginator2');

function getResultWithPagingInfo (inputPagination, callback, err, ret) {
  if (err) return callback(err);

  if (inputPagination.direction === Const.PAGINATION.DIRECTION.BEFORE) {
    _.reverse(ret);
  }

  const fieldNames = _.flattenDeep(_.map(inputPagination.fields, 'name'));

  const data = _.map(ret, elem => {
    const pivotInfo = _.pick(_.head(ret), fieldNames);
    const __pivotValue = Utils.encode(JSON.stringify(pivotInfo));
    if (elem instanceof BaseEntity) {
      elem.setExtra({ __pivotValue });
    } else {
      elem = _.assign(elem, { __pivotValue });
    }

    return elem;
  });

  const pagination = {
    before: _.head(data).__pivotValue,
    after: _.last(data).__pivotValue
  };

  return callback(null, {
    data,
    pagination,
  });
}

function getOrderDirection (defaultOrderDirection, paginationDirection) {
  const isReversedOrder = paginationDirection === Const.PAGINATION.DIRECTION.BEFORE;

  if (!defaultOrderDirection) {
    return isReversedOrder ? Const.PAGINATION.ORDER.DESC : Const.PAGINATION.ORDER.ASC;
  }

  if (defaultOrderDirection === Const.PAGINATION.ORDER.DESC) {
    return isReversedOrder ? Const.PAGINATION.ORDER.ASC : Const.PAGINATION.ORDER.DESC;
  }

  if (defaultOrderDirection === Const.PAGINATION.ORDER.ASC) {
    return isReversedOrder ? Const.PAGINATION.ORDER.DESC : Const.PAGINATION.ORDER.ASC;
  }

  logger.error(`Cannot getReversedOrderDirection: ${defaultOrderDirection}`);
}

function escapeFieldName (fieldName) {
  const columnName = Utils.convertToSnakeCase(fieldName);

  if (columnName.indexOf('`') > -1) {
    return columnName;
  }

  if (columnName.indexOf('.') < 0) {
    return '`' + columnName.toLowerCase() + '`';
  }

  return _.map(columnName.split('.'), (e) => {
    return '`' + e.toLowerCase() + '`';
  }).join('.');
}

function getComparisonOperator (orderDirection, canBeEqual) {
  if (orderDirection === Const.PAGINATION.ORDER.DESC) {
    return '<' + (canBeEqual ? '=' : '');
  }

  if (orderDirection === Const.PAGINATION.ORDER.ASC) {
    return '>' + (canBeEqual ? '=' : '');
  }

  throw new Error(`Cannot getComparisonOperator for invalid direction: ${orderDirection}`);
}

module.exports = {

  _parsePaggingOption: function (model, options, pagination) {
    if (!pagination || !pagination.type) {
      return options;
    }

    if (pagination.type !== 'cursor2') {
      throw new Error(`Paginator2::_parsePaggingOption doesn't support pagination type: ${pagination.type}`);
    }

    if (!options) {
      options = {};
    }

    let where = options.where || '';
    let orderBy = options.orderBy || '';
    let limit = options.limit || pagination.limit;
    let params = options.params || [];

    let orderFields = [];
    let additionalWheres = [];
    let having = options.having || [];
    let havingParams = [];

    const pivot = pagination.pivot;

    _.forEach(pagination.fields, field => {
      const fieldOrderDirection = getOrderDirection(field.defaultOrder, pagination.direction);
      const comparisonOperator = getComparisonOperator(fieldOrderDirection, field.canBeEqual);
      let fieldName;
      let pivotValue;

      // A group of fields
      if (_.isArray(field.name)) {
        const fieldNames = _.map(field.name, escapeFieldName);
        const pivotValues = _.map(field.name, name => {
          return pivot[name];
        });
        fieldName = '(' + fieldNames.join(',') + ')';
        pivotValue = '(' + _.map(pivotValues, e => '?').join(',') + ')';

        // Build where clause if pivot value is given
        if (_.every(pivotValues, val => !_.isNil(val))) {
          const comparisonClause = `${fieldName} ${comparisonOperator} ${pivotValue}`;
          if (options.isAggregate || field.isAggregateField) {
            having.push(comparisonClause);
            havingParams = havingParams.concat(pivotValues);
          } else {
            additionalWheres.push(comparisonClause);
            params = params.concat(pivotValues);
          }
        }

        // Build order clause
        _.each(fieldNames, name => {
          orderFields.push(`${name} ${fieldOrderDirection}`);
        });
      } else { // Single field
        fieldName = escapeFieldName(field.name);
        pivotValue = pivot[field.name];

        // Build where clause if pivot value is given
        if (pivotValue || pivotValue === 0) {
          const comparisonClause = `${fieldName} ${comparisonOperator} ?`;
          if (options.isAggregate || field.isAggregateField) {
            having.push(comparisonClause);
            havingParams.push(pivotValue);
          } else {
            additionalWheres.push(comparisonClause);
            params.push(pivotValue);
          }
        }

        // Build order clause
        orderFields.push(`${fieldName} ${fieldOrderDirection}`);
      }
    });

    if (additionalWheres.length > 0) {
      const extraWhere = additionalWheres.join(' AND ');
      if (!where) {
        where = `${extraWhere}`;
      } else {
        where = `(${where}) AND (${extraWhere})`;
      }
    }

    if (orderFields.length > 0) {
      orderBy = orderFields.join(',');
    }

    params = params.concat(havingParams);

    return {
      columns: options.columns,
      where: where,
      params: params,
      limit: limit,
      orderBy: orderBy,
      groupBy: options.groupBy,
      having: having
    };
  },

  find: function (model, options, pagination, callback) {
    if (pagination && pagination.type !== 'cursor2') {
      return Paginator.find(model, options, pagination, callback);
    }

    const mergedOptions = this._parsePaggingOption(model, options, pagination);
    model.find(mergedOptions, getResultWithPagingInfo.bind(this, pagination, callback));
  },

  countGroupBy: function (model, groupFields, options, pagination, callback) {
    if (pagination && pagination.type !== 'cursor2') {
      return Paginator.countGroupBy(model, groupFields, options, pagination, callback);
    }

    options = _.assign(options, {
      isAggregate: true
    });

    const mergedOptions = this._parsePaggingOption(model, options, pagination);
    model.countGroupBy(groupFields, mergedOptions, getResultWithPagingInfo.bind(this, pagination, callback));
  },

  sumGroupBy: function (model, columns, options, pagination, callback) {
    if (pagination && pagination.type !== 'cursor2') {
      return Paginator.sumGroupBy(model, columns, options, pagination, callback);
    }

    options = _.assign(options, {
      isAggregate: true
    });

    const mergedOptions = this._parsePaggingOption(model, options, pagination);
    model.sumGroupBy(columns, mergedOptions, getResultWithPagingInfo.bind(this, pagination, callback));
  }

};
