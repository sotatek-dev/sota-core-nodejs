# Sota Framework for NodeJS server

## Install

### Setup environment

#### Install node & global modules
```
  $ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
  $ nvm install v6.9.1

  $ npm install -g knex
  $ npm install -g gulp
  $ npm install -g nodemon
  $ npm install -g pm2
```

#### Install & run redis
```
  $ brew install redis
  $ redis-server
```

#### Checkout source code and install dependencies:
```
  $ git checkout git@github.com:sotatek-dev/sota-core-nodejs.git
  $ cd sota-core-nodejs
  $ git pull
  $ git submodule update --init --recursive
  $ npm install
  $ cd core && npm install
```

#### Create local config
- Firstly is `.env` with content like this:
```
PORT=8001
NODE_ENV=development
SECRET=123456

FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx

APP_ENDPOINT=http://localhost:8001

REDIS_SERVER_ADDRESS=127.0.0.1
REDIS_SERVER_PORT=6379

REDIS_SOCKET_HUB_ADDRESS=127.0.0.1
REDIS_SOCKET_HUB_PORT=6379
```

- Secondly is `config/Local.js` with content like this:
```
module.exports = {
  adapters: {
    'mysql-master' : {
      dbName  : 'DB_NAME_HERE',
      dbUser  : 'DB_USERNAME',
      dbPwd   : 'DB_PASSWORD',
      dbHost  : 'DB_HOST',
    },
    'mysql-slave' : {
      dbName  : 'DB_NAME_HERE',
      dbUser  : 'DB_USERNAME',
      dbPwd   : 'DB_PASSWORD',
      dbHost  : 'DB_HOST',
    },
    'mysql-master-test' : {
      dbName  : 'TEST_DB_NAME_HERE',
      dbUser  : 'DB_USERNAME',
      dbPwd   : 'DB_PASSWORD',
      dbHost  : 'DB_HOST',
    },
    'mysql-slave-test' : {
      dbName  : 'TEST_DB_NAME_HERE',
      dbUser  : 'DB_USERNAME',
      dbPwd   : 'DB_PASSWORD',
      dbHost  : 'DB_HOST',
    },
  }
};

```

## Run demo project
```
  $ make init-db
  $ npm start
```

## Verify unit tests
```
  $ npm test
```

