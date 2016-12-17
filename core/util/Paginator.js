
module.exports = {

  _parsePaggingOption: function(model, options, pagination) {
    if (!pagination || !pagination.type) {
      return null;
    }

    options = options || {};

    var where = options.where || '',
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

    if (pagination.type === 'cursor' || pagination.type === 'brute') {

      if (before !== undefined && before !== null) {
        additionalWheres.push(util.format('%s.`%s` > %s', model.getAlias(), field, before));
      }

      if (after !== undefined && after !== null) {
        additionalWheres.push(util.format('%s.`%s` < %s', model.getAlias(), field, after));
        orderBy += ' DESC';
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
      where: where,
      params: params,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
    };
  },

  countGroupBy: function(model, groupFields, options, pagination, callback) {
    if (!pagination || !pagination.type) {
      return model.countGroupBy(groupFields, options, callback);
    }

    var mergedOptions = this._parsePaggingOption(model, options, pagination);

    model.countGroupBy(groupFields, mergedOptions, callback);
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
  }
};
