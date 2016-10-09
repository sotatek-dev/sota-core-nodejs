// TODO: choose the best method for mixins
var Mixins = {
  classname : 'Mixins',

  classic : function(clazz, interfaces) {
    if (interfaces instanceof Array) {
      interfaces.forEach(function(interface) {
        for (var p in interface) {
          if (interface.hasOwnProperty(p) &&
              !clazz.prototype.hasOwnProperty(p)) {
            clazz.prototype[p] = interface[p];
          }
        }
      });
    }
    return clazz;
  },

  injectObject : function(from, to) {
    for (var p in from) {
      if (!to.hasOwnProperty(p)) {
        to[p] = from[p];
      }
    }
  },

};

module.exports = Mixins;
