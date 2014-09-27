tvSeriesTrackerApp.controller('ExploreCtrl', ['$scope', '$rootScope', '$stateParams', 'Shows', 'Follow', '_', 'toastr', 'genres',
function ($scope, $rootScope, $stateParams, Shows, Follow, _, toastr, genres)
{
    $scope.genres = genres;

    // Paging
    var currentPage = 1;
    $scope.nextPage = function () {
        currentPage++;
        if ($stateParams.name)
            Shows.searchByName($scope.searchParameter, currentPage).success(function (data) { $scope.shows = _.union($scope.shows, data.results) });
        else if ($stateParams.genre)
            Shows.searchByGenre($stateParams.genre, currentPage).success(function (data) { $scope.shows = _.union($scope.shows, data.results) });
        else
            currentPage--;
    };

    // Load show data
    if ($stateParams.name && $stateParams.name.length > 0) {
        $scope.title = "Search results for: ";
        $scope.searchParameter = $stateParams.name;
        $scope.customSort = '-popularity';
        Shows.searchByName($scope.searchParameter).success(function (data) { $scope.shows = data.results; });
    }
    else if ($stateParams.genre) {
        $scope.title = "Search for genre: ";
        Shows.getGenres().then(function (result) {
            result.forEach(function (genre) {
                if (genre.id == $stateParams.genre)
                    $scope.searchParameter = genre.name;
            })
        });
        $scope.customSort = null;
        Shows.searchByGenre($stateParams.genre).success(function (data) { $scope.shows = data.results; });
    }
    else {
        $scope.title = "Top 20 TV Shows";
        $scope.searchParameter = "";
        $scope.customSort = null;
        Shows.getPopular().success(function (data) { $scope.shows = data.results; });
    }    

    // Public functions
    $scope.getPosterSrc = function(posterPath) {
        return Shows.getPosterUrl(posterPath);
    };

    $scope.followShow = function (show) {
        if ($rootScope.currentUser) {
            Follow.followShow(show.id);
            toastr.success("You are now following " + show.name);
        }            
        else
            $scope.logRequiredAlert = true;
    };

    $scope.isShowFollowed = function(id) {
        return _.contains(Follow.getFollowedShowsId(), id);
    };

    $scope.hideFollowedFilter = function (show) {
        if ($scope.hideFollowedShows)
            return !$scope.isShowFollowed(show.id);
        else
            return true;
    };
}]);