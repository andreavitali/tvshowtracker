var request = require('request');
var config = require('../config/config.js');

// Exported function

exports.getById = function(req, res, next) {
    var id = req.params.id || '';
	if (id === '') return res.send(400);
	
	var url = config.TMBD_API_URL + "/tv/" + id;
	var qs = { api_key: config.TMDB_API_KEY, sort_by: 'popularity.desc' };
	
	request.get({url:url, qs:qs, json:true}, function(e,r,b) {
	   if(e) return next(e);
	   if(res.json) return res.json(b);
	   else return res(b);
	});
};

exports.getSeasonDetails = function(req, res, next) {
    var showId = req.params.id || '';
    var seasonNumber = req.params.number || '';
	if (showId === '' || seasonNumber === '') return res.send(400);
	
	var url = config.TMBD_API_URL + "/tv/" + showId + "/season/" + seasonNumber;
	var qs = { api_key: config.TMDB_API_KEY };
	
	request.get({url:url, qs:qs, json:true}, function(e,r,b) {
	   if(e) return next(e);
	   if(res.json) return res.json(b);
	   else return res(b);
	});
};

exports.configData = function(req, res, next) {
	var apiKeyParam = { api_key: config.TMDB_API_KEY };
	var imageBaseUrl = null;
	var genres = null;
	request.get({url:config.TMBD_API_URL + "/configuration", qs:apiKeyParam, json:true}, function(e,r,b) {
		if(e) return next(e);
		imageBaseUrl = b.images.base_url;
		request.get({url:config.TMBD_API_URL + "/genre/tv/list", qs:apiKeyParam, json:true}, function(e,r,b) {
			if(e) return next(e);
			genres = b.genres;
			return res.json({imageBaseUrl:imageBaseUrl, genres: genres});
		});
	});
};

exports.search = function(req, res, next) {
	var qName = req.body.name || undefined;
	var qGenre = req.body.genre || undefined;
	var qPage = req.body.page || 1;
	
	var qs;
	if(qName !== undefined) // By name
	{
		qs = { api_key: config.TMDB_API_KEY, query:qName, page:qPage };
		request.get({url:config.TMBD_API_URL + "/search/tv" , qs:qs, json:true}, function(e,r,b) {
		   if(e) return next(e);
		   return res.json(b);
		});
	}
	else if(qGenre !== undefined) // By genre
	{
		qs = { api_key:config.TMDB_API_KEY, sort_by:'popularity.desc', page:qPage, with_genres:qGenre };
		request.get({url:config.TMBD_API_URL + "/discover/tv" , qs:qs, json:true}, function(e,r,b) {
		   if(e) return next(e);
		   return res.json(b);
		});
	}
	else // Top 20 popular
	{
		qs = { api_key: config.TMDB_API_KEY, sort_by: 'popularity.desc' };
		request.get({url:config.TMBD_API_URL + "/discover/tv" , qs:qs, json:true}, function(e,r,b) {
		   if(e) return next(e);
		   return res.json(b);
		});
	}
};