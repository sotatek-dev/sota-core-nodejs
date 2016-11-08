var Interface = {};

Interface.extends = function(properties) {
  for (let i in properties) {
    let property = properties[i],
        value = interface[property];

    if (typeof value !== 'function' || property[0] === '$') {
      if (property[0] === '$') {
        property = property.slice(1);
      }

      this[property] = value;
      this.prototype[property] = value;
      continue;
    }

    this.prototype[property] = value;
  }
};

module.exports = Interface;
