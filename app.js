require('dotenv').config();

(function boot() {
  var SotaServer = require('./core/SotaServer');
  return new SotaServer();
})();
