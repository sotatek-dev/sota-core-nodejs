
module.exports = {
  find: function(model, options, pagination, callback) {
    if (!pagination || !pagination.type) {
      return model.find(options, callback);
    }

    options = options || {};

    var where = options.where || '',
        additionalWheres = [],
        params = options.params || [],
        field = pagination.field,
        before = pagination.before,
        after = pagination.after,
        orderBy = pagination.field;

    if (pagination.type === 'cursor' || pagination.type === 'brute') {

      if (before !== undefined && before !== null) {
        additionalWheres.push('`' + field + '` > ' + before);
      }

      if (after !== undefined && after !== null) {
        additionalWheres.push('`' + field + '` < ' + after);
        orderBy += ' DESC';
      }
    } else {
      callback(ErrorFactory.internal('Unsupported pagination type: ' + pagination.type));
      return;
    }

    if (additionalWheres.length > 0) {
      if (where) {
        where = '(' + where + ') AND ';
      }

      where += '(' + additionalWheres.join(' AND ') + ')';
    }

    async.waterfall([
      function count(next) {
        if (pagination.type === 'brute') {
          model.count({
            where: where,
            params: params,
          }, next);
        } else {
          next(null, 0);
        }
      },
      function list(count, next) {
        if (count > Const.MAX_QUERY_RECORDS) {
          return next(ErrorFactory.payloadTooLarge('Too many records'));
        }

        model.find({
          where: where,
          params: params,
          limit: pagination.limit,
          offset: pagination.offset,
          orderBy: orderBy,
        }, next);
      },
    ], callback);
  }
};
