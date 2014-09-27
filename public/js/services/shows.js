tvSeriesTrackerApp.factory('Shows', ['$http', '$q', '_', function ($http, $q, _)
{
    var factory = {};
    var genres = null;
    var deferredGenres = $q.defer();
    var imageBaseUrl = null;
    
    // Get configuration data (only in start)
    factory.loadConfigData = $http.get("/api/shows/configuration")
        .success(function (configData) { 
            imageBaseUrl = configData.imageBaseUrl;
            genres = deferredGenres.resolve(configData.genres);
        });

    // Get genres
    factory.getGenres = function () {
        return deferredGenres.promise;
    };

    // Get poster url
    factory.getPosterUrl = function (posterPath) {
        if (imageBaseUrl === null)
            return null;
        if(posterPath === null || posterPath === undefined)
            return "images/notFound.png";
        return "" + imageBaseUrl + "w342" + posterPath;
    };

    // Get popular shows
    factory.getPopular = function () {
        return $http.post("/api/shows/search");
    };

    // Search by genre
    factory.searchByGenre = function (genre, page) {
        if (page < 2) return;
        return $http.post("/api/shows/search", {genre:genre, page:page});
    };

    // Search by name
    factory.searchByName = function (name, page) {
        return $http.post("/api/shows/search", {name:name, page:page});
    };

    // Get show details
    factory.getShow = function (show_id) {
        return $http.get("/api/shows/" + show_id);
    };
    factory.getSeasonDetails = function (show_id, season_number) {
        return $http.get("/api/shows/" + show_id + "/season/" + season_number);
    };

    // Get all episodes
    factory.getAllEpisodes = function (show_id, only_aired) {
        var deferred = $q.defer();
        factory.getShow(show_id).success(function (result) {
            var seasonPromises = [];
            var episodes = [];
            for (var s = 1; s <= result.number_of_seasons; s++)
                seasonPromises.push(factory.getSeasonDetails(show_id, s));
                
            $q.all(seasonPromises).then(function (result) {
                _.each(result, function (season_result) {
                    for (var e = 1; e <= season_result.data.episodes.length; e++) {
                        if (only_aired && new Date(season_result.data.episodes[e - 1].air_date) < Date.now())
                            episodes.push({season: season_result.data.season_number, episode: e });
                    }
                });
                deferred.resolve(episodes);
            });
        });
        return deferred.promise;
    };

    return factory;
}]);