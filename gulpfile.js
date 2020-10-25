// VARIABLES & PATHS

const preprocessor = 'scss'; // Preprocessor name
const fileswatch   = 'html,htm,txt,json,md,woff2'; // List of files extensions for watching & hard reload (comma separated)
const imageswatch  = 'jpg,jpeg,png,webp,svg'; // List of images extensions for watching & compression (comma separated)
const baseDir      = 'app'; // Base directory path without «/» at the end
const buildDir     = 'build'; // Base directory path without «/» at the end
const online       = true; // If «false» - Browsersync will work offline without internet connection

const paths = {

   html: {
      src:  `${baseDir}/pages/*.njk`,
      dest: `${buildDir}`,
   },

   scripts: {
      src: [
         // 'node_modules/jquery/dist/jquery.min.js', // order example (npm i --save-dev jquery)
         `${baseDir}/js/app.js`, // app.js. Always at the end
      ],
      dest: `${buildDir}/js`,
   },

   styles: {
      src:  `${baseDir}/${preprocessor}/main.*`,
      dest: `${buildDir}/css`,
   },

   images: {
      src:  `${baseDir}/images/**/*`,
      dest: `${buildDir}/images`,
   },

   deploy: {
      hostname:    'username@yoursite.com', // Deploy hostname
      destination: 'yoursite/public_html/', // Deploy destination
      include:     [], // Included files to deploy
      exclude:     ['**/Thumbs.db', '**/*.DS_Store'], // Excluded files from deploy
   },

   cssOutputName: 'app.min.css',
   jsOutputName:  'app.min.js',

};

// LOGIC

const {
   src,
   dest,
   parallel,
   series,
   watch,
} = require('gulp');
const scss         = require('gulp-sass');
const cleancss     = require('gulp-clean-css');
const concat       = require('gulp-concat');
const browserSync  = require('browser-sync').create();
const uglify       = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imagemin     = require('gulp-imagemin');
const newer        = require('gulp-newer');
const rsync        = require('gulp-rsync');
const nunjucks     = require('gulp-nunjucks');
const del          = require('del');
const ghPages      = require('gh-pages');
const path         = require('path');
const formatHTML   = require('gulp-format-html');

function browsersync() {
   browserSync.init({
      server: {
         baseDir: `${buildDir}/`,
      },
      notify:  false,
      online,
      browser: ['firefox'], // 'google chrome',
   });
}

function html() {
   return src(paths.html.src)
      .pipe(nunjucks.compile())
      .pipe(formatHTML({ preserve_newlines: false }))
      .pipe(dest(paths.html.dest))
      .pipe(browserSync.stream());
}

function scripts() {
   return src(paths.scripts.src)
      .pipe(concat(paths.jsOutputName))
      .pipe(uglify())
      .pipe(dest(paths.scripts.dest))
      .pipe(browserSync.stream());
}

function styles() {
   return src(paths.styles.src)
      .pipe(scss())
      .pipe(concat(paths.cssOutputName))
      .pipe(autoprefixer({
         overrideBrowserslist: ['last 2 versions'],
         grid:                 true,
      }))
      .pipe(cleancss({
         level: {
            1: {
               specialComments: 0,
            },
         },
         /* format: 'beautify' */
      }))
      .pipe(dest(paths.styles.dest))
      .pipe(browserSync.stream());
}

function images() {
   return src(paths.images.src)
      .pipe(newer(paths.images.dest))
      .pipe(imagemin([
         imagemin.mozjpeg({
            quality:     90,
            progressive: true,
         }),
         imagemin.optipng({ optimizationLevel: 5 }),
      ]))
      .pipe(dest(paths.images.dest));
}

function cleanimg() {
   return del(`${paths.images.dest}/**/*`, {
      force: true,
   });
}

function cleanBuild() {
   return del(`${buildDir}/**/*`, {
      force: true,
   });
}

function deploy() {
   return src(`${buildDir}/`)
      .pipe(rsync({
         root:        `${buildDir}/`,
         hostname:    paths.deploy.hostname,
         destination: paths.deploy.destination,
         include:     paths.deploy.include,
         exclude:     paths.deploy.exclude,
         recursive:   true,
         archive:     true,
         silent:      false,
         compress:    true,
      }));
}

function ghDeploy(cb) {
   ghPages.publish(path.join(process.cwd(), `./${buildDir}`), cb);
}

function startwatch() {
   watch(`${baseDir}/${preprocessor}/**/*`, {
      usePolling: true,
   }, styles);
   watch(`${baseDir}/images/**/*.{${imageswatch}}`, {
      usePolling: true,
   }, images);
   watch(`${baseDir}/pages/**/*.njk`, {
      usePolling: true,
   }, html);
   watch(`${baseDir}/**/*.{${fileswatch}}`, {
      usePolling: true,
   })
      .on('change', browserSync.reload);
   watch([`${baseDir}/js/**/*.js`, `!${paths.scripts.dest}/*.min.js`], {
      usePolling: true,
   }, scripts);
}

exports.browsersync = browsersync;
exports.assets      = series(cleanimg, styles, scripts, images);
exports.styles      = styles;
exports.scripts     = scripts;
exports.images      = images;
exports.cleanimg    = cleanimg;
exports.cleanBuild  = cleanBuild;
exports.deploy      = deploy;
exports.ghDeploy    = ghDeploy;
exports.html        = html;
exports.default     = parallel(images, html, styles, scripts, browsersync, startwatch);
