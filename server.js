var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var moment = require('moment');
var favicon = require('serve-favicon');
var cron = require('cron');
var nconf = require('nconf');

//-----------------------------------------
// Configuration
//-----------------------------------------

nconf.file({file : 'config/config.json'}); // persistent configuration data

// Routes
var routes = {};
routes.auth = require('./routes/auth.js');
routes.shows = require('./routes/shows.js');
routes.followed = require('./routes/followed.js');

// Express configuration
var app = express();
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1');
app.use(logger('dev', {skip: function (req, res) { return req.originalUrl.indexOf("/api/") === -1 }}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(express.static(path.resolve(__dirname, 'public')));

//-----------------------------------------
// API
//-----------------------------------------

app.post('/api/auth/login', routes.auth.login);
app.post('/api/auth/signup', routes.auth.signup);
app.post('/api/auth/changepassword', routes.auth.ensureAuthenticated, routes.auth.changePassword);

app.post('/api/shows/search', routes.shows.search); // search shows
app.get('/api/shows/configuration', routes.shows.configData); // base url for posters
app.get('/api/shows/:id(\\d+)', routes.shows.getById); // show details
app.get('/api/shows/:id(\\d+)/season/:number', routes.shows.getSeasonDetails); // season details

app.get('/api/followed', routes.auth.ensureAuthenticated, routes.followed.getFollowedShows); // get all followed shows (update once a day. cache on client?)
app.post('/api/followed/:id', routes.auth.ensureAuthenticated, routes.followed.followShow); // follow a new show
app.delete('/api/followed/:id', routes.auth.ensureAuthenticated, routes.followed.unfollowShow); // unfollow a show
app.put('/api/followed/:id/:season/:episode', routes.auth.ensureAuthenticated, routes.followed.setLastWatchedEpisode); // set last watched episode

//-----------------------------------------
// Views and errors
//-----------------------------------------

app.get('*', function(req, res) {
  res.redirect('/#'+req.originalUrl);
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, { message: err.message });
});

app.listen(app.get('port'), app.get('ip'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

//-----------------------------------------
// Periodic tasks
//-----------------------------------------

if(process.env.NODE_ENV === 'production') // every day at 00:05
{
  var dailyShowsUpdate = new cron.CronJob('00 05 00 * * *', routes.followed.dailyUpdate, null);
  dailyShowsUpdate.start();
}
else if(moment().isAfter(nconf.get('lastDailyUpdate') || 0, 'day'))
{
  routes.followed.dailyUpdate();
  nconf.set('lastDailyUpdate', moment());
  nconf.save();
}