// Parse a function body and extract the parameter names.
function argumentNames(body) {
  var names = body.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
    .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
    .replace(/\s+/g, '').split(',');
  return names.length === 1 && !names[0] ? [] : names;
}

// Create a function that calls overrideBody with a closure to ancestorBody.
function overrideMethod(overrideBody, ancestorBody) {
  var override = function(){};

  if (ancestorBody !== undefined) {
    // Create a function that calls overrideBody with a closure
    // to ancestorBody as the first param.
    override = function() {
      var localThis = this;
      var $super = function() {
        return ancestorBody.apply(localThis, arguments);
      };
      Array.prototype.unshift.call(arguments, $super);
      return overrideBody.apply(this, arguments);
    };
  } else {
    // Create a function that calls overrideBody with undefined
    // as the first param, because ancestorBody is undefined.
    override = function() {
      Array.prototype.unshift.call(arguments, undefined);
      return overrideBody.apply(this, arguments);
    };
  }

  // Hide our dirty tricks from the rest of the world.
  override.valueOf = function() {
    return overrideBody.valueOf();
  };

  override.toString = function() {
    return overrideBody.toString();
  };

  return override;
}

function emptyFunction() {
  // Nothing
}

var Class = function() {};
/*
 * Create a subclass
 * @param {object} properties: the extended properties of derived class
 *                             property begins with '$' is static one
 * @param {array} mixins: the interfaces that dervied class implemented
 */
Class.extends = (function() {

  /*
   * Of course javascript class is a function
   */
  return function() {

    if (arguments.length !== 1) {
      throw new Error('Invalid class arguments');
    }

    /*
     * First arguments of extends method is an object contains properties
     * that will be injected in to the derived class
     */
    var properties = arguments[0];

    /*
     * Check whether classname is defined
     * If not the classname will be Anonymous
     */
    var classname = properties.classname || 'Anonymous';

    /*
     * Constructor for new class to be created.
     * They said eval is evil, but we need it here..
     */
    var NewClass = eval('(function ' + classname + '(){this.initialize.apply(this, arguments)})');

    /*
     * Prepare to traversal through all properties
     * that will be appended to the result class
     */
    // var property;

    /*
     * Copy static properties from superclass
     */
    for (let property in this) {
      if (!this.hasOwnProperty(property)) {
        continue;
      }
      NewClass[property] = this[property];
    }

    /*
     * Next is prototype
     */
    var ancestorPrototype = this.prototype;
    var TempClass = function() {};
    TempClass.prototype = ancestorPrototype;

    NewClass.prototype = new TempClass();
    NewClass.prototype.superclass = ancestorPrototype;
    NewClass.prototype.constructor = NewClass;

    /*
     * Here comes derived properties that were passed into extends method
     */
    for (let property in properties) {
      if (!properties.hasOwnProperty(property)) {
        continue;
      }

      // getters / setters behave differently than normal properties.
      var getter = properties.__lookupGetter__(property);
      var setter = properties.__lookupSetter__(property);
      let value;

      if (getter || setter) {
        // And we don't support them for now ;(
        throw new Error('Class::extends still does not support setter and getter yet...');
      }

      value = properties[property];

      /*
       * If the property is not function, or it's static
       * Just bring the original it to the derived class
       */
      if (typeof value !== 'function' || property[0] === '$') {
        if (property[0] === '$') {
          property = property.slice(1);
        }

        NewClass[property] = value;
        NewClass.prototype[property] = value;

        // And that's all
        continue;
      }

      /*
       * Here comes the non-static methods
       */
      if (argumentNames(value)[0] === '$super') {
        // Create override method if the first param is $super.
        value = overrideMethod(value, ancestorPrototype[property]);
      } else if (property === 'initialize') {
        // If property is `initialize`, and the first parameter is not `$super`
        // The ancestor method will be called automatically
        var ancestorInitialize = ancestorPrototype.initialize;
        if (ancestorInitialize) {
          var derivedInitialize = value;
          /*jshint loopfunc: true */
          value = function() {
            ancestorInitialize.apply(this, arguments);
            derivedInitialize.apply(this, arguments);
          };
        }
      } else if (property === 'destroy') {
        // Same for `destroy` method
        var ancestorDestroy = ancestorPrototype.destroy;
        if (ancestorDestroy) {
          var derivedDestroy = value;
          value = function() {
            derivedDestroy.apply(this, arguments);
            ancestorDestroy.apply(this, arguments);
          };
        }
      }

      // Copy method into new class prototype.
      NewClass.prototype[property] = value;
    }

    // Make sure there is an initialize function.
    if (!NewClass.prototype.initialize) {
      NewClass.prototype.initialize = emptyFunction;
    }

    // And destroy as well
    if (!NewClass.prototype.destroy) {
      NewClass.prototype.destroy = emptyFunction;
    }

    return NewClass;
  };

})();

Class.singleton = function(){
  // Create sublcass as normal.
  var TempClass = this.extends.apply(this, arguments);

  // Hide the initialize.
  var initialize = TempClass.prototype.initialize;
  TempClass.prototype.initialize = function() {};

  // Now instantiate.
  var instance = new TempClass();

  // Hide every prototype function with an instance function
  // that calls initialize.
  var functions = [];
  /**
   * Ensure that the singleton has been created and fully initialized.
   */
  var instantiate = function(real) {
    // Delete all of the instance functions we added.
    for (var i in functions) {
      var func = functions[i];
      delete instance[func];
    }

    // Restore the initialize function and call it.
    instance.initialize = initialize;
    instance.initialize();

    // Replace instantiate method with an empty function.
    instance.instantiate = function() {};

    // Call the function that caused this instantiation.
    var args = Array.prototype.slice.call(arguments, 1);
    return real.apply(instance, args);
  };

  // Iterate over all prototype functions.
  for (var i in instance) {
    // Don't do anything for setters or getters.
    if (instance.__lookupGetter__(i) || instance.__lookupSetter__(i)) {
      //TODO Should put proxies here too.
      continue;
    }

    var value = instance[i];
    if (typeof value === 'function') {
      // Remember the function names that we added
      // so that instantiate() can remove them.
      functions.push(i);

      // Add an instance function to hide the prototype function,
      // which will call instantiate.
      instance[i] = instantiate.bind(this, value);
    }
  }

  // Add instantiate method.
  instance.instantiate = instantiate.bind(this, function() {});

  // Return the isntance.
  return instance;
};

Class.implements = function(interfaces) {
  if (!interfaces || !interfaces.length) {
    throw new Error('Invalid interfaces to implement');
  }

  for (let i = 0; i < interfaces.length; i++) {
    var interface = interfaces[i];
    for (let property in interface) {
      if (this.prototype[property]) {
        continue;
      }

      if (!interface.hasOwnProperty(property)) {
        continue;
      }

      let value = interface[property];

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
  }

  return this;
};

module.exports = Class;
