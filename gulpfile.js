var gulp = require('gulp');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var ngAnnotate = require('gulp-ng-annotate');

gulp.task('css', function() {
  gulp.src('public/stylesheets/*.css')
    .pipe(plumber())
    .pipe(csso())
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest('public/stylesheets'));
});

gulp.task('appJS', function() {
  gulp.src(['public/js/app.js', 
  'public/js/services/*.js', 
  'public/js/controllers/*.js',
  'public/js/directives.js', 
  'public/js/filters.js', 
  '!public/js/*.min.js'])
    .pipe(concat('app.min.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

gulp.task('vendorJS', function() {
  gulp.src(['public/vendor/jquery-1.9.0.min.js', 'public/vendor/angular.js', 'public/vendor/*.js', '!public/vendor/*.min.js'])
    .pipe(concat('vendor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/vendor'));
});

// Default Task
gulp.task('default', ['css', 'appJS', 'vendorJS']);
