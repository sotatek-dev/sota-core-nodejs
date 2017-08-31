/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash');
var async           = require('async');
var util            = require('util');
var Utils           = require('../util/Utils');
var ErrorFactory    = require('../error/ErrorFactory');
var logger          = log4js.getLogger('Paginator2');

function getPagingInfo (result, inputPagination) {
  if (!result || !result.length) {
    return null;
  }

  const fieldNames = _.map(inputPagination.fields, 'name');
  const rawBefore = _.pick(_.head(result), fieldNames);
  const before = Utils.encode(JSON.stringify(rawBefore));
  const rawAfter = _.pick(_.last(result), fieldNames);
  const after = Utils.encode(JSON.stringify(rawAfter));

  let previous;
  let next;
  let currentUrl = inputPagination.currentUrl;

  if (inputPagination.currentUrl.indexOf('?') === -1) {
    currentUrl = inputPagination.currentUrl + '?';
  }

  if (currentUrl && typeof currentUrl === 'string') {
    previous = `${currentUrl}&p_before=${before}`;
    next = `${currentUrl}&p_after=${after}`;
  }

  return {
    before,
    after,
    previous,
    next,
  };
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

    let having = options.having || [];
    let where = options.where || '';
    let orderBy = options.orderBy || '';
    let limit = options.limit || pagination.limit;
    let params = options.params || [];

    let orderFields = [];
    let additionalWheres = [];

    const pivot = pagination.pivot;

    _.forEach(pagination.fields, field => {

      const fieldName = escapeFieldName(field.name);
      const pivotValue = pivot[field.name];
      const fieldOrderDirection = getOrderDirection(field.defaultOrder, pagination.direction);
      const comparisonOperator = getComparisonOperator(fieldOrderDirection, pagination.canBeEqual);

      // Build order clause
      orderFields.push(`${fieldName} ${fieldOrderDirection}`);

      // Build where clause if pivot value is given
      if (pivotValue || pivotValue === 0) {
        additionalWheres.push(`${fieldName} ${comparisonOperator} ?`);
        params.push(pivotValue);
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
    const mergedOptions = this._parsePaggingOption(model, options, pagination);
    model.find(mergedOptions, (err, ret) => {
      if (err) return callback(err);

      if (pagination.direction === Const.PAGINATION.DIRECTION.BEFORE) {
        _.reverse(ret);
      }

      return callback(null, {
        data: ret,
        pagination: getPagingInfo(ret, pagination)
      });
    });
  },

};
