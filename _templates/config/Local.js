/**
 * Copy the _Local.js.template to Local.js then modify it
 * Here comes your own configuration for local environment
 * This will override all other settings
 * Local.js should be ignored on git repos
 */

module.exports = {
  adapters: {
    'mysql-master' : {
      dbName  : 'DB_NAME_HERE',
      dbUser  : 'DB_USER_HERE',
      dbPwd   : 'DB_PASS_HERE',
      dbHost  : 'DB_HOST_HERE',
    },
    'mysql-slave' : {
      dbName  : 'DB_NAME_HERE',
      dbUser  : 'DB_USER_HERE',
      dbPwd   : 'DB_PASS_HERE',
      dbHost  : 'DB_HOST_HERE',
    },
    'mysql-master-test' : {
      dbName  : 'DB_NAME_HERE',
      dbUser  : 'DB_USER_HERE',
      dbPwd   : 'DB_PASS_HERE',
      dbHost  : 'DB_HOST_HERE',
    },
    'mysql-slave-test' : {
      dbName  : 'DB_NAME_HERE',
      dbUser  : 'DB_USER_HERE',
      dbPwd   : 'DB_PASS_HERE',
      dbHost  : 'DB_HOST_HERE',
    },
  }
}
