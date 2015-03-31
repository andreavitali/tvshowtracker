tvSeriesTrackerApp.controller('DetailsCtrl', ['$scope', '$state', 'Shows', 'Follow', 'toastr', '_', 'show', 'followedShow',
function ($scope, $state, Shows, Follow, toastr, _, show, followedShow) {
    
    $scope.show = show.data;
    $scope.followedShow = followedShow.data;
    $state.go('details.season', { season_number: $scope.followedShow.season ? $scope.followedShow.season : 1 }, { location: false });

    // Public function
    $scope.getPosterSrc = function (posterPath) {
        return posterPath !== undefined ? Shows.getPosterUrl(posterPath) : "";
    };

    $scope.followShow = function () {        
        Follow.followShow($scope.show.id).then(function (fs) {
            $scope.followedShow = fs;
        });        
    };

    $scope.unfollowShow = function () {
        Follow.unfollowShow($scope.show.id);
        $scope.followedShow = undefined;
    };

    $scope.login = function () {
        $state.go('login');
    }
}]);

tvSeriesTrackerApp.controller('DetailsSeasonCtrl', ['$scope', '$stateParams', 'Shows', 'Follow',
function ($scope, $stateParams, Shows, Follow) {

    Shows.getSeasonDetails($stateParams.id, $stateParams.season_number).success(function (data) {
        $scope.season = data;
    });

    $scope.setProgression = function (season, episode) {
        Follow.setLastWatchedEpisode($stateParams.id, season, episode);
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