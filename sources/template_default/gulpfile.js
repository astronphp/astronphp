"use strict";

// Load plugins
const autoprefixer  = require("./node_modules/gulp-autoprefixer");
const browsersync   = require("./node_modules/browser-sync/dist").create();
const cleanCSS      = require("./node_modules/gulp-clean-css");
const del           = require("./node_modules/del");
const gulp          = require("./node_modules/gulp");
const header        = require("./node_modules/gulp-header");
const merge         = require("./node_modules/merge-stream");
const plumber       = require("./node_modules/gulp-plumber");
const rename        = require("./node_modules/gulp-rename");
const sass          = require("./node_modules/gulp-sass");
const uglify        = require("./node_modules/gulp-uglify");
const fileinclude   = require('./node_modules/gulp-file-include/lib');
const replace       = require('./node_modules/gulp-replace-task');
const htmlmin       = require("./node_modules/gulp-htmlmin");
const hash_src      = require("./node_modules/gulp-hash-src/hash-src");
const newer         = require("./node_modules/gulp-newer");
const fs            = require("fs");
const md5           = require("./node_modules/md5/md5");

// Load package.json for banner
const pkg           = require('./package.json');
const tpl_config    = require('./_variables.json');


const path_public   = tpl_config.path_public+tpl_config.template_name;


// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %>\n',
  ' * Copyright 2019-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/rocket-startup/rocket-startup/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

function pathstorage(){
  return tpl_config.path_storage+'@@'+md5(new String(tpl_config.template_name))+'/';
}

// BrowserSync
function browserSync(done) {

  browsersync.init({
    server: {
      baseDir: pathstorage()
    },
    port: 3000
  });
  done();
}

function template_replacer(type) {
  var obj = JSON.parse(fs.readFileSync('./_variables.json', 'utf8'));
  var front_replace={'patterns':Array()};
  for(var k in obj.replacer) {
    front_replace.patterns.push({match:k,replacement:obj.replacer[k][type]});
  }
  if(type=='front'){
    front_replace.patterns.push({match:'__assets__',replacement:'/assets'});
  }else{
      front_replace.patterns.push({match:'__assets__',replacement: '@@'+md5(new String(tpl_config.template_name))+'/assets'});
  }


  return front_replace;
}




// Clean vendor
function clean() {
  return del(pathstorage(), {force:true});
}

// Clean vendor
function cleanTrash() {
  return del('../../storage/apps/templates/*.tpl', {force:true});
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap JS
  var bootstrapJS = gulp.src('./node_modules/bootstrap/dist/assets/js/*')
    .pipe(gulp.dest(pathstorage()+'assets/vendor/bootstrap/js'));
  // Bootstrap SCSS
  var bootstrapSCSS = gulp.src('./node_modules/bootstrap/scss/**/*')
    .pipe(gulp.dest(pathstorage()+'assets/vendor/bootstrap/scss'));
  // Font Awesome
  var fontAwesome = gulp.src('./node_modules/@fortawesome/**/*')
    .pipe(gulp.dest(pathstorage()+'assets/vendor'));
  // jQuery Easing
  var jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest(pathstorage()+'assets/vendor/jquery-easing'));
  // jQuery
  var jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest(pathstorage()+'assets/vendor/jquery'));
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
    .pipe(gulp.dest(pathstorage()+'assets/css'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(pathstorage()+'assets/css'))
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
    .pipe(gulp.dest(pathstorage()+'assets/js'))
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
    .pipe(hash_src({build_dir: pathstorage(), src_path: pathstorage()}))
    .pipe(gulp.dest(pathstorage()))
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
    .pipe(gulp.dest('../../storage/apps/templates/'))
    .pipe(hash_src({build_dir: pathstorage(), src_path: pathstorage()}))
    .pipe(replace({
      patterns: [
        {
          match: md5(new String(tpl_config.template_name)),
          replacement: './'+tpl_config.template_name
        }
      ]
    }))
    .pipe(gulp.dest('./files_tpl/'))
    .pipe(browsersync.stream());
}



function moveImage(){
  return gulp.src([
      './src/media/*',
    ])
    .pipe(gulp.dest(pathstorage()+'assets/media/'));
}

function movePublic(){
  return gulp.src([
      pathstorage()+'*',
      pathstorage()+'**/*.*',
      '!'+pathstorage()+'tpl/**',
      '!'+pathstorage()+'*.html'
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

  gulp.watch(["./src/**/*","./_variables.json"], function(done) {
    moveImage();
    css();
    js();
    html();
    tpl();
    movePublic();
    cleanTrash();
    browsersync.reload();
    done();
  });
}


// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, moveImage, css, js, html, tpl , movePublic, cleanTrash);
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.js = js;
exports.html = html;
exports.tpl = tpl;
exports.moveImage = moveImage;
exports.movePublic = movePublic;
exports.clean = clean;
exports.pathstorage = pathstorage;
exports.cleanTrash = cleanTrash;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
exports.template_replacer = template_replacer;