// var logger = require('log4js').getLogger('PolicyPaginate');

module.exports = function(req, res, next) {
  var [err, params] = new Checkit({
    p_type: ['string'],
    p_limit: ['natural'],
    p_offset: ['natural'],
    p_field: ['string'],
    p_before: ['string'],
    p_after: ['string'],
    p_order: ['string'],
  }).validateSync(req.allParams);

  if (err) {
    return next(err.toString());
  }

  // If there's no particular paging
  // just use default values and keep living on
  var type = params.p_type;
  if (!type) {
    return next();
  }

  // Init value
  // Query condition is based on one record's field
  // Result will be sorted by this field as well
  // The default field is `id`
  req.pagination = {
    type    : params.p_type,
    limit   : params.p_limit || Const.DEFAULT_PAGINATION_SIZE,
    offset  : params.p_offset || 0,
    field   : params.p_field || 'id',
    before  : params.p_before,
    after   : params.p_after,
  };

  if (type === 'cursor') {
    if (req.pagination.before && req.pagination.after) {
      var msg = 'Both p_before and p_after cannot be defined at the same time';
      return next(ErrorFactory.badRequest(msg));
    }
  } else if (type === 'brute') {
    // No limit in brute-mode
    req.pagination.limit = -1;
  } else if (type === 'complex') { // Mix between multi and complex conditions
    // TODO: implement me
    return next(ErrorFactory.badRequest('Unsupported pagination type: ' + type));
  } else {
    return next(ErrorFactory.badRequest('Unsupported pagination type: ' + type));
  }

  next();

};
