/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _                 = require('lodash');
const async             = require('async');
const mongoose          = require('mongoose');
const CacheFactory      = require('../cache/foundation/CacheFactory');
const Utils             = require('../util/Utils');
const BaseEntity        = require('./BaseEntity');

module.exports = BaseEntity.extends({
  classname: 'MongooseEntity',

  initialize: function ($super, model, data) {
    this._model = model;
    this._document = null;
    this.classname = model.classname.replace('Model', 'Entity');
    this.excludedProps = _.map(model.excludedCols || [], function (columnName) {
      return Utils.convertToCamelCase(columnName);
    }).concat(model.excludedProps || []);

    this.setData(data);
  },

  createDocument: function () {
    const adapter = this._model.getMasterAdapter();
    this._document = adapter.createMongooseDocument(this);
  },

  setData: function (data) {
    if (data instanceof mongoose.Document) {
      this._document = data;
      return;
    }

    if (!this._document) {
      this.createDocument();
    }

    this._document.set(data);
  },

  isNew: function () {
    return !this._document || this._document.isNew();
  },

  toJSON: function () {
    if (!this._document) {
      return {};
    }

    let output = _.assign({}, { id: this._document._id }, this._document.toJSON());
    return _.omit(output, this.excludedProps);
  },

  toString: function () {
    return JSON.stringify(this.toJSON());
  },

  save: function (callback) {
    if (!this._document) {
      this.createDocument();
    }

    this._document.save((err) => {
      if (err) {
        return callback(err);
      }

      this.getModel().setLocalCache(this);
      return callback(null, this);
    });
  },

});
