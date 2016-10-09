var BaseService = require('../../core/service/BaseService');

module.exports = BaseService.extend({
  classname : 'TestUserStatusService',

  insert : function(callback) {
    var self = this;
    var UserStatusModel = self.getModel('UserStatusModel');

    callback();
  }
});