const _         = require('lodash');
const Geometry  = require('./Geometry');

class Point extends Geometry {

  constructor (x, y) {
    super();

    if (!!x && typeof x === 'object') {
      if (!_.isNil(y)) {
        throw new Error(`Invalid point parameter: (${x}, ${y}).`);
      }

      y = x.y;
      x = x.x;
    }

    if (!_.isNumber(x) || !_.isNumber(y)) {
      throw new Error(`Invalid point parameter: (${x}, ${y}).`);
    }

    this.x = parseFloat(x);
    this.y = parseFloat(y);
  }

}

module.exports = Point;
