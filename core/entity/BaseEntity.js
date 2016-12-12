var Class     = require('sota-class').Class;
var logger    = require('log4js').getLogger('BaseEntity');

module.exports = Class.extends({
  classname : 'BaseEntity',

  initialize : function(model, data) {
    // logger.trace(this.classname + '::initialize data=' + util.inspect(data));
    this._model         = model;
    this._data          = {};
    this._dataOld       = {};

    this.classname      = model.classname.replace('Model', 'Entity');
    this.tableName      = model.tableName;
    this.primaryKeys    = model.primaryKeys;
    this.columns        = model.columns;
    this.predefinedCols = model.predefinedCols;
    this.excludedCols   = model.excludedCols || [];

    if (!data.id) {
      data.id = 0;
    }

    this.setData(data);
    this._refreshLocal();
  },

  getChangedColumns : function() {
    var self = this;
    return _.filter(_.keys(self._model.columns), function(col) {
      var prop = Utils.convertToCamelCase(col);
      return self._data[prop] !== self._dataOld[prop];
    }).concat(self._model.predefinedCols);
    return self;
  },

  getColumnValues : function() {
    return _.values(this._data);
  },

  excludeFromResult: function(columnName) {
    var self = this;
    if (_.isArray(columnName)) {
      _.forEach(columnName, function(col) {
        self.excludeFromResult(col);
      });
      return self;
    }

    if (!_.includes(this.excludedCols, columnName)) {
      this.excludedCols.push(columnName);
    }

    return this;
  },

  includeToResult: function(columnName) {
    if (_.includes(this.excludedCols, columnName)) {
      _.remove(this.excludedCols, function(e) {
        return e === columnName;
      });
    }
    return this;
  },

  toJSON: function() {
    if (this.excludedCols.length > 0) {
      return _.omit(this._data, this.excludedCols);
    }

    return this._data;
  },

  // toJSON alias
  getData : function() {
    return this.toJSON();
  },

  toString : function() {
    return JSON.stringify(this._data);
  },

  inspect : function(depth) {
    return this.classname + (depth ? '<' + depth + '>' : '') + '(' + this.toString() + ')';
  },

  isDataValid : function() {
    var self    = this,
        result  = true;

    _.each(self._model.getColumnNames(), function(columnName) {
      if (_.indexOf(self._model.predefinedCols, columnName) > -1 || columnName === 'id') {
        return;
      }

      var property = Utils.convertToCamelCase(columnName.toLowerCase());
      if (!!self._model.columns[columnName].isNotNull && _.isEmpty(self._data[property])) {
        result = false;
      }

    });

    return result;
  },

  setData: function(data) {
    var self = this,
        now = Utils.now(),
        exSession = this._model.getExSession();
    var userId = exSession ? exSession.getUserId() : 0;
    _.each(this._model.getColumnNames(), function(columnName) {
      let property = Utils.convertToCamelCase(columnName.toLowerCase());

      if (data[columnName] === undefined) {
        if (data[property] === undefined) {
          if (_.includes(self._model.predefinedCols, columnName)) {
            if (columnName === 'created_at' || columnName === 'updated_at') {
              data[columnName] = now;
            } else if (columnName === 'created_by' || columnName === 'updated_by') {
              data[columnName] = userId;
            } else {
              return;
            }
          } else {
            return;
          }
        } else {
          data[columnName] = data[property];
        }
      }

      // Always freeze 'id' property if it has value already
      if (columnName === 'id' && self._data.id > 0) {
        return;
      }

      // property = columnName.toLowerCase();
      // /*jshint loopfunc: true */
      // this.__defineGetter__(property, function(property) {
      //   return self._data[property];
      // }.bind(this, property));
      // /*jshint loopfunc: true */
      // this.__defineSetter__(property, function(property, value) {
      //   self._data[property] = value;
      // }.bind(this, property));

      /**
       * AnNH TODO: should we convert property name from snake-case
       * into camel-case here? Is it too magical?
       */

      if (typeof data[columnName] === 'string' && data[columnName] === '_NULL') {
        self._data[property] = null;
      } else {
        self._data[property] = data[columnName];
      }

      /*jshint loopfunc: true */
      self.__defineGetter__(property, function(property) {
        return self._data[property];
      }.bind(self, property));
      /*jshint loopfunc: true */
      self.__defineSetter__(property, function(property, value) {
        self._data[property] = value;
      }.bind(self, property));
    });

    return this;
  },

  setExtra: function(data) {
    var self = this;
    var presetKeys = _.map(self._model.primaryKeys.concat(self._model.predefinedCols), function(c) {
      return Utils.convertToCamelCase(c);
    });

    var dataKeys = _.filter(_.keys(data), function(k) {
      return !_.includes(presetKeys, k);
    });

    if (_.intersection(this._model.getAttributeNames(), dataKeys).length > 0) {
      logger.error('Cannot set extra data to mapped column. data=' + util.inspect(data));
      return;
    }

    _.forEach(dataKeys, function(property) {
      self._data[property] = data[property];

      /*jshint loopfunc: true */
      self.__defineGetter__(property, function(property) {
        return self._data[property];
      }.bind(self, property));
      /*jshint loopfunc: true */
      self.__defineSetter__(property, function(property, value) {
        self._data[property] = value;
      }.bind(self, property));

    });

    return this;
  },

  _save : function(callback) {
    var self = this;
    var adapter = this._model.getMasterAdapter();
    if (self.isNew()) {
      adapter.insertOne(this, callback);
    } else {
      if (self.isChanged()) {
        adapter.updateOne(this, callback);
      } else {
        logger.trace('Entity has no update: ' + util.inspect(this));
        callback(null, this);
      }
    }
  },

  save : function(callback) {
    if (this.isNew() && !this.isDataValid()) {
      logger.error('Cannot save invalid new entity: ' + util.inspect(this));
      callback('Cannot save invalid new entity');
      return;
    }

    var self = this;
    async.auto({
      before : function(next) {
        self.beforeSave(next);
      },
      save : ['before', function(ret, next) {
        self._save(next);
      }],
      after : ['save', function(ret, next) {
        self.afterSave(next);
      }],
    }, function(err, ret) {
      if (err) {
        callback(err, ret);
        return;
      }

      callback(err, self);
    });
  },

  beforeSave : function(callback) {
    var self = this;
    var now = Utils.now();

    if (self.isNew()) {
      if (_.includes(self._model.predefinedCols, 'created_at')) {
        self.createdAt = now;
      }
      self.createdBy = 0;
      self.createdBy = self._model.getExSession().getUserId();
    }

    if (_.includes(self._model.predefinedCols, 'updated_at')) {
      self.updatedAt = now;
    }

    self.updatedBy = 0;
    self.updatedBy = self._model.getExSession().getUserId();

    if (callback && typeof callback === 'function') {
      callback();
    }
  },

  afterSave : function(callback) {
    this._refreshLocal();

    if (callback && typeof callback === 'function') {
      callback();
    }
  },

  isNew : function() {
    return !this._data.id || this._data.id < 0;
  },

  isChanged : function() {
    var self = this;
    return _.some(_.keys(self._model.columns), function(col) {
      var prop = Utils.convertToCamelCase(col);
      // logger.debug(self.classname + '::isChanged check prop=' + prop +
      //   ', oldValue=' + self._dataOld[prop] +
      //   ', newValue=' + self._data[prop] +
      //   ', result=' + (self._data[prop] !== self._dataOld[prop])
      // );
      return self._data[prop] !== self._dataOld[prop];
    });
  },

  _refreshLocal: function() {
    var self = this;
    _.each(this._model.getAttributeNames(), function(property) {
      self._dataOld[property] = self._data[property];
    });
  },

  $extractDataFromEntities : function(entities) {
    return _.map(entities, '_data');
  },

});
