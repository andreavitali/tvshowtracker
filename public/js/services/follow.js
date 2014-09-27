tvSeriesTrackerApp.factory('Follow', ['_', '$http', '$rootScope', function (_, $http, $rootScope) {
    var factory = {};
    
    //var followedShows = [];
    var followedShowsId = null;
    
    // Get followed shows
    factory.getFollowedShows = function() {
        return $rootScope.currentUser ? $http.get("/api/followed") : {};
    };
    factory.getFollowedShowsId = function() {
        if (followedShowsId === null) {
            factory.getFollowedShows().success(function(shows) {
                followedShowsId = _.map(shows, function(fs) { return fs.show._id; });
                return followedShowsId;
            });
        }
        return followedShowsId;
    };
    
    // cache values
    factory.getFollowedShowsId();
    
    // Follow show
    factory.followShow = function(id) {
        $http.post("/api/followed/" + id).success(function(show) {
            followedShowsId.push(id);
            return show;
        });
    };
    
    // Unfollow show
    factory.unfollowShow = function(id) {
        return $http.delete("/api/followed/" + id).success(function(show) {
            followedShowsId = _.without(followedShowsId, id);
        });
    };
    
    // Set progression
    factory.setLastWatchedEpisode = function(id, lastWatchedSeason, lastWatchedEpisode) {
        return $http.put("/api/followed/" + id + "/" + lastWatchedSeason + "/" + lastWatchedEpisode);
    };
    
    return factory;
}]);