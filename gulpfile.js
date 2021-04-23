var gulp        = require('gulp');
var inject      = require('gulp-inject');
var browserSync = require('browser-sync').create();
var sass        = require('gulp-sass');
var minify      = require('gulp-minifier');
var zip         = require('gulp-zip');
var del         = require('del');
var pkg         = require('./package.json');

gulp.task('watch', function () {
    browserSync.init({
        server: './app'
    });

    gulp.watch("./src/scss/**/*.scss", gulp.series('sass'));
    gulp.watch("./src/scripts/**/*.js", gulp.series('js'));
    gulp.watch("./src/*.html", gulp.series('html','inject'));
    gulp.watch(["app/**/*"]).on('change', browserSync.reload);
});

gulp.task('sass', function() {
    return gulp.src('src/scss/**/*.scss')
        .pipe(sass())
        .pipe(minify({
          minify: true,
          minifyCSS: true,
          getKeptComment: function (content, filePath) {
              var m = content.match(/\/\*![\s\S]*?\*\//img);
              return m && m.join('\n') + '\n' || '';
          }
        }))
        .pipe(gulp.dest("app/css"))
        .pipe(browserSync.stream());
});

gulp.task('js', function() {
    return gulp.src('src/scripts/**/*.js').pipe(minify({
        minify: true,
        minifyJS: {
            sourceMap: true
        },
        getKeptComment: function (content, filePath) {
            var m = content.match(/\/\*![\s\S]*?\*\//img);
            return m && m.join('\n') + '\n' || '';
        }
    }))
        .pipe(gulp.dest('app/scripts'))
        .pipe(browserSync.stream());
});

gulp.task('html', function(){
    return gulp.src('src/*.html')
        .pipe(gulp.dest('app/'))
        .pipe(browserSync.stream());
});

gulp.task('inject', () => {
    return gulp.src(['./app/*.html'])
        .pipe(inject(gulp.src([
                './app/scripts/*.js',
                './app/**/*.css',],
            {read: false}),
            {relative: true,
                transform: function (filepath) {
                    if (filepath.slice(-5) === '.html') {
                        var id = filepath.slice(0,-5).replace(/[\/]/g,'_');
                        return '<script id="'+id+'" src="'+filepath+'" type="text/html"></script>';
                    }
                    // Use the default transform as fallback:
                    return inject.transform.apply(inject.transform, arguments);
                }}))
        .pipe(gulp.dest('./app'))
        .pipe(browserSync.stream());
});

gulp.task('zip', function(){
    return gulp.src('app/**/*')
        .pipe(zip(pkg.name+'.zip'))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
    return del(['app/**/*','dist/**/*']);
});

gulp.task('default', gulp.series('clean', 'js','sass','html','inject','watch'));

gulp.task('dist', gulp.series('clean', 'js','sass','html','inject','zip'));