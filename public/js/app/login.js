var app = angular.module("login", [], function($httpProvider) {
    // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

  /**
   * The workhorse; converts an object to x-www-form-urlencoded serialization.
   * @param {Object} obj
   * @return {String}
   */
  var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

    for(name in obj) {
      value = obj[name];

      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }

    return query.length ? query.substr(0, query.length - 1) : query;
  };

  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
});

app.controller("home", function($scope, $window, $http) {
    var self = this;
    self.users = [];

    self.requestList = function() {
        $.ajax({
            url         : "/user/list",
            type        : "post",
            dataType    : "json",
            data        : {},
            success     : self.onUpdateDataSuccess.bind(self),
            error       : self.onRequestError.bind(self),
        });
    };

    self.doLogin = function() {
        var data = {
            username : self.username,
            password : self.password,
        };

        $http
            .post('/auth', data)
            .success(function(res, status, headers, config) {
                console.log('onAuthorized: token=' + res.auth_token);
                $window.sessionStorage.auth_token = res.auth_token;
            })
            .error(function(data, status, headers, config) {
                delete $window.sessionStorage.token;
            });
    };

    self.onUpdateDataSuccess = function(res) {
        if (res.code == 0) {
            console.log(res.users);
            self.users = res.users;
            $scope.$apply();
        }
    };

    self.onRequestSuccessThenRefreshList = function(res) {
        self.requestList();
    };

    self.onRequestError = function(res) {
        console.log("RequestError: ");
        console.log(res);
    };

    self.getDetails = function(user) {
        return "[" + user.userId + "] <" + user.firstName + " " + user.lastName +
                "> (" + user.userName + ") - updatedAt: " + user.updatedAt;
    };
});