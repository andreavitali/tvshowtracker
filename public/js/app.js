// Main module
var tvSeriesTrackerApp = angular.module('TvSeriesTracker', ['ui.router', 'ngAnimate', 'toastr', 'ngProgressLite', 'filters', 'directives', 'LocalStorageModule', 'infinite-scroll']);

// Global options
var options = {};
options.auth_token_name = "tvSeriesTrackerToken";

// External js libraries
tvSeriesTrackerApp
    .constant("_", window._)
    .constant("moment", moment);

// Startup
tvSeriesTrackerApp.run(['$rootScope', '$state', 'Shows', 'ngProgressLite', function ($rootScope, $state, Shows, ngProgressLite) {
    Shows.loadConfigData;
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if (toState !== null && toState.authRequired && !$rootScope.currentUser) {
            event.preventDefault();
            $state.go("login");
        }
        else {
            ngProgressLite.start();
        }
    });
    $rootScope.$on('$stateChangeSuccess', function () {
        ngProgressLite.done();
    });
    $rootScope.$on('$stateChangeError', function () {
        ngProgressLite.done();
    });
}]);

// Routing and Authentication
tvSeriesTrackerApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$locationProvider',
    function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {

    $httpProvider.interceptors.push('authInterceptor');
    $locationProvider.html5Mode(true);
    $urlRouterProvider.when('/', '/explore');
    $urlRouterProvider.otherwise('/explore');

    $stateProvider
        .state('explore', {
            url: '/explore?genre&name',
            templateUrl: 'views/explore.html',
            controller: 'ExploreCtrl',
            resolve: {
                genres: ['Shows', function(Shows) {
                    return Shows.getGenres();
                }]
            }
        })
        .state('followed', {
            url: '/followed',
            templateUrl: 'views/followed.html',
            controller: 'FollowedCtrl',            
            authRequired: true,
            resolve: {
                genres: ['Shows', function (Shows) {
                    return Shows.getGenres();
                }],
                followedShows: ['Follow', function (Follow) {
                    return Follow.getFollowedShows();
                }]
            }
        })
        .state('login', {
            url: '/login',
            templateUrl: 'views/login.html',
            controller: 'UserCtrl',
        })
        .state('signup', {
            url: '/signup',
            templateUrl: 'views/signup.html',
            controller: 'UserCtrl'
        })
        .state('details', {
            url: '/show/{id:[0-9]+}',
            templateUrl: 'views/details.html',
            controller: 'DetailsCtrl'
        })
        .state('details.season', {
            url: '/season/{season_number:[0-9]{2}}',
            templateUrl: 'views/details-season.html',
            controller: 'DetailsSeasonCtrl',
        })
}]);

// Configurations
tvSeriesTrackerApp.config(function(toastrConfig) {    
    toastrConfig.extendedTimeOut = 0;    
    toastrConfig.iconClasses.error = 'alert-danger';
    toastrConfig.iconClasses.info = 'alert-info';
    toastrConfig.iconClasses.success = 'alert-success';
    toastrConfig.iconClasses.warning = 'alert-warning';
    toastrConfig.timeOut = 2000;
    toastrConfig.toastClass = 'alert';
    //allowHtml: true,
    //closeButton: false,
    //closeHtml: '<button>&times;</button>',
    //containerId: 'toast-container',
    //extendedTimeOut: 1000,
    //iconClasses: {
    //    error: 'toast-error',
    //    info: 'toast-info',
    //    success: 'toast-success',
    //    warning: 'toast-warning'
    //},
    //titleClass: 'toast-title',
    //messageClass: 'toast-message',
    //positionClass: 'toast-top-right',
    //toastrConfig.tapToDismiss = true; 
    //toastClass: 'toast'
});

