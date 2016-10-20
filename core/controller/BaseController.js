var BaseClass           = require('../common/BaseClass');
var Filter              = require('./Filter');
var ControllerFactory   = require('./ControllerFactory');
var logger              = require('log4js').getLogger('BaseController');

var BaseController = BaseClass.extend({
  classname : 'BaseController',

  initialize: function() {
    this.logger = require('log4js').getLogger(this.classname);
    this.logger.debug('BaseController::initialize');
  },

  $createNoCheck: function(funcName) {
    var base = ControllerFactory.getBaseHandler(this.classname, funcName);
    return Filter.createNoCheck(base);
  },

  $createAuth: function(funcName) {
    var base = ControllerFactory.getBaseHandler(this.classname, funcName);
    return Filter.createAuth(base);
  },

  $createLoginBasic: function(funcName) {
    var base = ControllerFactory.getBaseHandler(this.classname, funcName);
    return Filter.createLoginBasic(base);
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

        res.send(ret.find);
      });
    };

    return Filter.createNoCheck(baseHandler);

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

        res.send(ret.find);
      });
    };

    return Filter.createNoCheck(baseHandler);

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

        res.contentCreated(ret.add);
      });
    };

    return Filter.createNoCheck(baseHandler);

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

        res.send(ret.update);
      });
    };

    return Filter.createNoCheck(baseHandler);

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

    return Filter.createNoCheck(baseHandler);

  },

});

module.exports = BaseController;
