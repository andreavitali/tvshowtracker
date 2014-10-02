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
                		        db.Users.findOneAndUpdate({_id :req.user.id, "followed.show" : showId}, 
                		            {$set : {"followed.$.season":lastWatchedSeason, "followed.$.episode":lastWatchedEpisode, "followed.$.status":2}}, showCb);
                		    }
                		},errCb);
    		    }
    		},errCb);
    }
};

exports.dailyUpdate = function() {
	
	console.log("Daily shows update " + moment().format("L"));
	var errCb = function(error) { if(error) console.error(error); };
	
	// Update show with status = 1 if the next ep was aired yesterday
	db.Users.update({"followed": {$elemMatch: {"status":1, "airDate":{"$lt":moment().startOf('day').toDate()}}}}, {$set : {"followed.$.status":0}}, {multi:true}, function(err,num){
	    if(err) return errCb(err);
	    if(num > 0) console.log("Daily update: changed " + num + " shows from status = 1 to status = 0");
	});
	
	// Get all followed shows with status = 1 or 2
	db.Users.aggregate({$unwind:"$followed"},{$match:{"followed.status":{$in:[1,2]}}},{$project:{"followed":1}}, function(err, followedShows)
	{
	    if(err) return errCb(err);
	    
	    // For all the shows not ended
	    var fsIds = _.map(followedShows,function(fs) { return fs.followed.show; });
	    db.Shows.find({_id : {"$in":fsIds}, status:{"$ne":"Ended"}}, {_id:1}).lean().exec(function(err, ids)
	    {
	        if(err) return errCb(err);
	        _.each(_.pluck(ids,"_id"), function(showId) {
	            // get details
	            shows.getById(
 		            {params: {id:showId}},
     		        function(show){
     		            console.log("Daily update: checking " + show.name);
     		            
     		            // update common data
         		        db.Shows.findByIdAndUpdate(showId, {$set : {status : show.status, posterPath : show.poster_path}}, errCb);
         		        
            	        // check episode
            	        var fs = _.find(followedShows, function(e) { return e.followed.show === showId; }).followed;
            	        shows.getSeasonDetails(
        		            {params: {id:showId, number:show.number_of_seasons}},
        		            function(season){
        		                if(season.episodes && season.episodes.length > 0){
        		                    var nextEp;
        		                    if(fs.status == 1) nextEp = season.episodes[fs.episode - 1];
        		                    else {
        		                        nextEp = season.episodes[fs.episode]; // same season
        		                        if(!nextEp) nextEp = season.episodes[0]; // next season
        		                    }
        		                    
        		                    if(nextEp)
        		                    {
            		                    // if status = 1 update airDate
            		                    if(fs.status == 1) {
                		                    db.Users.update({"followed": {$elemMatch: {"show":showId, "status":1, "airDate":{"$ne":nextEp.air_date}}}}, {$set: {"followed.$.airDate":nextEp.air_date}}, {multi:true},
                		                    function(err,num){
                		                        if(err) return errCb(err);
                		                        if(num > 0) console.log("   - Updated airDate for show " + showId + " for " + num + " users (new date: " + nextEp.air_date + ")");
                		                    });
            		                    }
            		                    
            		                    // if status = 2 check for new ep
            		                    if((season.season_number > fs.season || nextEp.episode_number > fs.episode) && nextEp.air_date != null && Date.now() <= new Date(nextEp.air_date))
            		                    {
            		                        var nextEpToWatch = { show: showId, season: season.season_number, episode: nextEp.episode_number, airDate: nextEp.air_date, status : 1 };
                		                    db.Users.update({"followed": {$elemMatch: {"show":showId, "status":2}}}, {$set : { "followed.$":nextEpToWatch}}, {multi:true}, function(err,num){
                    		                    if(err) console.error(err);
                    		                    if(num > 0) console.log("   - Updated " + num + " users for show " + showId + " - " + show.name + " ( new ep: S" + season.season_number + "E" + nextEp.episode_number+")");
                    		                });
            		                    }
        		                    }
            		            }
        		            }, errCb);
     		        }, errCb);
	        });
	    });
	});
};