var gulp = require('gulp'),
        less = require('gulp-less'),
        sourcemaps = require('gulp-sourcemaps'),
        runsequence = require('gulp-run-sequence'),
        webserver = require('gulp-webserver'),
        path = require('path'),
        minifyCss = require('gulp-minify-css'),
        LessAutoprefix = require('less-plugin-autoprefix'),
        gutil = require('gutil'),
        livereload = require('gulp-livereload'),
        gulpInject = require('gulp-inject'),
        cheerio = require('gulp-cheerio'),
        nunjucksRender = require('gulp-nunjucks-render'),
        concat = require('gulp-concat'),
        minify = require('gulp-minify'),
        gulpSvgstore = require('gulp-svgstore');

var PRODUCTION = false;

gulp.task('default', function (done) {
    return runsequence('develop', done);
});

gulp.task('develop', function (done) {
    return runsequence('less', 'watchTask', 'server', done);
});

gulp.task('watchTask', function () {
    livereload.listen();
    gulp.watch('./src/less/**/*.less', ['less']);
    gulp.watch('./src/javascript/**/*.js', ['javascript']);
    gulp.watch(['./src/templates/*/**.html'], ['templates']);
    gulp.watch(['./src/templates/*.html'], ['templates']);
});


gulp.task('less', function () {
    var pipe = gulp.src('./src/less/main.less')
            .pipe(sourcemaps.init())
            .pipe(less({
                plugins: [new LessAutoprefix({browsers: ['last 2 versions']})],
                paths: [
                    path.join(__dirname, 'node_modules', 'normalize-css'),
                    path.join(__dirname, 'node_modules', 'roboto-fontface', 'css', 'roboto', 'less')]
            })).on('error', gutil.log);
    if (PRODUCTION) {
        pipe = pipe.pipe(minifyCss());
    }
    return pipe.pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/assets'))
            .pipe(livereload());
});

gulp.task('fonts', function () {
    copy({
        main: './node_modules/roboto-fontface/fonts/Roboto/Roboto-Regular*',
        output: './build/assets/fonts/Roboto/'
    });
});

gulp.task('javascript', function () {
    var pipe = gulp.src('./src/javascript/**/*.js')
            .pipe(concat('main.js'));
    if (PRODUCTION) {
        pipe = pipe.pipe(minify());
    }
    return pipe.pipe(gulp.dest('./build/assets')).pipe(livereload());
});

gulp.task('server', function () {
    return gulp.src('./build')
            .pipe(webserver({
                livereload: true,
                open: true
            }));
});

gulp.task('templates', function (cb) {
    var svgs = gulp
            .src('./src/svg/**/*.svg')
            .pipe(cheerio({
                run: function ($) {
                    $('style').remove();
                },
                parserOptions: {
                    xmlMode: true
                }
            }))
            .pipe(gulpSvgstore({
                inlineSvg: true
            }));

    return gulp.src('./src/templates/*.html')
            .pipe(gulpInject(svgs, {
                transform: fileContents
            }))
            .pipe(nunjucksRender({
                path: ['./src/templates/']
            }))
            .pipe(gulp.dest('./build/'))
            .pipe(livereload());
});

function fileContents(filePath, file) {
    return file.contents.toString();
}

function copy(opts) {
    gulp.src(opts.main).pipe(gulp.dest(opts.output));
}