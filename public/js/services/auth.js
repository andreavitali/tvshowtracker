// Proxy for auth requests
tvSeriesTrackerApp
    .factory('Auth', ['$http', '$q', '$window', '$rootScope', function ($http, $q, $window, $rootScope) {

        var factory = {};

        var token = $window.localStorage.token;
        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            $rootScope.currentUser = payload.user;
        }

        factory.login = function (user) {
            return $http.post('/api/auth/login', user)
              .success(function(data) {
                $window.localStorage.token = data.token;
                var payload = JSON.parse($window.atob(data.token.split('.')[1]));
                $rootScope.currentUser = payload.user;
              })
              .error(function() {
                delete $window.localStorage.token;
              });
        };

        factory.logout = function () {
            $rootScope.currentUser = null;
            delete $window.localStorage.token;
        };

        factory.signUp = function (user) {
             return $http.post('/api/auth/signup', user);
        };

        return factory;
    }]);

// Token based AuthInterceptor
tvSeriesTrackerApp
    .factory('authInterceptor', ['$window', '$q', '$injector', function ($window, $q, $injector, $state) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                var token = $window.localStorage.token;
                if (token != null) {
                    config.headers.Authorization = 'Bearer ' + token;
                }
                return config;
            },

            responseError: function (response) {
                if (response.status === 401 || response.status === 403) {
                    $injector.get('Auth').logout();
                    $injector.get('$state').go("login");
                }
                return $q.reject(response);
            }
        };
    }]);

