var BaseAdapter         = require('../BaseAdapter');
var QueryBuilder        = require('./MySQLQueryBuilder');
var logger              = log4js.getLogger('MySQLAdapter');

var _nextId = 0;
var _DEBUG_ADAPTERS = [];

module.exports = BaseAdapter.extends({
  classname : 'MySQLAdapter',

  initialize : function($super, exSession, pool, mode) {
    $super(exSession);
    // For bug tracing only
    this._mode          = mode;
    this._pool          = pool;
    this._connection    = null;
    this._gotConnection = false;
    this._isFinished    = false;
    this._isDestroyed   = false;
    this._retryCount    = 0;
    this.registryId     = ++_nextId;
  },

  _exec : function(sqlQuery, params, callback) {
    var self = this;

    /**
     * If the business handler is socket
     * There're cases that the socket disconnects, means the ExSession is destroyed
     * While other queries are still being in process
     * Just return an error for this case
     */
    if (self._isDestroyed) {
      logger.error(this.classname + '::_exec adapter is already destroyed id=' + self.registryId);
      return callback(new Error('DB connection has been terminated.'));
    }

    /**
     * If:
     * - the adapter is trying to get connection, but it's not finished
     * - the connection is in finishing process, but is not released completely
     * Then:
     * - Just retry execution in the next tick, when everything is settled up
     * -> Is there any better solution for this?
     */
    if ((self._gotConnection && !self._connection) ||
        (self._isFinished && self._connection)) {
      // logger.fatal(util.format(
      //   'Adapter <%s>: wait for next tick to get connection. Pending query: [%s]',
      //   self.registryId, sqlQuery));

      // Should we throw error if the connection has to wait for a too long time?
      self._retryCount++;
      if (self._retryCount > 50) {
        if (self._gotConnection && !self._connection) {
          logger.error('_exec waiting for getting connection but failed...');
        }
        if (self._isFinished && self._connection) {
          logger.error('_exec connection is finishing but not complete...');
        }
        throw new Error(util.format('%s::_exec maximum retry exceeds. Query: [%s]',
          self.classname, sqlQuery));
      }

      return setTimeout(function() {
        self._exec(sqlQuery, params, callback);
      }, Const.PENDING_QUERY_TIMEOUT);
    }

    /**
     * Finally, here comes the real handler for connection/query to DB
     */
    _DEBUG_ADAPTERS.push(this.registryId);
    _DEBUG_ADAPTERS = _.compact(_.uniq(_DEBUG_ADAPTERS));

    logger.info(util.format(
      '<%s>::_exec sqlQuery=[%s], params=[%s], active adapters: %s',
      this.registryId, sqlQuery, params, util.inspect(_DEBUG_ADAPTERS))
    );

    async.waterfall([
      function getConnection(next) {
        if (self._connection) {
          return next(null, self._connection);
        } else {
          self._isFinished = false;
          self._gotConnection = true;
          return self._pool.getConnection(next);
        }
      },
      function beginTransaction(connection, next) {
        self._connection = connection;
        if (self._mode === 'w') {
          logger.trace(util.format('<%s> beginTransaction', self.registryId));
          self._connection.beginTransaction(function(err) {
            next(err, null);
          });
        } else {
          next(null, null);
        }
      },
      function(ret, next) {
        self._connection.query(sqlQuery, params, function(err, rows, fields) {
          if (err) {
            return next(err);
          }

          return next(null, rows);
        });
      },
    ], function(err, rows) {
      if (err) {
        logger.error('Something went wrong when running query: [' + sqlQuery + ']');
        logger.error('<' + self.registryId + '>::exec err=' + util.inspect(err));
        callback(err);
        return;
      }

      callback(err, rows);
    });
  },

  select : function(tableName, options, callback) {
    var sqlQuery = QueryBuilder.select(tableName, options);

    if (!sqlQuery) {
      callback(this.classname + '::select something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, callback);

  },

  insertOne : function(entity, callback) {
    var self = this;
    async.auto({
      insert: function(next) {
        var [sqlQuery, params] = QueryBuilder.insert(entity);
        if (!sqlQuery) {
          callback(self.classname + '::insertOne something went wrong. Couldn\'t build query.');
          return;
        }
        self._exec(sqlQuery, params, next);
      }
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      entity.id = ret.insert.insertId || 0;
      callback(null, entity);
    });
  },

  insertBatch : function(entities, callback) {
    var self = this;
    async.auto({
      beforeSave : function(next) {
        async.forEach(entities, function(entity, _next) {
          entity.beforeSave(_next);
        }, next);
      },
      insert : ['beforeSave', function(ret, next) {
        var [sqlQuery, params] = QueryBuilder.insert(entities);

        if (!sqlQuery) {
          callback(self.classname + '::insertBatch something went wrong. Couldn\'t build query.');
        }

        self._exec(sqlQuery, params, next);
      }],
      afterSave : ['insert', function(ret, next) {
        async.forEach(entities, function(entity, _next) {
          entity.afterSave(_next);
        }, next);
      }],
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret.insert);
    });

  },

  updateOneById: function(tableName, id, data, callback) {
    var [sqlQuery, params] = QueryBuilder.updateOneById(tableName, id, data);

    if (!sqlQuery) {
      callback(this.classname + '::updateOneById something went wrong. Couldn\'t build query.');
    }

    this._exec(sqlQuery, params, callback);
  },

  updateOne : function(entity, callback) {
    var [sqlQuery, params] = QueryBuilder.updateOne(entity);

    if (!sqlQuery) {
      callback(this.classname + '::updateOne something went wrong. Couldn\'t build query.');
    }

    this._exec(sqlQuery, params, callback);
  },

  /**
   * @param {string} tableName - The table that have record to be deleted.
   * @param {object} options - The settings for update query.
   *   Options can contains:
   *   - {string} set   : update clause in statement
   *   - {string} where   : where clause in statment
   *   - {array}  params  : parameters for preparing statement
   */
  updateBatch : function(tableName, options, callback) {
    var sqlQuery = QueryBuilder.updateBatch(tableName, options);

    if (!sqlQuery) {
      callback(this.classname + '::updateBatch something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, callback);
  },

  deleteOne : function(entity, callback) {
    var [sqlQuery, params] = QueryBuilder.deleteOne(entity);

    if (!sqlQuery) {
      callback(this.classname + '::deleteOne something went wrong. Couldn\'t build query.');
      return;
    }

    this._exec(sqlQuery, params, callback);
  },

  deleteBatch : function(tableName, options, callback) {
    var sqlQuery = QueryBuilder.deleteBatch(tableName, options);

    if (!sqlQuery) {
      callback(this.classname + '::deleteBatch something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, callback);
  },

  count: function(tableName, options, callback) {
    var sqlQuery = QueryBuilder.count(tableName, options);
    if (!sqlQuery) {
      callback(this.classname + '::count something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      if (!ret.length) {
        logger.error('Something went wrong. Count query doesn\'t return any row: ' + sqlQuery);
        callback(ErrorFactory.internal());
        return;
      }

      if (typeof ret[0].count !== 'number') {
        logger.error('Something went wrong. Count query doesn\'t return number: ' + sqlQuery);
        callback(ErrorFactory.internal());
        return;
      }

      callback(null, ret[0].count);
    });
  },

  countGroupBy: function(tableName, groupCols, options, callback) {
    var sqlQuery = QueryBuilder.countGroupBy(tableName, groupCols, options);
    if (!sqlQuery) {
      callback(this.classname + '::countGroupBy something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret);
    });
  },

  sum: function(tableName, column, options, callback) {
    var sqlQuery = QueryBuilder.sum(tableName, column, options);
    if (!sqlQuery) {
      callback(this.classname + '::sum something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      if (!ret.length) {
        logger.error('Something went wrong. Sum query doesn\'t return any row: ' + sqlQuery);
        callback(ErrorFactory.internal());
        return;
      }

      if (ret[0].sum && typeof ret[0].sum !== 'number') {
        logger.error('Something went wrong. Sum query doesn\'t return number: ' + sqlQuery);
        callback(ErrorFactory.internal());
        return;
      }

      callback(null, ret[0].sum || 0);
    });
  },

  sumGroupBy: function(tableName, column, options, callback) {
    var sqlQuery = QueryBuilder.sumGroupBy(tableName, column, options);
    if (!sqlQuery) {
      callback(this.classname + '::sumGroupBy something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret);
    });
  },

  existed: function(tableName, options, callback) {
    var sqlQuery = QueryBuilder.existed(tableName, options);
    if (!sqlQuery) {
      callback(this.classname + '::existed something went wrong. Couldn\'t build query.');
      return;
    }

    var params = [];
    if (options && options.params && _.isArray(options.params)) {
      params = options.params;
    }

    this._exec(sqlQuery, params, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, !!ret[0].existed);
    });
  },

  commit: function(callback) {
    this._finishConnections('commit', callback);
  },

  rollback: function(callback) {
    this._finishConnections('rollback', callback);
  },

  /**
   * Each times commit/rollback methods are invoked from ExSession
   * All the corresponding method of generated models are invoked as well
   * So these methods of one adapter can be called multiple times from different models
   * The _isFinished flag is used to mark the adapter that is in finishing process already
   */
  _finishConnections: function(method, callback) {
    if (this._isFinished) {
      return callback(null, null);
    }

    this._isFinished = true;
    logger.trace(util.format('%s::_finishConnections id=<%s> method=%s',
      this.classname, this.registryId, method));
    var self = this;

    if (!self._connection) {
      self._recycleConnection(callback);
      return;
    }

    self._connection[method](function(err) {
      /**
       * If error happens, should try again or just continue to recycle connection?
       */
      if (err) {
        logger.error(err);
        self._finishConnections(method, callback);
        return;
      }

      self._recycleConnection(callback);
    });

    return;
  },

  /**
   * If the request timeout, or somehow the commit/rollback methods are not invoked
   * The destroy method may come first
   * This case is treated as an unexpected error
   * All changes will be rolled-back before the connection is released
   */
  destroy : function() {
    /**
     * Since the destroy methods can be called multiple-times from multi models
     * We need a flag to mark the destroying process is being done
     */
    if (this._isDestroyed) {
      return;
    }
    this._isDestroyed = true;
    // logger.trace(util.format('%s::destroy id=[%s]', this.classname, this.registryId));

    var self = this;

    /**
     * If the connection is finished normally
     * Or the connection was never created
     * Everything will be ended gracefully
     */
    if (!self._connection) {
      self._destroy();
      return;
    }

    /**
     * If the connection is not finished completely
     * But the rollback/commit is already called
     */
    if (self._isFinished) {
      self._connection.release();
      self._destroy();
      return;
    }

    /**
     * Otherwise, just try to finish DB connection before destroying process
     */
    self.rollback(function() {
      self._destroy();
    });

    return;
  },

  _recycleConnection: function(callback) {
    _DEBUG_ADAPTERS = _.pull(_DEBUG_ADAPTERS, this.registryId);
    logger.trace(util.format(
      '%s::_recycleConnection release connection id=[%s], current left adapters=%s',
      this.classname, this.registryId, util.inspect(_DEBUG_ADAPTERS)));

    if (this._connection) {
      this._connection.release();
    }

    this._retryCount = 0;
    this._connection = null;
    this._gotConnection = false;

    return callback(null, null);
  },

  /**
   * Physically reallocate all properties of this adapter object
   */
  _destroy: function() {
    delete this._mode;
    delete this._pool;
    delete this._retryCount;
    delete this._connection;
    delete this._gotConnection;
    delete this._isFinished;
  },

});
