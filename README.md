TvSeriesTracker
=====
**Yet another TV series tracker application**

I realized this project to train in Node.js/AngularJS applications.
You can browse TV shows, searching by name or genre and then make your personal list of followed shows.  
I used [TheMovieDB API] to get shows informations.

Technologies
----

This project uses a number of open source projects to work properly:

* [Node.js] + [Express] for the backend
* [AngularJS] + [Bootstrap] for the frontend
* Many other JS libraries *(list coming soon...)*

Notes
----
Replace data in file *config/config.js* with your own configurations.  
All CSS and JS files can be concatenated and minified using [Gulp].

Tech Improvements
----
* Switch from CSS to LESS/SASS
* Use a view template engine

Functional Improvements
----
* Customized calendar for every user
* Episodes notifications (daily, weekly, ...)
* Live email validation on signup
* More caching

License
----
MIT

[TheMovieDB API]:https://www.themoviedb.org/documentation/api
[tvshow-tracker]:https://github.com/sahat/tvshow-tracker
[Node.js]:http://nodejs.org
[Express]:http://expressjs.com
[AngularJS]:https://angularjs.org/
[Bootstrap]:http://getbootstrap.com/
[Gulp]:http://gulpjs.com/
