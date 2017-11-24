/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash');
var async           = require('async');
var util            = require('util');
var Utils           = require('../util/Utils');
var ErrorFactory    = require('../error/ErrorFactory');
var logger          = log4js.getLogger('Paginator');

module.exports = {

  _parsePaggingOption: function (model, options, pagination, extraPagination) {
    if (!pagination || !pagination.type) {
      return null;
    }

    options = options || {};

    var having = options.having || [];
    var where = options.where || '';
    var additionalWheres = [];
    var params = options.params || [];
    var limit = options.limit || pagination.limit;
    var offset = options.offset || pagination.offset;
    var field = pagination.field;
    var before = pagination.before;
    var after = pagination.after;

    var orderBy = options.orderBy;
    var orderDirection = null;
    if (!options.ignorePaginationOrderBy) {
      orderBy = (options.orderBy ? (options.orderBy + ', ') : '') +
                  model.getAlias() + '.' + pagination.field;
    }

    if (pagination.type === 'cursor' ||
        pagination.type === 'brute') {
      if (before !== undefined && before !== null) {
        additionalWheres.push(util.format('%s.`%s` > ?', model.getAlias(), field));
        params.push(before);
      }

      if (after !== undefined && after !== null) {
        additionalWheres.push(util.format('%s.`%s` < ?', model.getAlias(), field));
        params.push(after);
        if (!options.ignorePaginationOrderBy) {
          orderDirection = ' DESC';
        }
      }

      orderBy += orderDirection || '';
    } else if (pagination.type === 'cursor2') {
      if (after !== undefined && after !== null) {
        let comparator = '<';
        if (options.isReverseOrder) {
          comparator = '>';
        }

        if (!options.isHavingCondition) {
          additionalWheres.push(util.format('%s.`%s` %s ?', model.getAlias(), field, comparator));
        } else {
          having.push(util.format('`%s` %s ?', field, comparator));
        }

        params.push(after);

        if (!options.ignorePaginationOrderBy) {
          if (!options.isReverseOrder) {
            orderDirection = ' DESC';
          }
        }
      }

      if (before !== undefined && before !== null) {
        let comparator = '>';
        if (options.isReverseOrder) {
          comparator = '<';
        }

        if (!options.isHavingCondition) {
          additionalWheres.push(util.format('%s.`%s` %s ?', model.getAlias(), field, comparator));
        } else {
          having.push(util.format('`%s` %s ?', field, comparator));
        }

        params.push(before);

        if (!options.ignorePaginationOrderBy) {
          if (options.isReverseOrder) {
            orderDirection = ' DESC';
          }
        }
      }

      if (!orderDirection && !options.ignorePaginationOrderBy) {
        orderDirection = options.isReverseOrder ? ' DESC' : ' ASC';
      }

      orderBy += orderDirection || '';

    } else {
      throw new Error('Unsupported pagination type: ' + pagination.type);
    }

    if (additionalWheres.length > 0) {
      if (where) {
        where = '(' + where + ') AND ';
      }

      where += '(' + additionalWheres.join(' AND ') + ')';
    }

    return {
      columns: options.columns,
      where: where,
      params: params,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
      groupBy: options.groupBy,
      having: having
    };
  },

  countGroupBy: function (model, groupFields, options, pagination, extraPagination, callback) {
    if (typeof extraPagination === 'function') {
      callback = extraPagination;
      extraPagination = null;
    }

    if (!pagination || !pagination.type) {
      return model.countGroupBy(groupFields, options, callback);
    }

    var mergedOptions = this._parsePaggingOption(model, options, pagination, extraPagination);

    model.countGroupBy(groupFields, mergedOptions, callback);
  },

  sumGroupBy: function (model, columns, options, pagination, extraPagination, callback) {
    if (typeof extraPagination === 'function') {
      callback = extraPagination;
      extraPagination = null;
    }

    if (!pagination || !pagination.type) {
      return model.sumGroupBy(columns, options, callback);
    }

    var mergedOptions = this._parsePaggingOption(model, options, pagination, extraPagination);

    model.sumGroupBy(columns, mergedOptions, callback);
  },

  find: function (model, options, pagination, extraPagination, callback) {
    if (typeof extraPagination === 'function') {
      callback = extraPagination;
      extraPagination = null;
    }

    if (!pagination || !pagination.type) {
      return model.find(options, callback);
    }

    var mergedOptions = this._parsePaggingOption(model, options, pagination, extraPagination);

    async.waterfall([
      function count(next) {
        if (pagination.type === 'brute') {
          model.count(_.pick(mergedOptions, ['where', 'params']), next);
        } else {
          next(null, 0);
        }
      },

      function list(count, next) {
        if (count > Const.MAX_QUERY_RECORDS) {
          return next(ErrorFactory.payloadTooLarge('Too many records'));
        }

        model.find(mergedOptions, next);
      }
    ], callback);
  },

  getPagingInfo: function (result, inputPagination) {
    if (!result || !result.length) {
      return null;
    }

    if (!inputPagination.field || typeof inputPagination.field !== 'string') {
      return null;
    }

    var prop = Utils.convertToCamelCase(inputPagination.field);

    var head = _.head(result);
    var before = Utils.encode(head[prop].toString());

    var last = _.last(result);
    var after = Utils.encode(last[prop].toString());

    var previous;
    var next;

    var currentUrl = inputPagination.currentUrl;
    if (inputPagination.currentUrl.indexOf('?') === -1) {
      currentUrl = inputPagination.currentUrl + '?';
    }

    if (currentUrl && typeof currentUrl === 'string') {
      next = `${currentUrl}&p_before=${before}`;
      previous = `${currentUrl}&p_after=${after}`;
    }

    return {
      before: before,
      after: after,
      previous: previous,
      next: next
    };
  }

};
