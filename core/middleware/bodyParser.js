module.exports = function() {
  var bodyParser = require('body-parser'),
      _json = bodyParser.json(),
      _urlencoded = bodyParser.urlencoded({extended: true});

  return function(req, res, callback) {
    async.auto({
      json: function(next) {
        _json(req, res, next);
      },
      urlencoded: function(next) {
        _urlencoded(req, res, next);
      },
    }, function(err) {
      callback(err);
    });
  }
};
