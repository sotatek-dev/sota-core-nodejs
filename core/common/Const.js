module.exports = {
  DATA_SOURCE_TYPE: {
    MEMORY: 'memory',
    SQLITE: 'sqlite',
    MYSQL: 'mysql',
    POSTGRESQL: 'postgresql',
    MONGODB: 'mongodb',
    ORACLE: 'oracle',
    DISK: 'disk'
  },

  CONNECTION_TYPE: {
    MASTER: 'master',
    SLAVE: 'slave'
  },

  COLUMN_DATA_TYPE: {
    NUMBER: 'number',
    STRING: 'string',
    TIMESTAMP: 'timestamp',
    BINARY: 'binary'
  },

  ERROR_TYPE: {
    UNKOWN: {
      STATUS: 500,
      CODE: -1,
      MSG: 'Unkown error'
    }
  },

  BOOLEAN: {
    TRUE: 1,
    FALSE: 0
  },

  PAGINATION: {
    DIRECTION: {
      BEFORE: 'before',
      AFTER: 'after'
    },
    ORDER: {
      ASC: 'asc',
      DESC: 'desc',
    }
  },

  SOCKET_HUB_EVENT_TYPE: {

  },

  SOCKET_BROADCAST_CHANNEL: 'server:all',

  MAX_QUERY_RECORDS: 1000,
  DEFAULT_PAGINATION_SIZE: 10,            // Records
  DEFAULT_CACHE_TTL: 300 * 1000,          // Milliseconds
  DEFAULT_REQUEST_TIMEOUT: 60 * 1000,     // Milliseconds

  PENDING_QUERY_TIMEOUT: 20,              // Milliseconds

  MINUTE_IN_MILLISECONDS: 1000 * 60,
  HOUR_IN_MILLISECONDS: 1000 * 60 * 60,
  DAY_IN_MILLISECONDS: 1000 * 60 * 60 * 24,
  MONTH_IN_MILLISECONDS: 1000 * 60 * 60 * 24 * 30,
  YEAR_IN_MILLISECONDS: 1000 * 60 * 60 * 24 * 365

};
