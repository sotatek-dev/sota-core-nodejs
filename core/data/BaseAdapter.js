var BaseClass = require('../common/BaseClass');

var BaseAdapter = BaseClass.extend({
  classname : 'BaseAdapter',

  initialize: function(exSession) {
    // logger.info('BaseAdapter<' + this.classname + '>::initialize config=' + util.inspect(config));
    this._exSession = exSession;
  },

  select : function(options, callback) {
    logger.error(this.classname + '::select must be implemented in derived class.');
    callback();
  },

  insertOne : function(entity, callback) {
    logger.error(this.classname + '::insertOne must be implemented in derived class.');
    callback();
  },

  insertBatch : function(entities, callback) {
    logger.error(this.classname + '::insertBatch must be implemented in derived class.');
    callback();
  },

  updateOne : function(entity, callback) {
    logger.error(this.classname + '::updateOne must be implemented in derived class.');
    callback();
  },

  updateBatch : function(options, callback) {
    logger.error(this.classname + '::updateBatch must be implemented in derived class.');
    callback();
  },

  deleteOne : function(entity, callback) {
    logger.error(this.classname + '::deleteOne must be implemented in derived class.');
    callback();
  },

  deleteBatch : function(options, callback) {
    logger.error(this.classname + '::deleteBatch must be implemented in derived class.');
    callback();
  },

});

module.exports = BaseAdapter;
