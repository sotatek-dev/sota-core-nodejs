var BaseClass         = require('../common/BaseClass');
var BaseEntity        = require('../entity/BaseEntity');
var logger            = require('log4js').getLogger('BaseQueryBuilder');

/**
 * Based on MySQL syntax.
 * Other db types should be customized with own query builder classes
 */
var BaseQueryBuilder = BaseClass.extend({
  classname : 'QueryBuilder',

  select : function(tableName, options) {
    var self = this;
    var sql = 'SELECT ';
    sql += self._buildColumns(options);
    sql += ' FROM ' + tableName;
    sql += self._buildWhereClause(options);

    logger.info(this.classname + '::select query=[' + sql + ']');
    return sql;
  },

  insert : function(data) {
    logger.info(this.classname + '::insert data=' + util.inspect(data));
    var self = this,
        tableName, entities;
    if (data instanceof BaseEntity) {
      tableName = data.tableName;
      entities = [data];
    } else if (_.isArray(data) && data.length > 0) {
      tableName = data[0].tableName;
      entities = data;
    } else {
      logger.error(self.classname + '::insert invalid data=' +
                    util.inspect(data));
      return null;
    }

    var cols = _.reject(_.keys(entities[0].columns), function(col) {
      var isPK = _.indexOf(entities[0].primaryKeys, col) > -1;
      return isPK;
    }).concat(entities[0].predefinedCols);

    var valueStrs = [],
        params = [];
    _.each(entities, function(entity) {
      if (tableName !== entity.tableName) {
        logger.error(self.classname + '::insert mismatch tableName (' +
                      tableName + '#' + entity.tableName + '');
        return null;
      }

      var valueStr = '(';
      valueStr += _.map(cols, function(col) {
        var prop = Utils.convertToCamelCase(col);
        if (entity[prop] === null || entity[prop] === undefined) {
          params.push(null);
        } else if (typeof entity[prop] === 'string') {
          params.push(entity[prop]);
        } else {
          params.push(entity[prop]);
        }
        return '?';
      }).join(',');
      valueStr += ')';
      valueStrs.push(valueStr);
    });

    return [self._buildInsertQuery(tableName, cols, valueStrs), params];
  },

  _buildInsertQuery : function(tableName, cols, valueStrs) {
    var self = this;
    var sql = 'INSERT INTO ';
    sql += tableName;
    sql += '(';
    sql += _.map(cols, self._escapeColumn).join(',');
    sql += ') VALUES ';
    sql += valueStrs.join(',');
    logger.info(self.classname + '::_buildInsertQuery query=[' + sql + ']');
    return sql;
  },

  updateOne : function(entity) {
    var self = this,
        tableName = entity.tableName,
        changeCols = entity.getChangedColumns(),
        params = [],
        sql = 'UPDATE ';

    sql += tableName;
    sql += ' SET ';
    sql += _.map(changeCols, function(col) {
      var prop = Utils.convertToCamelCase(col);
      params.push(self._escapeValue(entity[prop]));
      return self._escapeColumn(col) + '=?';
    }).join(',');
    sql += ' WHERE ';
    sql += _.map(entity.primaryKeys, function(col) {
      var prop = Utils.convertToCamelCase(col);
      params.push(self._escapeValue(entity[prop]));
      return self._escapeColumn(col) + '=?';
    }).join(' AND ');

    logger.info(this.classname + '::updateOne query=[' + sql + ']');
    return [sql, params];
  },

  /**
   * @param {object} options - The settings for update query.
   *   Options can contains:
   *   - {string} set     : update clause in statement
   *   - {string} where   : where clause in statment
   *   - {array}  params  : parameters for preparing statement
   */
  updateBatch : function(tableName, options) {
    var self = this;

    var sql = 'UPDATE ';
    sql += tableName;
    sql += ' SET ';
    sql += options.set;
    sql += self._buildWhereClause(options);

    logger.info(this.classname + '::updateBatch query=[' + sql + ']');
    return sql;
  },

  deleteOne : function(entity) {
    var self = this,
        params = [];

    var sql = 'DELETE FROM ';
    sql += entity.tableName;
    sql += ' WHERE ';
    sql += _.map(entity._model.primaryKeys, function(col) {
      var prop = Utils.convertToCamelCase(col);
      params.push(self._escapeValue(entity[prop]));
      return self._escapeColumn(col) + '=?';
    }).join(' AND ');
    return [sql, params];
  },

  deleteBatch : function(tableName, options) {
    var self = this;

    var sql = 'DELETE FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    logger.info(this.classname + '::deleteBatch query=[' + sql + ']');
    return sql;
  },

  count: function(tableName, options) {
    var self = this;

    var sql = 'SELECT COUNT(1) AS `count` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    logger.info(this.classname + '::count query=[' + sql + ']');
    return sql;
  },

  countGroupBy: function(tableName, groupCols, options) {
    var self = this;
    options.groupBy = groupCols;
    var sql =   'SELECT ' + _.map(groupCols, self._escapeColumn).join(',') +
                ', COUNT(1) AS `count` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    logger.info(this.classname + '::countGroupBy query=[' + sql + ']');
    return sql;
  },

  sum: function(tableName, column, options) {
    var self = this;

    var sql = 'SELECT SUM(' + self._escapeColumn(column) + ') AS `sum` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    logger.info(this.classname + '::count query=[' + sql + ']');
    return sql;
  },

  sumGroupBy: function(tableName, column, options) {
    var self = this;

    var sql =   'SELECT ' + options.groupBy + ', sum(' + column + ') AS `sum` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    logger.info(this.classname + '::sumGroupBy query=[' + sql + ']');
    return sql;
  },

  existed: function(tableName, options) {
    var self = this;

    var sql = util.format(
                'SELECT if(exists(SELECT 1 FROM %s %s), 1, 0) AS `existed`',
                tableName,
                self._buildWhereClause(options));

    logger.info(this.classname + '::existed query=[' + sql + ']');
    return sql;
  },

  _escapeColumn : function(columnName) {
    if (columnName.indexOf('.') < 0) {
      return '`' + columnName.toLowerCase() + '`';
    }

    return _.map(columnName.split('.'), function(e) {
      return '`' + e.toLowerCase() + '`';
    }).join('.');
  },

  _escapeValue : function(val) {
    if (val === null || val === undefined) {
      return 'NULL';
    }

    if (typeof val === 'string') {
      return '\'' + val + '\'';
    } else {
      return val;
    }
  },

  _buildColumns : function(options) {
    var ret = '';
    var columns = options.columns;
    if (columns && columns.length) {
      var pKeys = options.model.primaryKeys;
      if (_.intersection(columns, pKeys).length !== pKeys.length) {
        logger.error(this.classname + '::_buildColumns \
                      all primary keys must be in select criteria');
        return null;
      }

      _.each(columns, function(column) {
        ret += self._escapeColumn(column) + ',';
      });
      ret = ret.slice(0, -1); // Remove last colon
    } else {
      ret += '* ';
    }

    return ret;
  },

  _buildWhereClause : function(options) {
    var self = this,
        clause = '';

    if (options.where) {
      if (typeof options.where === 'string') {
        clause += (' WHERE ' + options.where);
      } else if (typeof options.where === 'object') {
        clause += ' WHERE ';
        clause += _.map(_.keys(options.where), function(col) {
          return self._escapeColumn(col) + '=?';
        }).join(' AND ');
      }
    }

    if (options.groupBy) {
      if (_.isArray(options.groupBy)) {
        clause += (' GROUP BY ' + _.map(options.groupBy, self._escapeColumn.bind(self)).join(','));
      } else if (typeof options.groupBy === 'string') {
        clause += (' GROUP BY ' + options.groupBy);
      }
    }

    if (options.orderBy && typeof options.orderBy === 'string') {
      clause += (' ORDER BY ' + options.orderBy);
    }

    if (options.limit) {
      clause += (' LIMIT ' + options.limit);
    }

    return clause;
  },

});

module.exports = BaseQueryBuilder;
