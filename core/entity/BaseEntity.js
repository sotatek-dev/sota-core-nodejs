var BaseClass = require('../common/BaseClass');

module.exports = BaseClass.extend({
  classname : 'BaseEntity',

  initialize : function(model, data) {
    // logger.info(this.classname + '::initialize data=' + util.inspect(data));
    this._model         = model;
    this._data          = {};
    this._dataOld       = {};

    this.tableName      = model.tableName;
    this.primaryKeys    = model.primaryKeys;
    this.columns        = model.columns;
    this.predefinedCols = model.predefinedCols;

    if (!data.id) {
      data.id = 0;
    }

    this.setData(data);
    this._refreshLocal();
  },

  getChangedColumns : function() {
    var self = this;
    return _.select(_.keys(self._model.columns), function(col) {
      var prop = Utils.convertToCamelCase(col);
      return self._data[prop] !== self._dataOld[prop];
    }).concat(self._model.predefinedCols);
  },

  getColumnValues : function() {
    return _.values(this._data);
  },

  toJSON: function() {
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

    _.each(self._model.getColumnNames(), function(p) {
      if (_.indexOf(self._model.predefinedCols, p) > -1 || p === 'id') {
        return;
      }

      var property = Utils.convertToCamelCase(p.toLowerCase());
      if (!!self._model.columns[p].isNotNull && _.isEmpty(self._data[property])) {
        result = false;
      }

    });

    return result;
  },

  setData: function(data) {
    var self = this;
    _.each(this._model.getColumnNames(), function(p) {
      if (data[p] === undefined) {
        return;
      }

      // property = p.toLowerCase();
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

      property = Utils.convertToCamelCase(p.toLowerCase());
      self._data[property]  = data[p];

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
        logger.warn('Entity has no update: ' + util.inspect(this));
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
      self.createdAt = now;
      self.createdBy = 0;
      if (self._model.getExSession().getUserId) {
        self.createdBy = self._model.getExSession().getUserId();
      }
    }

    self.updatedAt = now;
    self.updatedBy = 0;
    if (self._model.getExSession().getUserId) {
      self.updatedBy = self._model.getExSession().getUserId();
    }

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
      return self._data[prop] !== self._dataOld[prop];
    });
  },

  _refreshLocal: function() {
    var self = this;
    _.each(this._model.getColumnNames(), function(p) {
      self._dataOld[p] = self._data[p];
    });
  },

  $extractDataFromEntities : function(entities) {
    return _.pluck(entities, '_data');
  },

});
