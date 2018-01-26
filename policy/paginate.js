/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const Checkit         = require('cc-checkit');
const Utils           = require('../util/Utils');
const Const           = require('../common/Const');
const ErrorFactory    = require('../error/ErrorFactory');
const logger          = log4js.getLogger('Policy.paginate');

module.exports = function (req, res, next) {
  var [err, params] = new Checkit({
    p_type: ['string'],
    p_limit: ['natural'],
    p_offset: ['natural'],
    p_field: ['string'],
    p_before: ['string'],
    p_after: ['string'],
    useRawId: ['natural']
  }).validateSync(req.allParams);

  if (err) {
    return next(err.toString());
  }

  req.pagination = {};

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
    type: params.p_type,
    limit: params.p_limit || Const.DEFAULT_PAGINATION_SIZE,
    offset: params.p_offset || 0,
    field: params.p_field || 'id',
    before: params.p_before,
    after: params.p_after
  };

  if (type === 'cursor') {
    if (req.pagination.before && req.pagination.after) {
      let msg = 'Both p_before and p_after cannot be defined at the same time';
      return next(ErrorFactory.badRequest(msg));
    }
  } else if (type === 'cursor2') {
    if (req.pagination.before && req.pagination.after) {
      let msg = 'Both p_before and p_after cannot be defined at the same time';
      return next(ErrorFactory.badRequest(msg));
    }

    if (params.useRawId === 1) {
      req.pagination.field = 'id';
    } else {
      if (req.pagination.before) {
        req.pagination.before = Utils.decode(req.pagination.before);
      }

      if (req.pagination.after) {
        req.pagination.after = Utils.decode(req.pagination.after);
      }
    }

    if (req.pagination.before) {
      req.pagination.direction = Const.PAGINATION.DIRECTION.BEFORE;
      req.pagination.pivotValue = req.pagination.before;
    }

    if (req.pagination.after) {
      req.pagination.direction = Const.PAGINATION.DIRECTION.AFTER;
      req.pagination.pivotValue = req.pagination.after;
    }

    // When the pivot contains 2 or more parameters
    if (req.pagination.pivotValue && req.pagination.pivotValue.indexOf('{') > -1) {
      try {
        req.pagination.pivot = JSON.parse(req.pagination.pivotValue);
      } catch (e) {
        return next(ErrorFactory.badRequest(`Invalid pivotValue format: ${req.pagination.pivotValue}`));
      }
    } else {
      req.pagination.pivot = {};
      req.pagination.pivot[req.pagination.field] = req.pagination.pivotValue;
    }

  } else if (type === 'auto') {
    // Query from multi-tables, cannot predict the exact result
    req.pagination.limit = -1;
  } else if (type === 'brute') {
    // No limit in brute-mode
    req.pagination.limit = -1;
  } else if (type === 'complex') { // Mix between multi and complex conditions
    // TODO: implement me
    return next(ErrorFactory.badRequest('Unsupported pagination type: ' + type));
  } else {
    return next(ErrorFactory.badRequest('Unsupported pagination type: ' + type));
  }

  req.pagination.currentUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  next();
};
