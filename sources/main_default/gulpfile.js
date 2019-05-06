"use strict";

// Load plugins
const autoprefixer  = require("gulp-autoprefixer");
const browsersync   = require("browser-sync").create();
const cleanCSS      = require("gulp-clean-css");
const del           = require("del");
const gulp          = require("gulp");
const header        = require("gulp-header");
const merge         = require("merge-stream");
const plumber       = require("gulp-plumber");
const rename        = require("gulp-rename");
const sass          = require("gulp-sass");
const uglify        = require("gulp-uglify");
const fileinclude   = require('gulp-file-include');
const replace       = require('gulp-replace-task');
const htmlmin       = require("gulp-htmlmin");
const hash_src      = require("gulp-hash-src");
const newer         = require("gulp-newer");
const fs            = require("fs");

// Load package.json for banner
const pkg           = require('./package.json');
const tpl_config    = require('./_template-config.json');


const template      = tpl_config.template;
const path_public   = tpl_config.path_public;
const path_storage  = tpl_config.path_storage;

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %>\n',
  ' * Copyright 2019-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/RocketStartup/RocketStartup/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// BrowserSync
function browserSync(done) {

  browsersync.init({
    server: {
      baseDir: path_storage
    },
    port: 3000
  });
  done();
}

function template_replacer(type) {
  var obj = JSON.parse(fs.readFileSync('./_template-config.json', 'utf8'));

  var front_replace={'patterns':Array()};
  for(var k in obj.replacer) {
    front_replace.patterns.push({match:k,replacement:obj.replacer[k][type]});
  }
  return front_replace;
}




// Clean vendor
function clean() {
  return del(path_storage, {force:true});
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap JS
  var bootstrapJS = gulp.src('./node_modules/bootstrap/dist/assets/js/*')
    .pipe(gulp.dest(path_storage+'assets/vendor/bootstrap/js'));
  // Bootstrap SCSS
  var bootstrapSCSS = gulp.src('./node_modules/bootstrap/scss/**/*')
    .pipe(gulp.dest(path_storage+'assets/vendor/bootstrap/scss'));
  // Font Awesome
  var fontAwesome = gulp.src('./node_modules/@fortawesome/**/*')
    .pipe(gulp.dest(path_storage+'assets/vendor'));
  // jQuery Easing
  var jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest(path_storage+'assets/vendor/jquery-easing'));
  // jQuery
  var jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest(path_storage+'assets/vendor/jquery'));
  return merge(bootstrapJS, bootstrapSCSS, fontAwesome, jquery, jqueryEasing);
}

// CSS task
function css() {
   return gulp
    .src(['./src/scss/**/*.scss','./src/css/**/*.css'])
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: './node_modules',
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest(path_storage+'assets/css'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(path_storage+'assets/css'))
    .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src([
      './src/js/*.js',
      '!./src/js/*.min.js',
    ])
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(path_storage+'assets/js'))
    .pipe(browsersync.stream());
}

function html(){
  return gulp
    .src([
      './src/views/*.html',
    ])
    .pipe(fileinclude({
        prefix: '@@',
        basepath: './src/views/includes/'
    }))
    .pipe(htmlmin())
    .pipe(replace(template_replacer('front')))
    .pipe(hash_src({build_dir: path_storage, src_path: path_storage}))
    .pipe(gulp.dest(path_storage))
    .pipe(browsersync.stream());
}

function tpl(){
  return gulp
    .src([
      './src/views/*.html',
    ])
    .pipe(rename({ extname: '.tpl' }))
    .pipe(fileinclude({
        prefix: '@@',
        basepath: './src/views/includes/'
    }))
    .pipe(htmlmin())
    .pipe(replace(template_replacer('back')))
    .pipe(hash_src({build_dir: path_storage, src_path: path_storage}))
    .pipe(gulp.dest(path_storage+'tpl/'))
    .pipe(browsersync.stream());
}

function moveImage(){
  return gulp.src([
      './src/media/*',
    ])
    .pipe(gulp.dest(path_storage+'assets/media/'));
}

function movePublic(){
  return gulp.src([
      path_storage+'*',
      path_storage+'**/*.*',
      '!'+path_storage+'tpl/**',
      '!'+path_storage+'*.html'
    ])
    .pipe(newer(path_public))
    .pipe(gulp.dest(path_public));
}



// Watch files
function watchFiles() {
  gulp.watch("./src/scss/**/*", css);
  gulp.watch("./src/js/**/*", js);
  gulp.watch("./src/view/**/*", html);
  gulp.watch("./src/view/**/*", tpl);

  gulp.watch(["./src/**/*","./_template-config.json"], function(done) {
    moveImage();
    css();
    js();
    html();
    tpl();
    movePublic();
    browsersync.reload();
    done();
  });
}


// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, moveImage, css, js, html, tpl , movePublic);
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.js = js;
exports.html = html;
exports.tpl = tpl;
exports.moveImage = moveImage;
exports.movePublic = movePublic;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
exports.template_replacer = template_replacer;