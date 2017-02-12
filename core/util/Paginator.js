
module.exports = {

  _parsePaggingOption: function(model, options, pagination) {
    if (!pagination || !pagination.type) {
      return null;
    }

    options = options || {};

    var having = options.having || [],
        where = options.where || '',
        additionalWheres = [],
        params = options.params || [],
        limit = options.limit || pagination.limit,
        offset = options.offset || pagination.offset,
        field = pagination.field,
        before = pagination.before,
        after = pagination.after;

    var orderBy = options.orderBy;
    if (!options.ignorePaginationOrderBy) {
      orderBy = (options.orderBy ? (options.orderBy + ', ') : '' ) +
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
          orderBy += ' DESC';
        }
      }
    } else if (pagination.type === 'cursor2') {

      if (before !== undefined && before !== null) {
        var comparator = '<';
        if (options.isReverseOrder) {
          comparator = '>';
        }

        if (!options.isHavingCondition) {
          additionalWheres.push(util.format('%s.`%s` %s ?', model.getAlias(), field, comparator));
        } else {
          having.push(util.format('`%s` %s ?', field, comparator));
        }

        params.push(before);

        if (!options.ignorePaginationOrderBy) {
          if (!options.isReverseOrder) {
            orderBy += ' DESC';
          }
        }
      }

      if (after !== undefined && after !== null) {
        var comparator = '>';
        if (options.isReverseOrder) {
          comparator = '<';
        }

        if (!options.isHavingCondition) {
          additionalWheres.push(util.format('%s.`%s` %s ?', model.getAlias(), field, comparator));
        } else {
          having.push(util.format('`%s` %s ?', field, comparator));
        }

        params.push(after);

        if (!options.ignorePaginationOrderBy) {
          if (options.isReverseOrder) {
            orderBy += ' DESC';
          }
        }
      }
    } else {
      throw new Error('Unsupported pagination type: ' + pagination.type);
      return;
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
      having: having,
    };
  },

  countGroupBy: function(model, groupFields, options, pagination, callback) {
    if (!pagination || !pagination.type) {
      return model.countGroupBy(groupFields, options, callback);
    }

    var mergedOptions = this._parsePaggingOption(model, options, pagination);

    model.countGroupBy(groupFields, mergedOptions, callback);
  },

  sumGroupBy: function(model, columns, options, pagination, callback) {
    if (!pagination || !pagination.type) {
      return model.sumGroupBy(columns, options, callback);
    }

    var mergedOptions = this._parsePaggingOption(model, options, pagination);

    model.sumGroupBy(columns, mergedOptions, callback);
  },

  find: function(model, options, pagination, callback) {
    if (!pagination || !pagination.type) {
      return model.find(options, callback);
    }

    var mergedOptions = this._parsePaggingOption(model, options, pagination);

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
      },
    ], callback);
  },

  getPagingInfo: function(result, inputPagination) {
    if (!result || !result.length) {
      return null;
    }

    if (!inputPagination.field || typeof inputPagination.field !== 'string') {
      return null;
    }

    var prop = Utils.convertToCamelCase(inputPagination.field);

    var head = _.head(result);
    var before = Utils.encrypt(head[prop]);

    var last = _.last(result);
    var after = Utils.encrypt(last[prop]);

    var previous, next;

    var currentUrl = inputPagination.currentUrl;
    if (currentUrl && typeof currentUrl === 'string') {
      var linkingChar = currentUrl.indexOf('?') > -1 ? '&' : '?';
      previous = currentUrl + util.format('%sp_before=%s', linkingChar, before);
      next = currentUrl + util.format('%sp_after=%s', linkingChar, after);
    }

    return {
      before: before,
      after: after,
      previous: previous,
      next: next,
    };
  },

};
