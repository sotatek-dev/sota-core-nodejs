var util        = require('util');
var fs          = require('fs');
var mysql       = require('mysql');
var _           = require('lodash');
var async       = require('async');
var Types       = require('../../node_modules/mysql/lib/protocol/constants/types');

var BaseClass   = require('../../common/BaseClass');
var BaseModel   = require('../../model/BaseModel');

module.exports = BaseClass.extend({
  classname: 'MySQLSchemaGetter',

  /**
   * @param
   */
  initialize: function(config, tables, targetFile) {
    // Convert from project style to mysql style
    this._config = {
      host     : config.dbHost,
      user     : config.dbUser,
      password : config.dbPwd,
      database : config.dbName,
    };

    this._tables = tables;
    this._targetFile = targetFile;
  },

  run: function() {
    var self = this;
    self._schemaDef = {};

    async.forEach(
      self._tables,
      self._getOneTableSchema.bind(self),
      self._buildSchemaFile.bind(self)
    );
  },

  _getOneTableSchema: function(def, callback) {
    var tableName = def.tableName,
        classname = def.classname;
    logger.info('Processing table: ' + tableName);
    var self = this,
        sqlQuery = util.format('SELECT * FROM %s LIMIT 1', tableName),
        connection = mysql.createConnection(this._config);

    connection.connect();
    connection.query(sqlQuery, function(err, rows, fields) {
      if (err) {
        throw err;
      }

      var def = {};
      _.forEach(fields, function(field) {
        if (field.name === 'id' || _.includes(BaseModel.predefinedCols, field.name)) {
          return;
        }

        def[field.name] = {
          type: self._getType(field.type),
          length: field.length,
          // default: field.default,
        };
      });
      self._schemaDef[classname] = def;
      callback();
    });
    connection.end();
  },

  _buildSchemaFile: function(err, ret) {
    if (err) {
      logger.error(err);
      return;
    }

    logger.info('Retrieved schema successfully. ' + ret);

    var self = this;
    // const content = 'module.exports = ' + JSON.stringify(this._schemaDef, null, 2);
    const content = '\n/**' +
                    '\n * This file is auto-generated' +
                    '\n * Please don\'t update it manually' +
                    '\n * Run command `npm run schema` to re-generate this' +
                    '\n */' +
                    '\n\n module.exports = ' + util.inspect(this._schemaDef);

    fs.writeFile(this._targetFile, content, function(err) {
      if (err) {
        logger.error('Failed to write schema file : ${err.message}');
        return;
      }
      logger.info('Schema file was saved: ' + self._targetFile);
    });
  },

  _getType: function(type) {
    switch (type) {
      case Types.TIMESTAMP:
      case Types.TIMESTAMP2:
      case Types.DATE:
      case Types.DATETIME:
      case Types.DATETIME2:
      case Types.NEWDATE:
        return 'date';
      case Types.TINY:
      case Types.SHORT:
      case Types.LONG:
      case Types.INT24:
      case Types.YEAR:
      case Types.FLOAT:
      case Types.DOUBLE:
      case Types.NEWDECIMAL:
      case Types.LONGLONG:
        return 'number';
      case Types.BIT:
      case Types.TINY_BLOB:
      case Types.MEDIUM_BLOB:
      case Types.LONG_BLOB:
      case Types.BLOB:
        return 'buffer';
      default:
        return 'string';
    }
  },

});
