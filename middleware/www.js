module.exports = function (app, config) {
  var express = require('express');
  return express.static(config.publicDir);
};
