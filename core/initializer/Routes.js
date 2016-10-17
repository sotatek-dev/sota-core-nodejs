var Filter = require('../controller/Filter');

module.exports = function(app, config) {
  var route,
      handlerDef,
      finalHandler,
      acl; // TODO: add ACL

  // Routes from config
  var routes = config.routes,
      requestMethod,
      routesHash,
      hasCustomizedRegister = false,
      hasCustomizedLogin = false,
      hasCustomizedLogout = false;

  for (requestMethod in routes) {
    routesHash = routes[requestMethod];
    for (route in routesHash) {
      handlerDef = routesHash[route];
      finalHandler = ControllerFactory.createRequestHandler(handlerDef);
      app[requestMethod.toLowerCase()](route, finalHandler);

      if (requestMethod.toLowerCase() === 'post') {
        if (route === '/register') {
          hasCustomizedRegister = true;
        }

        if (route === '/login') {
          hasCustomizedLogin = true;
        }

        if (route === '/logout') {
          hasCustomizedLogin = true;
        }
      }
    }
  }

  // Auto-generated routes from models
  var models = ModelFactory.getAll();
  for (var i in models) {
    var classname = models[i];
    var model = ModelFactory.get(classname);
    var apiName = model.getPluralTableName();

    // Find/select list
    route = '/' + apiName;
    handlerDef = BaseController.createDefaultFind(model, acl);
    finalHandler = ControllerFactory.createRequestHandler(handlerDef);
    app.get(route, finalHandler);

    // Find/select one
    route = '/' + apiName + '/:id';
    handlerDef = BaseController.createDefaultFindOne(model, acl);
    finalHandler = ControllerFactory.createRequestHandler(handlerDef);
    app.get(route, finalHandler);

    // Insert/add
    route = '/' + apiName;
    handlerDef = BaseController.createDefaultAdd(model, acl);
    finalHandler = ControllerFactory.createRequestHandler(handlerDef);
    app.post(route, finalHandler);

    // Update
    route = '/' + apiName + '/:id';
    handlerDef = BaseController.createDefaultUpdate(model, acl);
    finalHandler = ControllerFactory.createRequestHandler(handlerDef);
    app.put(route, finalHandler);

    // Remove/Delete
    route = '/' + apiName + '/:id';
    handlerDef = BaseController.createDefaultDelete(model, acl);
    finalHandler = ControllerFactory.createRequestHandler(handlerDef);
    app.delete(route, finalHandler);
  }

  // If there's no user-defined register function, use built-int default register
  if (!hasCustomizedRegister) {
    app.post('/register', ControllerFactory.createRequestHandler(Filter.defaultRegister()));
  }

  // If there's no user-defined login function, use built-int default login
  if (!hasCustomizedLogin) {
    app.post('/login', ControllerFactory.createRequestHandler(Filter.defaultLogin()));
  }

  // If there's no user-defined logout function, use built-int default login
  if (!hasCustomizedLogout) {
    app.post('/logout', ControllerFactory.createRequestHandler(Filter.defaultLogout()));
  }

};
