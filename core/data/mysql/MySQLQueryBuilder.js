var BaseQueryBuilder = require('../BaseQueryBuilder')

var MySQLQueryBuilder = BaseQueryBuilder.singleton({
  classname: 'MySQLQueryBuilder'

})

module.exports = MySQLQueryBuilder
