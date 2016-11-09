var BaseAdapter         = require('../BaseAdapter');
var QueryBuilder        = require('./MySQLQueryBuilder');
var logger              = require('log4js').getLogger('MySQLAdapter');

module.exports = BaseAdapter.extends({
  classname : 'MySQLAdapter',

  initialize : function($super, exSession, pool) {
    $super(exSession);
    this._pool        = pool;
    this._connections = [];
  },

  beginTransaction : function(callback) {
    logger.info('MySQLAdapter::beginTransaction TODO');
    callback();
  },

  commit : function(callback) {
    logger.info('MySQLAdapter::commit TODO');
    callback();
  },

  rollback : function(callback) {
    logger.info('MySQLAdapter::rollback TODO');
    callback();
  },

  _exec : function(sqlQuery, params, callback) {
    logger.info('_exec sqlQuery=[' + sqlQuery + '], params=' + util.inspect(params));
    var self = this,
        connection = null,
        isSelecting = sqlQuery.toUpperCase().indexOf('SELECT') === 0;

    async.waterfall([
      function(next) {
        self._pool.getConnection(next);
      },
      function(conn, next) {
        connection = conn;
        connection.beginTransaction(function(err) {
          next(err, null);
        });
      },
      function(ret, next) {
        if (!isSelecting) {
          self._connections.push(connection);
        }
        connection.query(sqlQuery, params, next);
      },
      function(rows, fields, next) {
        if (isSelecting) {
          connection.release();
        }

        next(null, rows);
      },
    ], function(err, rows) {
      if (err) {
        logger.error(self.classname + '::exec err=' + err);
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

  _finishConnections: function(method, callback) {
    var self = this,
        tasks = [];

    for (let i = 0; i < this._connections.length; i++) {
      let connection = this._connections[i];
      tasks.push(function(next) {
        async.waterfall([
          function finish(_next) {
            connection[method](_next);
          },
          function release(rows, fields, _next) {
            connection.release();
            _next();
          }
        ], next);
      });
    }

    var _callback = function() {
      self._connections = [];
      callback(null, null);
    }

    async.parallel(tasks, _callback);
  },

  destroy : function() {
    if (this._connections && this._connections.length > 0) {
      for (let i = 0; i < this._connections.length; i++) {
        this._connections[i].release();
        delete this._connections[i];
      }
    }
    delete this._connections;
  },

});
