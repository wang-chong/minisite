'use strict';

var gulp = require('gulp');
// 开发时同步测试
var browserSync = require('browser-sync').create();
// 对文件进行版本更新，保证每次打包之后的文件名都不一样，防止浏览器缓存
var RevAll = require('gulp-rev-all');
// 对css或者js进行打包，最后将只有一个js被html访问
var useref = require('gulp-useref');
// 对css进行压缩等
var cleanCss = require('gulp-clean-css');
// 针对不同文件进行不一样的操作
var gulpIf = require('gulp-if');
// 针对js进行压缩
var uglify = require('gulp-uglify');
// gulp任务同步执行
var sequence = require('gulp-sequence');
// 删除文件夹
var clean = require('gulp-clean');
// 压缩dist文件夹为zip模式，方便上传到服务器
var gzip = require('gulp-gzip');
var tar = require('gulp-tar');
// 给css自动添加前缀
var autoprefixer = require('gulp-autoprefixer');

// MD5
gulp.task('md5', function () {

    var revRule = {
        dontRenameFile: [/^\/favicon.ico$/g, '.html'],
        dontUpdateReference: [/^\/favicon.ico$/g, '.html']
    };
    return gulp.src(['build/**/*.*'])
        .pipe(RevAll.revision(revRule))
        .pipe(gulp.dest('dist'))
        .pipe(RevAll.manifestFile())
        .pipe(gulp.dest('dist'));
});

gulp.task('prefix', function () {
	var prefixRule = {
        browsers: ['IE >= 8.0'],
        cascade: true, //是否美化属性值 默认：true
        remove:true //是否去掉不必要的前缀 默认：true
    };
	return gulp.src('dist/**/*.css')
		.pipe(autoprefixer(prefixRule))
		.pipe(gulp.dest('abc'))
});

// 对css或者js进行打包，最后将只有一个js被html访问
gulp.task('refHtml', function () {
	var resourceFilters = ['*site/**/*.html'];
	var refRule = {
		allowEmpty: true,
		searchPath: process.cwd(),
		base: 'html'
	};
	var prefixRule = {
        browsers: ['IE >= 8.0', 'Firefox >= 20', 'Chrome >= 40'],
        cascade: true, //是否美化属性值 默认：true
        remove:true //是否去掉不必要的前缀 默认：true
    };

    return gulp.src(resourceFilters)
        .pipe(useref(refRule))
        .pipe(gulpIf('*.css', autoprefixer(prefixRule)))
        .pipe(gulpIf('*.css', cleanCss({
            compatiblility: 'ie8'
        })))
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulp.dest('build'));
});

// 压缩打包dist文件夹
gulp.task('gzip', function () {
  	return gulp.src(['dist/**/*'])
	    .pipe(tar('minisite.tar'))
	    .pipe(gzip())
	    .pipe(gulp.dest('dist'));
});

// delete build folder
gulp.task('clean-build', function (cb) {
    return gulp.src(['build'], {
            read: false
        })
        .pipe(clean({
            force: true
        }));
});

// delete dist folder
gulp.task('clean-dist', function (cb) {
    return gulp.src(['dist'], {
            read: false
        })
    	.pipe(clean({
            force: true
        }));
});

gulp.task('server', function () {
    // 静态服务器
    browserSync.init({
        port: 8081,
        files: '**',
        server: {
            baseDir: "./"
        }
    });
});

// 项目编译打包
gulp.task('build',
	['clean-dist'],
	sequence(
		'refHtml',
		'md5',
		['clean-build', 'gzip']
));