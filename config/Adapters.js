var Const = require('../core/common/Const')

module.exports = {
  'mysql-master': {
    type: Const.DATA_SOURCE_TYPE.MYSQL,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 5
  },
  'mysql-slave': {
    type: Const.DATA_SOURCE_TYPE.MYSQL,
    connectionLimit: 50,
    waitForConnections: false
  },
  'mysql-master-test': {
    type: Const.DATA_SOURCE_TYPE.MYSQL,
    connectionLimit: 2,
    waitForConnections: true,
    queueLimit: 50
  },
  'mysql-slave-test': {
    type: Const.DATA_SOURCE_TYPE.MYSQL,
    connectionLimit: 50,
    waitForConnections: false
  }
}
