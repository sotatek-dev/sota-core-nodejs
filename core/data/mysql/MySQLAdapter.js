var BaseAdapter         = require('../BaseAdapter');
var QueryBuilder        = require('./MySQLQueryBuilder');

module.exports = BaseAdapter.extend({
  classname : 'MySQLAdapter',

  initialize : function($super, exSession, pool) {
    $super(exSession);
    this._pool        = pool;
    this._connection  = null;
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
    logger.info('MySQLConnection::exec sqlQuery=['+sqlQuery+'], params=' + util.inspect(params));
    var self = this;
    async.auto({
      connect : function(next) {
        if (self._connection) {
          next(null, self._connection);
        } else {
          self._pool.getConnection(next);
        }
      },
      exec : ['connect', function(ret, next) {
        self._connection = ret.connect;
        self._connection.query(sqlQuery, params, next);
      }],
    }, function(err, res) {
      if (err) {
        logger.error(self.classname + '::exec err=' + err);
        callback(err);
        return;
      }

      callback(err, res.exec[0]);
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
        var sqlQuery = QueryBuilder.insert(entity);
        if (!sqlQuery) {
          callback(self.classname + '::insertOne something went wrong. Couldn\'t build query.');
          return;
        }
        self._exec(sqlQuery, [], next);
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
        var sqlQuery = QueryBuilder.insert(entities);

        if (!sqlQuery) {
          callback(self.classname + '::insertBatch something went wrong. Couldn\'t build query.');
        }

        self._exec(sqlQuery, [], next);
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
    var sqlQuery = QueryBuilder.updateOne(entity);

    if (!sqlQuery) {
      callback(this.classname + '::updateOne something went wrong. Couldn\'t build query.');
    }

    this._exec(sqlQuery, [], callback);
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

    this._exec(sqlQuery, [], callback);
  },

  deleteOne : function(entity, callback) {
    var sqlQuery = QueryBuilder.deleteOne(entity);

    if (!sqlQuery) {
      callback(this.classname + '::deleteOne something went wrong. Couldn\'t build query.');
      return;
    }

    this._exec(sqlQuery, [], callback);
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

      logger.warn('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> MySQLAdapter::count TODO implement me.');
      logger.warn('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ret=' + JSON.stringify(ret));
      callback(null, 1000); // TODO: remove harded code test
    });
  },

  countGroupBy: function(tableName, groupCols, options, callback) {
    var sqlQuery = QueryBuilder.countGroupBy(tableName, options);
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

      logger.warn('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> MySQLAdapter::countGroupBy TODO implement me.');
      logger.warn('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ret=' + JSON.stringify(ret));
      callback(null, []); // TODO: remove harded code test
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
    // TODO
    callback();
  },

  rollback: function(callback) {
    // TODO
    callback();
  },

  destroy : function() {
    if (this._connection) {
      this._connection.release();
    }
  },

});
