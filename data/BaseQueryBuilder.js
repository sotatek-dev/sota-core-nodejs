/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _               = require('lodash');
const util            = require('util');
const Class           = require('sota-class').Class;
const Utils           = require('../util/Utils');
const Const           = require('../common/Const');
const BaseEntity      = require('../entity/BaseEntity');
const Point           = require('./types/Point');
const logger          = log4js.getLogger('BaseQueryBuilder');

/**
 * Based on MySQL syntax.
 * Other db types should be customized with own query builder classes
 */
var BaseQueryBuilder = Class.extends({
  classname: 'QueryBuilder',

  select: function (tableName, options) {
    var self = this;
    var sql = 'SELECT ';
    sql += self._buildColumns(options);
    sql += ' FROM ' + tableName;
    sql += self._buildWhereClause(options);

    // logger.trace(this.classname + '::select query=[' + sql + ']')
    return sql;
  },

  insert: function (data) {
    // logger.trace(this.classname + '::insert data=' + util.inspect(data))
    var self = this;
    var tableName;
    var entities;
    var isIdIncluded;
    var isInsertIgnore;
    var onDuplicateKey;

    if (data instanceof BaseEntity) {
      tableName = data.tableName;
      isIdIncluded = data.isNewForced();
      isInsertIgnore = data.isInsertIgnore();
      onDuplicateKey = data.onDuplicateKey();
      entities = [data];
    } else if (_.isArray(data) && data.length > 0) {
      tableName = data[0].tableName;
      isIdIncluded = data[0].isNewForced();
      isInsertIgnore = data[0].isInsertIgnore();
      onDuplicateKey = data[0].onDuplicateKey();
      entities = data;
    } else {
      logger.error(self.classname + '::insert invalid data=' +
                    util.inspect(data));
      return null;
    }

    var cols = _.uniq(_.reject(_.keys(entities[0].columns), function (col) {
      let isPK = _.indexOf(entities[0].primaryKeys, col) > -1;
      var prop = Utils.convertToCamelCase(col);
      var isNull = entities[0][prop] === null || entities[0][prop] === undefined;

      return isPK || isNull;
    }).concat(entities[0].predefinedCols));

    if (isIdIncluded) {
      cols.unshift('id');
    }

    var valueStrs = [];
    var params = [];

    _.each(entities, function (entity) {
      if (tableName !== entity.tableName) {
        logger.error(self.classname + '::insert mismatch tableName (' +
                      tableName + '#' + entity.tableName + '');
        return null;
      }

      var valueStr = '(';
      valueStr += _.map(cols, function (col) {
        var prop = Utils.convertToCamelCase(col);
        if (entity[prop] === null || entity[prop] === undefined) {
          params.push(null);
        } else if (entity[prop] instanceof Point) {
          const point = entity[prop];
          return `POINT(${point.x}, ${point.y})`;
        } else if (typeof entity[prop] === 'string') {
          params.push(entity[prop]);
        } else if (typeof entity[prop] === 'boolean') {
          params.push(entity[prop] ? 1 : 0);
        } else {
          params.push(entity[prop]);
        }

        return '?';
      }).join(',');
      valueStr += ')';
      valueStrs.push(valueStr);
    });

    return [
      self._buildInsertQuery(tableName, cols, valueStrs, isInsertIgnore, onDuplicateKey),
      params
    ];
  },

  _buildInsertQuery: function (tableName, cols, valueStrs, isInsertIgnore, onDuplicateKey) {
    var self = this;
    var sql = 'INSERT ';
    if (isInsertIgnore) {
      sql += 'IGNORE ';
    }

    sql += 'INTO ';
    sql += tableName;
    sql += '(';
    sql += _.map(cols, self._escapeColumn).join(',');
    sql += ') VALUES ';
    sql += valueStrs.join(',');
    if (onDuplicateKey) {
      sql += ' ON DUPLICATE KEY UPDATE ' + onDuplicateKey;
    }

    return sql;
  },

  updateOneById: function (tableName, id, data) {
    var self = this;
    var params = [];
    var setClauses = [];
    for (let col in data) {
      setClauses.push(self._escapeColumn(col) + '=?');
      params.push(data[col]);
    }

    params.push(id);
    var sql = util.format('UPDATE %s SET %s WHERE id=?', tableName, setClauses.join(','));

    return [sql, params];
  },

  updateOne: function (entity) {
    var self = this;
    var tableName = entity.tableName;
    var changeCols = entity.getChangedColumns();
    var params = [];
    var sql = 'UPDATE ';

    sql += tableName;
    sql += ' SET ';
    sql += _.map(changeCols, function (col) {
      var prop = Utils.convertToCamelCase(col);
      params.push(entity[prop]);
      return self._escapeColumn(col) + '=?';
    }).join(',');
    sql += ' WHERE ';
    sql += _.map(entity.primaryKeys, function (col) {
      var prop = Utils.convertToCamelCase(col);
      params.push(entity[prop]);
      return self._escapeColumn(col) + '=?';
    }).join(' AND ');

    // logger.trace(this.classname + '::updateOne query=[' + sql + ']')
    return [sql, params];
  },

  /**
   * @param {object} options - The settings for update query.
   *   Options can contains:
   *   - {string} set     : update clause in statement
   *   - {string} where   : where clause in statment
   *   - {array}  params  : parameters for preparing statement
   */
  updateBatch: function (tableName, options) {
    var self = this;

    var sql = 'UPDATE ';
    sql += tableName;
    sql += ' SET ';
    sql += options.set;
    sql += self._buildWhereClause(options);

    // logger.trace(this.classname + '::updateBatch query=[' + sql + ']')
    return sql;
  },

  deleteOne: function (entity) {
    var self = this;
    var params = [];

    var sql = 'DELETE FROM ';
    sql += entity.tableName;
    sql += ' WHERE ';
    sql += _.map(entity._model.primaryKeys, function (col) {
      var prop = Utils.convertToCamelCase(col);
      params.push(entity[prop]);
      return self._escapeColumn(col) + '=?';
    }).join(' AND ');
    return [sql, params];
  },

  deleteBatch: function (tableName, options) {
    var self = this;

    var sql = 'DELETE FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    // logger.trace(this.classname + '::deleteBatch query=[' + sql + ']')
    return sql;
  },

  count: function (tableName, options) {
    var self = this;

    var sql = 'SELECT COUNT(1) AS `count` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    // logger.trace(this.classname + '::count query=[' + sql + ']')
    return sql;
  },

  countGroupBy: function (tableName, groupCols, options) {
    var self = this;
    options.groupBy = groupCols;
    var sql = 'SELECT ' + _.map(groupCols, self._escapeColumn).join(',') +
                ', COUNT(1) AS `count` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    // logger.trace(this.classname + '::countGroupBy query=[' + sql + ']')
    return sql;
  },

  sum: function (tableName, column, options) {
    var self = this;

    // If the query is aggregation of an expression,
    // column names should be escaped from outside
    var ignoreEscape = options.isExAggregation;

    var sql = 'SELECT SUM(' + self._escapeColumn(column, ignoreEscape) + ') AS `sum` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    // logger.trace(this.classname + '::count query=[' + sql + ']')
    return sql;
  },

  sumGroupBy: function (tableName, column, options) {
    var self = this;

    var sql = 'SELECT ' + options.groupBy + ', sum(' + column + ') AS `sum` FROM ';
    sql += tableName;
    sql += self._buildWhereClause(options);

    // logger.trace(this.classname + '::sumGroupBy query=[' + sql + ']')
    return sql;
  },

  existed: function (tableName, options) {
    var self = this;

    var sql = util.format(
                'SELECT if(exists(SELECT 1 FROM %s %s), 1, 0) AS `existed`',
                tableName,
                self._buildWhereClause(options));

    // logger.trace(this.classname + '::existed query=[' + sql + ']')
    return sql;
  },

  _escapeOrderColumn: function (columnName, ignoreEscape) {
    if (ignoreEscape || columnName.indexOf('`') > -1) {
      return columnName;
    }

    if (columnName.indexOf('.') < 0) {
      return '`' + columnName.toLowerCase() + '`';
    }

    return _.map(columnName.split('.'), function (e) {
      return '`' + e.toLowerCase() + '`';
    }).join('.');
  },

  _escapeColumn: function (columnName, ignoreEscape) {
    if (ignoreEscape || columnName.indexOf('`') > -1) {
      return columnName;
    }

    if (columnName.indexOf('.') < 0) {
      return '`' + columnName.toLowerCase() + '`';
    }

    return _.map(columnName.split('.'), function (e) {
      return '`' + e.toLowerCase() + '`';
    }).join('.');
  },

  _buildColumns: function (options) {
    var ret = '';
    var columns = options.columns;
    if (columns && columns.length) {
      if (typeof columns === 'string') {
        return columns;
      }

      if (_.isArray(columns)) {
        return columns.join(',');
      }
    } else {
      ret += '*';
    }

    return ret;
  },

  _buildWhereClause: function (options) {
    var self = this;
    var clause = '';

    if (options.where) {
      if (typeof options.where === 'string') {
        clause += (' WHERE ' + options.where);
      } else if (_.isPlainObject(options.where)) {
        clause += ' WHERE ';
        clause += _.map(_.keys(options.where), function (col) {
          return self._escapeColumn(col) + '=?';
        }).join(' AND ');
      }
    }

    if (options.groupBy) {
      if (typeof options.groupBy === 'string') {
        clause += (' GROUP BY ' + options.groupBy);
      } else if (_.isArray(options.groupBy)) {
        clause += (' GROUP BY ' + _.map(options.groupBy, self._escapeColumn.bind(self)).join(','));
      } else {
        throw new Error('Invalid groupBy options: ' + util.inspect(options.groupBy));
      }
    }

    if (options.having) {
      if (typeof options.having === 'string') {
        clause += (' HAVING ' + options.having);
      } else if (_.isArray(options.having)) {
        if (options.having.length > 0) {
          clause += ' HAVING ';
          clause += options.having.join(' AND ');
        }
      } else {
        throw new Error('Invalid having options: ' + options.having);
      }
    }

    if (options.orderBy) {
      if (typeof options.orderBy === 'string') {
        clause += (' ORDER BY ' + options.orderBy);
      } else if (_.isArray(options.orderBy)) {
        clause += (' ORDER BY ' + _.map(options.orderBy, self._escapeColumn.bind(self)).join(','));
      } else {
        throw new Error('Invalid orderBy options: ' + options.orderBy);
      }
    }

    if (options.limit) {
      clause += (' LIMIT ' + ((options.limit < 0) ? Const.MAX_QUERY_RECORDS : options.limit));
    }

    if (options.offset) {
      clause += (' OFFSET ' + options.offset);
    }

    return clause;
  }

});

module.exports = BaseQueryBuilder;
