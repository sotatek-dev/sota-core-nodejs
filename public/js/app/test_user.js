var app = angular.module("test_user", []);

app.controller("home", function($scope, $timeout) {
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

    self.onUpdateDataSuccess = function(res) {
        if (res.code == 0) {
            console.log(res.data.users);
            self.users = res.data.users;
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
        return "[" + user.id + "] <" + user.firstName + " " + user.lastName +
                "> (" + user.userName + ") - updatedAt: " + user.updatedAt;
    };

    $timeout(self.requestList, 1);

    self.onDelete = function(userId) {
        $.ajax({
            url         : "/user/delete",
            type        : "post",
            dataType    : "json",
            data        : {user_id: userId},
            success     : self.onRequestSuccessThenRefreshList,
            error       : self.onRequestError,
        });
    };

    self.onUpdate = function(userId) {
        var users = self.users;
        var user = _.find(users, function(u) {
            return u.id == userId
        });

        var data = {
            user_id     : userId,
            first_name  : user.firstName
        };

        $.ajax({
            url         : "/user/update_one",
            type        : "post",
            dataType    : "json",
            data        : data,
            success     : self.onRequestSuccessThenRefreshList,
            error       : self.onRequestError,
        });
    };

    self.onInsert = function() {
        $.ajax({
            url         : "/user/add_random",
            type        : "post",
            dataType    : "json",
            data        : {},
            success     : self.onRequestSuccessThenRefreshList,
            error       : self.onRequestError,
        });
    };
});