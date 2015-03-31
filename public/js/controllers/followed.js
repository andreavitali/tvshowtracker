tvSeriesTrackerApp.controller('FollowedCtrl', ['$scope', '$state', 'Shows', 'Follow', '_', 'moment', 'genres', 'followedShows', '$animate','$window',
function ($scope, $state, Shows, Follow, _, moment, genres, followedShows, $animate,$window) {

    // Init data
    $scope.genres = genres;
    $scope.followed = followedShows.data;
    $scope.settingProgression = false;
    $scope.hideCompleted = true;
    $scope.showEnded = true;
    $scope.showReturning = true;
    
    // Update badges
    var mainCount = _.countBy($scope.followed, function(fs){
        if(fs.status === 0 && (fs.season === 1 ? fs.episode > 1 : true)) return 'started';
        else if(fs.status === 1) return 'upcoming';
        else return '';
    });
    $scope.startedBadge = mainCount.started;
    $scope.upcomingBadge = mainCount.upcoming;
    

    // Public functions
    $scope.getPosterSrc = function (posterPath) {
        return Shows.getPosterUrl(posterPath);
    };
    
    $scope.goToDetails = function(fs) {
        $window.localStorage.currentShow = JSON.stringify(fs);
        $state.go('details', {id:fs.show._id});
    }

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
    $scope.followedFilter = function (fs) {
        if($scope.hideCompleted && fs.show.status === "Ended" && fs.status === 2)
            return false;
            
        // Main filter
        var visibility = true;
        if(!$scope.showEnded && !$scope.showReturning)
            visibility = false;
        else if(!($scope.showEnded && $scope.showReturning) && ($scope.showEnded || $scope.showReturning))
            visibility = $scope.showEnded ? fs.show.status === "Ended" : fs.show.status === "Returning Series";
            
        if(visibility)
        {
            if($scope.filterName && $scope.filterName.length > 1 && $scope.filterGenre)
                visibility = fs.show.name.toUpperCase().indexOf($scope.filterName.toUpperCase()) > -1 && _.contains(fs.show.genres, $scope.filterGenre);
            else if ($scope.filterName && $scope.filterName.length > 1)
                visibility = fs.show.name.toUpperCase().indexOf($scope.filterName.toUpperCase()) > -1;
            else if ($scope.filterGenre)
                visibility = _.contains(fs.show.genres, $scope.filterGenre);
        }
        
        return visibility;
    };
    
    $scope.changeMainFilter = function(filterValue) {
        $scope.mainFilter = filterValue;
        $animate.enabled(false);
        $scope.filterFollowed = _.filter($scope.followed, function(fs) {
            if($scope.mainFilter === "Started")
                return fs.status === 0 && (fs.season === 1 ? fs.episode > 1 : true);
            else if($scope.mainFilter === "Upcoming")
                return fs.status === 1;
            else
                return true;
        });
        $animate.enabled(true);
    };
    
    // Aplly first main filter
    $scope.changeMainFilter("Started");
}]);