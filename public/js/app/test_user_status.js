var app = angular.module("test_user_status", []);

app.controller("home", function($scope, $timeout) {
    var self = this;
    self.userStatuses = [];

    self.requestList = function() {
        $.ajax({
            url         : "/user_status/list",
            type        : "post",
            dataType    : "json",
            data        : {},
            success     : self.onUpdateDataSuccess,
            error       : self.onRequestError,
        });
    };

    self.onUpdateDataSuccess = function(res) {
        if (res.code == 0) {
            self.userStatuses = res.userStatuses;
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

    self.statusDetail = function(userStatus) {
        return "[" + userStatus.userId + "] " +
                (userStatus.name ? userStatus.name : ("User " + userStatus.userId)) + " - " +
                userStatus.status;
    };

    $timeout(self.requestList, 1);

    self.onDelete = function(userId) {
        $.ajax({
            url         : "/user_status/delete",
            type        : "post",
            dataType    : "json",
            data        : {userId: userId},
            success     : self.onRequestSuccessThenRefreshList,
            error       : self.onRequestError,
        });
    };

    self.onInsert = function() {
        $.ajax({
            url         : "/user_status/insert",
            type        : "post",
            dataType    : "json",
            data        : {},
            success     : self.onRequestSuccessThenRefreshList,
            error       : self.onRequestError,
        });
    };
});