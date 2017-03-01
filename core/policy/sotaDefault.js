/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _         = require('lodash')

module.exports = function (req, res, next) {
  // Merge params
  if (!req.allParams) {
    req.allParams = {}
  }

  if (!_.isEmpty(req.query)) {
    for (let k in req.query) {
      req.allParams[k] = req.query[k]
    }
  }

  if (!_.isEmpty(req.body)) {
    for (let k in req.body) {
      req.allParams[k] = req.body[k]
    }
  }

  if (!_.isEmpty(req.params)) {
    for (let k in req.params) {
      req.allParams[k] = req.params[k]
    }
  }

  next()
}
