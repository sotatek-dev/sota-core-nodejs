var BaseClass = require('../common/BaseClass');

var ControllerFactory = BaseClass.singleton({
  classname : 'ControllerFactory',
  _registers : {},

  register : function(c) {
    logger.info('ControllerFactory::register ' + c.classname);
    if (c.classname) {
      this._registers[c.classname] = c;
    }
  },

  get : function(classname) {
    logger.info('ControllerFactory::get ' + classname);
    var c = new this._registers[classname]();
    return c;
  },

  /**
   * This creates the main handler defined in routes configuration
   * @param {string} classname: the classname of the controller
   * @param {string} funcName: the function name of the handler in the controller
   * @returns {Function} A function(req, res, cb)
   */
  getBaseHandler : function(classname, funcName) {
    //logger.info('ControllerFactory::getBaseHandler ' + classname + '.' + funcName);
    var self = this;
    return function(req, res, cb) {
      var o = self.get(classname);
      o[funcName](req, res, cb);
    };
  },

  wrapHandler : function(mainHandlerFn, beforeFns, afterFns, errorFn) {

    return function(req, res) {

      var arrFns = [];

      _.each(beforeFns, function(fn) {
        arrFns.push(async.apply(fn, req, res));
      });

      arrFns.push(async.apply(mainHandlerFn, req, res));

      _.each(afterFns, function(fn) {
        arrFns.push(async.apply(fn, req, res));
      });

      async.series(arrFns, function(err) {

        if (err) {
          logger.error('error(s): ' + util.inspect(err));
          errorFn(err, req, res);
        }

      });
    };
  },

  createRequestHandler : function(handlerDef) {
    if (typeof handlerDef === 'function') {

      // The simple case, a route mapped to a single function
      // Just use this function as handler
      return handlerDef;
    }

    // Case that handler is defined by Filter
    // Firstly the main action must be defined and is a function
    if (typeof handlerDef.action !== 'function') {
      throw new Error('Invalid main handler: ' + handlerDef.action);
    }

    // Verify other properties
    if (typeof handlerDef.errorHandler !== 'function') {
      throw new Error('Invalid error hander: ' + handlerDef.errorHandler);
    }

    if (!_.isArray(handlerDef.before)) {
      throw new Error('Invalid pre-handlers: ' + handlerDef.before);
    }

    if (!_.isArray(handlerDef.after)) {
      throw new Error('Invalid post-handlers: ' + handlerDef.after);
    }

    // Return wrapped handler
    return this.wrapHandler(
      handlerDef.action, handlerDef.before,
      handlerDef.after, handlerDef.errorHandler
    );
  }

});

module.exports = ControllerFactory;
