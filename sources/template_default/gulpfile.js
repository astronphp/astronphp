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
const md5           = require("md5");
const twig          = require('gulp-twig');

const pkg           = require('./package.json');
const tpl_config    = require('./_variables.json');
const path_public   = tpl_config.path_public+templatename();




// Set the banner content
const banner = ['/*!\n',
  ' * <%= pkg.title %> v<%= pkg.version %>\n',
  ' * Copyright ' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' */\n',
  '\n'
].join('');

function templatename(){
  var path=__dirname.replace(/\\/g, "/").split('/');
  return path[path.length-1];
}
function pathstorage(){
  return tpl_config.path_storage+'@@'+md5(new String(templatename()))+'/';
}


// Clean vendor
function clean() {
  return del(pathstorage(), {force:true});
}
function cleanTrash() {
  return del([tpl_config.path_storage+'*.html'], {force:true});
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
    const ret = []
    tpl_config.vendors.forEach(function(data, index) {
      var dist = pathstorage()+data.dist;
      var ob = gulp.src(data.mod).pipe(gulp.dest(dist));
      ret.push(ob);
    });

    return merge(ret);
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
    .pipe(gulp.dest(pathstorage()+'assets/js'));
}

function htmlTwig(){  
      var _variables = JSON.parse(fs.readFileSync('./_variables.json', 'utf8'));
      return gulp.src(pathstorage()+'*.tpl')
      .pipe(twig({ data: _variables.twig_dev }))
      .pipe(rename({ extname: '.html' }))
      .pipe(gulp.dest(pathstorage()))
      .pipe(browsersync.stream());

}
function html(){
    return gulp.src('./src/views/*.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/views/include/'
        }))
        .pipe(replace({
          patterns: [ { match: '__assets__', replacement: '/assets'}]
        }))
        .pipe(htmlmin())
        .pipe(hash_src({build_dir: pathstorage(), src_path: pathstorage()}))
        .pipe(rename({ extname: '.tpl' }))
        .pipe(gulp.dest(pathstorage()));        
}

function tpl(){
    del('./files_tpl/', {force:true})
    
    gulp.src('./src/views/*.html')
      .pipe(fileinclude({
          prefix: '@@',
          basepath: './src/views/include/'
      }))
      .pipe(replace({
        patterns: [ { match: '__assets__', replacement: '@@'+md5(new String(templatename()))+'/assets'}]
      }))
      .pipe(htmlmin())
      .pipe(gulp.dest(tpl_config.path_storage))
      .pipe(hash_src({build_dir: pathstorage(), src_path: pathstorage()}))
      .pipe(replace({
        patterns: [
          {
            match: md5(new String(templatename())),
            replacement: './'+templatename()
          }
        ]
      }))
      .pipe(rename({ extname: '.tpl' }))
      .pipe(gulp.dest('./files_tpl/'));

    return gulp.src([
      pathstorage()+'*',
      pathstorage()+'**/*.*',
      '!'+pathstorage()+'*.html',
      '!'+pathstorage()+'*.tpl'
    ])
    .pipe(newer(path_public))
    .pipe(gulp.dest(path_public));
}

function moveImage(){
  return gulp.src([
      './src/media/**/**/*',
    ])
    .pipe(gulp.dest(pathstorage()+'assets/media/'));
}

// Watch files
function watchFiles() {
  gulp.watch(["./src/**/*","./_variables.json"], gulp.series(moveImage, gulp.parallel(css, js), html, gulp.parallel(htmlTwig, tpl), cleanTrash));
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series( vendor, moveImage, gulp.parallel(css, js), html, gulp.parallel(htmlTwig, tpl), cleanTrash);
const watch = gulp.series(build, browserSync , watchFiles);

// Export tasks
exports.modules = modules;
exports.clean = clean;
exports.moveImage = moveImage;
exports.css = css;
exports.js = js;
exports.html = html;
exports.htmlTwig = htmlTwig;
exports.tpl = tpl;
exports.pathstorage = pathstorage;
exports.templatename = templatename;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.cleanTrash = cleanTrash;
exports.default = build;


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