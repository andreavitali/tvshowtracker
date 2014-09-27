tvSeriesTrackerApp.controller('NavbarCtrl', ['$scope', '$state', 'Auth', function ($scope, $state, Auth) {

    $scope.logout = function () {
        //if (Auth.user) {
            Auth.logout();
            //$scope.user = null;
            $state.go('explore');
        //}
    };

    $scope.search = function () {
        $state.go('explore', { name: $scope.searchName }, {inherit:false});
    }
}]);