module.exports = {
  adapters: {
    'mysql-master' : {
      dbName  : process.env.MYSQL_DBNAME,
      dbUser  : process.env.MYSQL_USERNAME,
      dbPwd   : process.env.MYSQL_PASSWORD,
      dbHost  : process.env.MYSQL_DB_HOST,
      dbPort  : process.env.MYSQL_DB_PORT,
    },
    'mysql-slave' : {
      dbName  : process.env.MYSQL_DBNAME,
      dbUser  : process.env.MYSQL_USERNAME,
      dbPwd   : process.env.MYSQL_PASSWORD,
      dbHost  : process.env.MYSQL_DB_HOST,
      dbPort  : process.env.MYSQL_DB_PORT,
    },
    'mysql-master-test' : {
      dbName  : process.env.MYSQL_DBNAME_TEST,
      dbUser  : process.env.MYSQL_USERNAME_TEST,
      dbPwd   : process.env.MYSQL_PASSWORD_TEST,
      dbHost  : process.env.MYSQL_DB_HOST_TEST,
      dbPort  : process.env.MYSQL_DB_PORT_TEST,
    },
    'mysql-slave-test' : {
      dbName  : process.env.MYSQL_DBNAME_TEST,
      dbUser  : process.env.MYSQL_USERNAME_TEST,
      dbPwd   : process.env.MYSQL_PASSWORD_TEST,
      dbHost  : process.env.MYSQL_DB_HOST_TEST,
      dbPort  : process.env.MYSQL_DB_PORT_TEST,
    },
  }
}
