var Class               = require('../common/Class');
var ControllerFactory   = require('./ControllerFactory');
var logger              = require('log4js').getLogger('BaseController');
var errorHandler        = require('../policy/errorHandler');

var BaseController = Class.extends({
  classname : 'BaseController',

  initialize: function() {
    logger.debug('BaseController::initialize');
  },

  $handleBy: function(func, beforePolicies, afterPolicies) {
    if (!beforePolicies) {
      beforePolicies = [];
    }

    if (!afterPolicies) {
      afterPolicies = [];
    }

    if (!_.includes(beforePolicies, 'sotaDefault')) {
      beforePolicies = ['sotaDefault'].concat(beforePolicies);
    };

    var before = _.map(beforePolicies, function(policy) {
      return PolicyManager.get(policy);
    });

    var after = _.map(afterPolicies, function(policy) {
      return PolicyManager.get(policy);
    });

    var mainHandler;
    if (typeof func === 'function') {
      mainHandler = func;
    } else if (typeof func === 'string') {
      mainHandler = ControllerFactory.getBaseHandler(this.classname, func);
    }

    return ControllerFactory.createRequestHandler({
      action        : mainHandler,
      before        : before,
      after         : after,
      errorHandler  : errorHandler
    });
  },

  /**
   * @param {Class} modeClass - The model class
   * @param {Object} acl - TODO
   */
  $createDefaultFind: function(modelClass) {

    var baseHandler = function(req, res) {
      var page      = req.params['page'] || 0,
          pageSize  = req.params['page_size'] || 10, // TODO: add pageSize to config
          model     = req.getModel(modelClass.classname);

      async.auto({
        find: function(next) {
          var options = {
            offset  : page * pageSize,
            limit   : pageSize,
          };
          model.find(options, next);
        }
      }, function(err, ret) {
        if (err) {
          res.sendError(err);
          return;
        }

        var result = {};
        result[modelClass.getPluralTableName()] = ret.find;
        res.ok(result);
      });
    };

    return this.handleBy(baseHandler);

  },

  /**
   * @param {Class} modeClass - The model class
   * @param {Object} acl - TODO
   */
  $createDefaultFindOne: function(modelClass) {

    var baseHandler = function(req, res) {
      var id = req.params['id'],
          model = req.getModel(modelClass.classname);

      async.auto({
        find: function(next) {
          // If the id is passed as parameter, return one found object
          if (id > 0) {
            model.findOne(id, next);
          } else {
            next(null, null);
          }
        }
      }, function(err, ret) {
        if (err) {
          res.sendError(err);
          return;
        }

        if (!ret.find) {
          res.notFound('Content Not Found.');
          return;
        }

        res.ok(ret.find);
      });
    };

    return this.handleBy(baseHandler);

  },

  /**
   * @param {Class} modeClass - The model class
   * @param {Object} acl - TODO
   */
  $createDefaultAdd: function(modelClass) {

    var baseHandler = function(req, res) {
      var def = req.params,
          model = req.getModel(modelClass.classname);

      async.auto({
        add: function(next) {
          model.add(def, next);
        }
      }, function(err, ret) {
        if (err) {
          res.sendError(err);
          return;
        }

        res.created(ret.add);
      });
    };

    return this.handleBy(baseHandler);

  },

  /**
   * @param {Class} modeClass - The model class
   * @param {Object} acl - TODO
   */
  $createDefaultUpdate: function(modelClass) {

    var baseHandler = function(req, res) {
      var def   = req.params,
          model = req.getModel(modelClass.classname);

      async.auto({
        update: function(next) {
          model.update(def, next);
        }
      }, function(err, ret) {
        if (err) {
          res.sendError(err);
          return;
        }

        res.ok(ret.update);
      });
    };

    return this.handleBy(baseHandler);

  },

  /**
   * @param {Class} modeClass - The model class
   * @param {Object} acl - TODO
   */
  $createDefaultDelete: function(modelClass) {

    var baseHandler = function(req, res) {
      var id = parseInt(req.params['id']),
          model = req.getModel(modelClass.classname);

      async.auto({
        del: function(next) {
          if (id > 0) {
            model.delete(id, next);
          } else {
            next(null, null);
          }
        }
      }, function(err, ret) {
        if (err) {
          res.sendError(err);
          return;
        }

        res.noContent(ret.del);
      });
    };

    return this.handleBy(baseHandler);

  },

});

module.exports = BaseController;
