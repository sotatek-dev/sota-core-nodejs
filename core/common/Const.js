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

  MAX_QUERY_RECORDS: 1000,
  DEFAULT_PAGINATION_SIZE: 10,
  DAY_IN_MILLISECONDS : 24 * 60 * 60 * 1000,

};
