// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require("gulp")
// Importing all the Gulp-related packages we want to use
const plumber = require("gulp-plumber")
const pug = require("gulp-pug")
const sass = require("gulp-sass")(require("sass"))
const concat = require("gulp-concat")
const terser = require("gulp-terser")
const postcss = require("gulp-postcss")
const autoprefixer = require("autoprefixer")
const cssnano = require("cssnano")
const browsersync = require("browser-sync").create()

// File paths
const paths = {
	scss: "src/scss/**/*.scss",
	js: "src/js/**/*.js",
	pug: "src/*.pug",
	dest: "dist",
	nodeModules: ["./node_modules"],
}

const exportPaths = {
	scss: paths.dest + "/css",
	js: paths.dest + "/js",
	pug: paths.dest,
}

// Pug task
function pugTask() {
	return src(paths.pug)
		.pipe(plumber())
		.pipe(pug())
		.pipe(dest(exportPaths.pug))
}

// Sass task: compiles the style.scss file into style.css
function scssTask() {
	return src(paths.scss, { sourcemaps: true }) // set source and turn on sourcemaps
		.pipe(plumber())
		.pipe(sass({ includePaths: paths.nodeModules })) // compile SCSS to CSS
		.pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
		.pipe(dest(exportPaths.scss, { sourcemaps: "." })) // put final CSS in dist folder with sourcemap
}

// JS task: concatenates and uglifies JS paths to script.js
function jsTask() {
	return src(
		[
			paths.js,
			//,'!' + 'includes/js/jquery.min.js', // to exclude any specific paths
		],
		{ sourcemaps: true }
	)
		.pipe(plumber())
		.pipe(concat("app.js"))
		.pipe(terser())
		.pipe(dest(exportPaths.js, { sourcemaps: "." }))
}

// Browsersync to spin up a local server
function browserSyncServe(cb) {
	// initializes browsersync server
	browsersync.init({
		server: {
			baseDir: paths.dest,
		},
	})
	cb()
}
function browserSyncReload(cb) {
	// reloads browsersync server
	browsersync.reload()
	cb()
}

// Browsersync Watch task
// Watch Pug file for change and reload browsersync server
// watch SCSS and JS paths for changes, run scss and js tasks simultaneously and update browsersync
function bsWatchTask() {
	watch(paths.pug, series(pugTask, browserSyncReload))
	watch(
		[paths.scss, paths.js],
		{ interval: 1000, usePolling: true }, //Makes docker work
		series(parallel(pugTask, scssTask, jsTask), browserSyncReload)
	)
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
exports.default = series(
	parallel(pugTask, scssTask, jsTask),
	browserSyncServe,
	bsWatchTask
)
