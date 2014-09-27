var _ = require("underscore");
var moment = require('moment');
var db = require('../config/mongo_database.js');
var shows = require('./shows');

var updateFollowedShow = function(user_id, nextEpToWatch, isNew, cb)
{
    var query;
    if(isNew) {
        query = db.Users.update({_id : user_id}, {$addToSet : { followed : nextEpToWatch}});
    }
    else {
        query = db.Users.findOneAndUpdate({_id :user_id, "followed.show" : nextEpToWatch.show}, {$set : { "followed.$":nextEpToWatch}});
    }
    query.exec(function(e, r){
       if(e) return cb(e);
       return cb();
    });
};

exports.getFollowedShows = function(req, res, next) {
    db.Users.findById(req.user.id).exec(function(e, user){
        if(e) return next(e);
        db.Users.populate(user, 'followed.show', function(e,user){
            if(e) return next(e);
            return res.json(user.followed);
        });
    });
};

exports.followShow = function(req, res, next) {
    var showId = req.params.id || '';
    if(showId === '') return res.send(400);
    
    db.Shows.findOne({_id: showId}, function(err, fs) {
        if (err) return next(err);
        
        var cb = function(error) {
            if(error) return next(error);
            return res.send(200);
        };
        
        if (fs === null) {
            shows.getById({params: {id:showId}}, function(show){
                var fs = new db.Shows();
                fs._id = showId;
                fs.name = show.name;
                fs.genres = _.pluck(show.genres, "id");
                fs.status = show.status;
                fs.posterPath = show.poster_path;
                fs.save(function(e){
                    if(e) { return next(e); }
                    updateFollowedShow(req.user.id, {show: showId, name: show.name, season: 1, episode: 1, airDate: null, status: 0}, true, cb);
                });
            }, next);
        }
        else {
            updateFollowedShow(req.user.id, {show: showId, name: fs.name, season: 1, episode: 1, airDate: null, status: 0}, false, cb);
        }
    });
};

exports.unfollowShow = function(req, res, next) {
    var showId = req.params.id || '';
    if(showId === '') return res.send(400);
    
    db.Users.findOneAndUpdate({'_id':req.user.id}, {$pull : {'followed' : { 'show' :showId}}}, function(e, r){
        if(e) return next(e);
        // Delete show if no one is following it
        var q = db.Users.find({"followed.show" : showId}).limit(1).size();
        q.exec(function(e,r){
            if(r.length === 0) db.Shows.findByIdAndRemove(showId).exec(); // I don't care of the result
            return res.send(200);
        });
    });
};

exports.setLastWatchedEpisode = function(req, res, next) {
    var showId = req.params.id || '';
    if(showId === '') return res.send(400);
    var lastWatchedSeason = req.params.season || '0';
    var lastWatchedEpisode = req.params.episode || '0';
    
    // Callbacks
    var errCb = function(err) {
        if(err) return next(err);
        return res.send(200);
    };
    
    var showCb = function(err, show) {
        if(err) return next(err);
        return res.json(_.find(show.toJSON().followed, function(s) { return s.show == showId }));
    };
    
    // Common save function
    var saveNextEpToWatch = function(nextEpToWatch, showCb) {
        db.Users.findOneAndUpdate({_id :req.user.id, "followed.show" : showId}, {$set : { "followed.$":nextEpToWatch}}, showCb);
    };
    
    if (lastWatchedSeason == 0 || lastWatchedEpisode == 0) {
        saveNextEpToWatch({show: showId, season: 1, episode: 1, airDate: null, status: 0}, showCb);
    }
    else {
        shows.getSeasonDetails(
            {params: {id:showId, number:lastWatchedSeason}},
    		function(currentSeason){ 
    		    var nextEp = currentSeason.episodes[lastWatchedEpisode];
    		    if (nextEp) { // new episode in currently watched season
    		        saveNextEpToWatch({
    		            show: showId,
    		            season: currentSeason.season_number,
    		            episode: nextEp.episode_number, 
    		            airDate: new Date(nextEp.air_date) > Date.now() ? nextEp.air_date : null,
    		            status: new Date(nextEp.air_date) > Date.now() ? 1 : 0
    		        }, showCb);
    		    }
    		    else {
    		        shows.getSeasonDetails(
                        {params: {id:showId, number:currentSeason.season_number + 1}},
                		function(nextSeason){ 
                		    if (nextSeason.episodes && nextSeason.episodes.length > 0) { // new episode in the next-to-watch season
                		        saveNextEpToWatch({ 
                		            show: showId,
                		            season: nextSeason.season_number,
                		            episode: 1, 
                		            airDate: new Date(nextSeason.episodes[0].air_date) > Date.now() ? nextSeason.episodes[0].air_date : null, 
                		            status: new Date(nextSeason.episodes[0].air_date) > Date.now() ? 1 : 0
                		        }, showCb);
                		    }
                		    else {
                		        db.Users.findOneAndUpdate({_id :req.user.id, "followed.show" : showId}, {$set : { "followed.$.status":2}}, showCb);
                		    }
                		},errCb);
    		    }
    		},errCb);
    }
};

exports.dailyUpdate = function() {
	
	console.log("Daily shows update " + moment().format("L"));
	var errCb = function(error) { if(error) console.error(error); };
	
	var q = db.Shows.find();
	q.exec(function(err,followedShows){
		if(err) return errCb(err);
		_.each(followedShows, function(fs) {
		    // get details on every followed show
		    shows.getById(
		        {params: {id:fs._id}},
    		    function(show){
    		        // update common data
    		        db.Shows.findByIdAndUpdate(fs._id, {$set : {status : show.status, posterPath : show.poster_path}}, errCb);
    		        // check if there is a new episode
    		        shows.getSeasonDetails(
    		            {params: {id:fs._id, number:show.number_of_seasons}},
    		            function(season){
    		                var nextEp = season.episodes[fs.season === season.season_number ? fs.episode : 0];
    		                if (Date.now() <= new Date(nextEp.air_date)) {
    		                    // update all followed shows with status 2 (up-to-date)
    		                    var nextEpToWatch = { show: fs._id, season: season.season_number, episode: nextEp.episode_number, airDate: nextEp.air_date, status : 0 };
    		                    console.log("   - New episode for " +show.name + " (S" + season.season_number + "E" + nextEp.episode_number+")");
    		                    db.Users.update({"followed.show" : fs._id, "followed.status" : 2},{$set : { "followed.$":nextEpToWatch}}, {multi:true}, errCb);
    		                }
    		            },
    		            errCb);
                }, 
                errCb);
		});
	});
};