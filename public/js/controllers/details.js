tvSeriesTrackerApp.controller('DetailsCtrl', ['$scope', '$state', '$stateParams', 'Shows', 'Follow', 'toastr', '_',
function ($scope, $state, $stateParams, Shows, Follow, toastr, _) {
    
    $scope.id = $stateParams.id;
    Shows.getShow($scope.id).success(function (data) {
        $scope.show = data;
        $state.go('details.season', { season_number: 1 }, { location: false });
    });

    $scope.followedShow = _.find(Follow.getFollowedShowsId(), function (id) { return id == $scope.id });

    // Public function
    $scope.getPosterSrc = function (posterPath) {
        return posterPath !== undefined ? Shows.getPosterUrl(posterPath) : "";
    };

    $scope.followShow = function () {        
        Follow.followShow($scope.id).then(function (fs) {
            $scope.followedShow = fs;
        });        
    };

    $scope.unfollowShow = function () {
        Follow.unfollowShow($scope.id);
        $scope.followedShow = undefined;
    };

    $scope.login = function () {
        $state.go('login');
    }
}]);

tvSeriesTrackerApp.controller('DetailsSeasonCtrl', ['$scope', '$stateParams', 'Shows', 'Follow',
function ($scope, $stateParams, Shows, Follow) {

    Shows.getSeasonDetails($scope.id, $stateParams.season_number).success(function (data) {
        $scope.season = data;
    });

    $scope.setProgression = function (season, episode) {
        Follow.setLastWatchedEpisode($scope.$parent.id, season, episode);
    };

    $scope.isEpisodeWatched = function (season, episode) {
        var fs = $scope.$parent.followedShow;
        return fs ? fs.season >= season && fs.episode > episode : false;
    }

    $scope.isNextToWatchEpisode = function (season, episode) {
        var fs = $scope.$parent.followedShow;
        return fs ? fs.season == season && fs.episode == episode : false;
    }
}]);