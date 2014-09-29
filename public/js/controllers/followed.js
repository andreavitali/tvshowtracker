tvSeriesTrackerApp.controller('FollowedCtrl', ['$scope', '$state', 'Shows', 'Follow', '_', 'moment', 'genres', 'followedShows',
function ($scope, $state, Shows, Follow, _, moment, genres, followedShows) {

    // Init data
    $scope.genres = genres;
    $scope.followed = followedShows.data;
    $scope.settingProgression = false;
    $scope.hideCompleted = true;

    // Public functions
    $scope.getPosterSrc = function (posterPath) {
        return Shows.getPosterUrl(posterPath);
    };

    $scope.unfollowShow = function (fs) {
        Follow.unfollowShow(fs.show._id); // server-side
        var idx = $scope.followed.indexOf(fs);
        $scope.followed.splice(idx, 1); // client-side
        if ($scope.followed.length === 0)
            $state.go('explore');
    };
    
    $scope.getStripeClass = function(fs) {
        if(fs.status === 2) return 'label-warning';
        else if(fs.status === 0 && fs.airDate !== null) return 'label-success';
        else return 'hide';
    };

    // Set progression
    $scope.getAllEpisodeForProgression = function (fs) {
        if(!$scope.settingProgression) {
            $scope.settingProgression = true;
            fs.settingProgression = true;
            $scope.loadingEpisodes = true;
            Shows.getAllEpisodes(fs.show._id, true).then(function (result) {
                $scope.allEp = result;
                var next = _.find(result, function (e) { return e.season == fs.season && e.episode == fs.episode });
                $scope.progressionEp = next || $scope.allEp[$scope.allEp.length-1];
                $scope.loadingEpisodes = false;
            });
        }
    };

    $scope.setProgression = function (fs, lastWatchedEp, reset) {        
        $scope.settingProgression = false;
        if(reset)
            fs.settingProgression = false;
        else {
            fs.status = null;
            if (lastWatchedEp === null) lastWatchedEp = {season:0, episode:0};
            Follow.setLastWatchedEpisode(fs.show._id, lastWatchedEp.season, lastWatchedEp.episode)
                .success(function(result) {
                    fs.episode = result.episode;
                    fs.season = result.season;
                    fs.airDate = result.airDate;
                    fs.status = result.status;
                    fs.settingProgression = false;
                });
        };
    };

    // Filters
    $scope.filterName;
    $scope.filterGenre;
    $scope.filterStatus;

    $scope.followedFilter = function (fs) {
        if($scope.hideCompleted && fs.show.status === "Ended" && fs.status === 2)
            return false;
        
        if ($scope.filterName && $scope.filterName.length > 1 && $scope.filterGenre && $scope.filterStatus)
            return fs.show.name.toUpperCase().indexOf($scope.filterName.toUpperCase()) > -1
                && _.contains(fs.show.genres, $scope.filterGenre)
                && fs.show.status == $scope.filterStatus;
        else if ($scope.filterName && $scope.filterName.length > 1 && $scope.filterGenre)
            return fs.show.name.toUpperCase().indexOf($scope.filterName.toUpperCase()) > -1 && _.contains(fs.show.genres, $scope.filterGenre);
        else if ($scope.filterName && $scope.filterName.length > 1 && $scope.filterStatus)
            return fs.show.name.toUpperCase().indexOf($scope.filterName.toUpperCase()) > -1 && fs.show.status == $scope.filterStatus;
        else if ($scope.filterGenre && $scope.filterStatus)
            return fs.show.name.toUpperCase().indexOf($scope.filterName.toUpperCase()) > -1 && fs.show.status == $scope.filterStatus;
        else if ($scope.filterName && $scope.filterName.length > 1)
            return fs.show.name.toUpperCase().indexOf($scope.filterName.toUpperCase()) > -1;
        else if ($scope.filterGenre)
            return _.contains(fs.show.genres, $scope.filterGenre);
        else if ($scope.filterStatus)
            return fs.show.status == $scope.filterStatus;
        else
            return true;
    };

    $scope.resetFilters = function () {
        $scope.filterName = "";
        $scope.filterGenre = "";
        $scope.filterStatus = "";
    }
}]);