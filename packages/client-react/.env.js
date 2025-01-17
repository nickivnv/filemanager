'use strict';

module.exports = {
  HOST: process.env.HOST ? process.env.HOST : 'localhost',
  PORT: process.env.PORT ? process.env.PORT : 3000,
  FILE_SERVER_URL: process.env.FILE_SERVER_URL ? process.env.FILE_SERVER_URL : 'http://localhost:3020',// 'http://localhost:8080/myfilemanager',

  CLIENT_ID: process.env.CLIENT_ID,
  API_KEY: process.env.API_KEY
};
