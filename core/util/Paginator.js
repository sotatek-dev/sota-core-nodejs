
module.exports = {
  get: function(model, options, pagination, callback) {
    if (!pagination || !pagination.type) {
      return model.find(options, callback);
    }

    options = options || {};

    var where = options.where || '',
        params = options.params || [],
        field = pagination.field,
        before = pagination.before,
        after = pagination.after,
        orderBy = pagination.field;

    if (pagination.type === 'cursor' || pagination.type === 'brute') {
      if (before !== undefined && before !== null) {
        where += ' AND `' + field + '` > ' + before;
      }

      if (after !== undefined && after !== null) {
        where += ' AND `' + field + '` < ' + after;
        orderBy += ' DESC';
      }
    } else {
      callback(ErrorFactor.internal('Unsupported pagination type: ' + pagination.type));
      return;
    }

    model.find({
      where: where,
      params: params,
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: orderBy,
    }, callback);
  }
};
