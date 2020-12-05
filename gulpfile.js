const gulp = require('gulp'),
	browserSync = require('browser-sync').create(), //browserSync
	pngquant = require('imagemin-pngquant'), //img
	imagemin = require('gulp-imagemin'), //minify image
	cache = require('gulp-cache'),
	del = require('del'),
	ts = require('gulp-typescript'),
	stylus = require('gulp-stylus'),
	plumber = require('gulp-plumber'),
	autoprefixer = require('gulp-autoprefixer'),
	sourcemaps = require('gulp-sourcemaps')

const sources = {
	src: './src/',
	build: './build/',
}

const tsProject = ts.createProject('tsconfig.json')

//watcher
gulp.task('watch', () => {
	browserSync.init({
		server: {
			baseDir: 'build',
		},
	})
	gulp.watch([`${sources.src}ts/*.ts`], gulp.series('ts'))
	gulp.watch([`${sources.src}ts/*.json`], gulp.series('json'))
	gulp.watch([`${sources.src}html/**/*.html`], gulp.series('html'))
	gulp.watch([`${sources.src}css/**/*.styl`], gulp.series('stylus'))
})

// clear build folder
gulp.task('html', () => {
	return gulp
		.src(`${sources.src}html/**/*.html`)
		.pipe(gulp.dest(`${sources.build}`))
		.pipe(browserSync.stream())
})

// style
gulp.task('stylus', function () {
	return gulp
		.src(`${sources.src}css/index.styl`)
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(
			stylus({
				compress: true,
				'include css': true,
			})
		)
		.pipe(
			autoprefixer({
				cascade: true,
			})
		)
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(`${sources.build}css/`))
		.pipe(browserSync.stream())
})

// ts
gulp.task('ts', () => {
	return gulp
		.src(`${sources.src}ts/**/*.ts`)
		.pipe(tsProject())
		.pipe(gulp.dest(`${sources.build}js/`))
		.pipe(browserSync.stream())
})
gulp.task('json', () => {
	return gulp
		.src(`${sources.src}ts/**/*.json`)
		.pipe(gulp.dest(`${sources.build}js/`))
		.pipe(browserSync.stream())
})

//minify image
gulp.task('image-min', () => {
	return gulp
		.src(`${sources.src}images/**/*`)
		.pipe(
			cache(
				imagemin({
					interlaced: true,
					progressive: true,
					optimizationLevel: 2,
					use: [pngquant()],
				})
			)
		)
		.pipe(gulp.dest(`${sources.build}images/`))
})

// clear build folder
gulp.task('clean', () => {
	return del(`${sources.build}*`, {force: true})
})

gulp.task('build', gulp.series('html', 'stylus', 'ts', 'json', 'image-min'))

gulp.task('default', gulp.series('build', 'watch'))
