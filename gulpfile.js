var browserify = require('browserify');
var source = require('vinyl-source-stream'); 
var gulp = require('gulp');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var streamify = require('gulp-streamify');
var gutil = require('gulp-util');
var download = require("gulp-download");
var gunzip = require('gulp-gunzip');
var untar = require('gulp-untar2');
var jasmine = require('gulp-jasmine');
var reporters = require('jasmine-reporters');
var jasminePhantomJs = require('gulp-jasmine2-phantomjs');


var browserifyTask = function (options) {

  // Our app bundler
  var appBundler = browserify({
    entries: [options.src],
    cache: {}, 
    packageCache: {}
  });

  // Un-minified browser package
  appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('neo4j-web.js'))
      .pipe(gulp.dest(options.dest));


  appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('neo4j-web.min.js'))
      .pipe(gulp.dest(options.dest))
      .pipe(gulpif(!options.development, streamify(uglify())))
}

gulp.task('default', ["test", "browser"]);

gulp.task('browser', function () {

  browserifyTask({
    src:  'lib/neo4j.js',
    dest: 'build/browser'
  });

});

gulp.task('test', ["test-nodejs", "test-browser"]);

gulp.task('test-nodejs', function () {
  return gulp.src('test/*.test.js')
        .pipe(jasmine({
            reporter: new reporters.JUnitXmlReporter({
              savePath: "build/nodejs-test-reports",
              consolidateAll: false
            })
        }));
});


gulp.task('test-browser', function () {
  // TODO: We should not use PhantomJS directly, instead we should run this via Karma to get wide cross-browser testing
  gulp.src('./test/*.test.js')
    .pipe(concat('all.test.js'))
    .pipe(gulp.dest('./build/'));
  
  browserify({ entries: ['build/all.test.js'] })
     .bundle()
     .on('error', gutil.log)
     .pipe(source('neo4j-web.test.js'))
     .pipe(gulp.dest('./build/browser/'));

  return gulp.src('./test/browser/testrunner-phantomjs.html').pipe(jasminePhantomJs());
});