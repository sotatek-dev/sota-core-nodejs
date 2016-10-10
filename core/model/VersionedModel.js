var BaseModel = require('./BaseModel');

/**
 * The masterdata's tables
 * TODO: implement this
 */
module.exports = BaseModel.extend({
  classname: 'VersionedModel',

  getCurrent: function(callback) {
    this._select({
      where: '1=1',
      limit: 9999
    }, callback);
  },

  getByVersion: function(version, callback) {
    // TODO: implement this
    getCurrent(callback);
  }

});
