/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var async = require('async');

module.exports = function () {
  var bodyParser = require('body-parser');
  var _json = bodyParser.json({ limit: '5mb' });
  var _urlencoded = bodyParser.urlencoded({ limit: '5mb', extended: true });

  return function (req, res, callback) {
    async.auto({
      json: function (next) {
        _json(req, res, next);
      },

      urlencoded: function (next) {
        _urlencoded(req, res, next);
      }
    }, function (err) {
      callback(err);
    });
  };
};
