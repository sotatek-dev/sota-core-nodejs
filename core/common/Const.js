module.exports = {
  DATA_SOURCE_TYPE : {
    MEMORY      : 'memory',
    SQLITE      : 'sqlite',
    MYSQL       : 'mysql',
    POSTGRESQL  : 'postgresql',
    MONGODB     : 'mongodb',
    ORACLE      : 'oracle',
    DISK        : 'disk',
  },
  CONNECTION_TYPE : {
    MASTER      : 'master',
    SLAVE       : 'slave',
  },
  COLUMN_DATA_TYPE : {
    NUMBER      : 'number',
    STRING      : 'string',
    TIMESTAMP   : 'timestamp',
    BINARY      : 'binary'
  },
  ERROR_TYPE    : {
    UNKOWN    : {
      STATUS  : 500,
      CODE    : -1,
      MSG     : 'Unkown error'
    }
  },
};
