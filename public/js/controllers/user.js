tvSeriesTrackerApp.controller('UserCtrl', ['$scope', '$state', 'Auth', 'toastr', '$rootScope',
  function ($scope, $state, Auth, toastr, $rootScope) {

    $scope.login = function () {
        Auth.login({email:$scope.email, password:$scope.password}).success(function (data) {
            toastr.success('Welcome back ' + $rootScope.currentUser.name, 'Logged in!');
            $state.go('followed');
        })
        .error(function (data, status) {
            toastr.clear();
            toastr.error(data.message, 'Login Error');
        });
    };

    $scope.signup = function () {
        Auth.signUp({name:$scope.name, email:$scope.email, password:$scope.password}).then(function (data) {
            toastr.success('Congratulations ' + $scope.name +'! Your account has been created.');
            $state.go('login');
        }, function (data, status) {
            toastr.clear();
            toastr.error(data.message, 'Signup Error');
        });
    };
}]);