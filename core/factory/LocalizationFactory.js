var util = require('util')
var _ = require('lodash')

var _data = {}

module.exports = {
  setText: function (key, locale, value) {
    if (!_data[key]) {
      _data[key] = {}
    }

    _data[key][locale] = value
  },

  getText: function (key, locale, params) {
    if (_.isArray(locale)) {
      params = locale
      locale = 'default'
    }

    if (_.isEmpty(params)) {
      params = []
    }

    if (!_data[key]) {
      return key
    }

    var template = _data[key][locale] || _data[key]['default']
    if (!template) {
      return key
    }

    return util.format.apply(util, [template].concat(params))
  }
}
