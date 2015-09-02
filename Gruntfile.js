/* jshint node: true */
/*!
 * slickGrid's Gruntfile
 */

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  RegExp.quote = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var fs = require('fs');
  var path = require('path');

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*!\n' +
              ' * @license\n' +
              ' * slickGrid v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
              ' * Copyright 2009-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
              ' *\n' + 
              ' * Distributed under <%= pkg.license %> license.\n' + 
              ' * All rights reserved.\n' + 
              ' */\n' +
              '\n\n',
    bannerDocs: '/*!\n' +
              ' * slickGrid Docs (<%= pkg.homepage %>)\n' +
              ' * Copyright 2009-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
              ' *\n' + 
              ' * Distributed under <%= pkg.license %> license.\n' + 
              ' * All rights reserved.\n' + 
              ' */\n' +
              '\n\n',
    jqueryCheck: 'if (typeof jQuery === \'undefined\') { throw new Error(\'slickGrid requires jQuery\') }\n\n',

    // Task configuration.
    clean: {
      dist: 'dist'
    },

    version_bump: {
      files: ['package.json']
    },
  
    concat: {
      options: {
        stripBanners: false,
        banner: '<%= banner %>',
        // Replace all 'use strict' statements in the code with a single one at the top (in the prelude)
        process: function(src, filepath) {
          return '//! Source: ' + filepath + '\n\n' +
            (!filepath.match(/\.prelude$/) ?
              src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?[ \t]*/g, '$1') :
              src);
        },
      },
      formatters: {
        src: ['formatters/*.js.prelude', 'formatters/*.js', 'formatters/*.js.postlude'],
        dest: 'slick.formatters.js',
      },
      editors: {
        src: ['editors/*.js.prelude', 'editors/*.js', 'editors/*.js.postlude'],
        dest: 'slick.editors.js',
      },
    },

    rewrite: {
      src: {
        src: ['*.js', 'controls/*.js', 'plugins/*.js', '*.css', '*.less', '*.scss'],
        editor: function (contents, filePath) {
          var v = grunt.config.get('pkg.version');
          console.log('- rewrite in place: ', filePath, v);
          var rv = contents
          .replace(/(slickGridVersion[^\d]+)([\d]+\.[\d.]+(?:[-.][a-zA-Z\d]+)*)/ig, '$1' + v)
          .replace(/(SlickGrid)\s+v?([\d]+\.[\d.]+(?:[-.][a-zA-Z\d]+)*)/ig, '$1 v' + v);
          return rv;
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['slick.*.js', 'controls/*.js', 'plugins/*.js']
      },
      /*
      lib: {
        src: 'lib/*.js'
      },
      */
      test: {
        src: 'tests/**/*.js'
      },
      examples: {
        src: 'examples/*.js'
      }
    },

    jscs: {
      options: {
        config: '.jscs.json',
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['slick.*.js', 'controls/*.js', 'plugins/*.js']
      },
      /*
      lib: {
        src: 'lib/*.js'
      },
      */
      test: {
        src: 'tests/**/*.js'
      },
      examples: {
        src: 'examples/*.js'
      }
    },

    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      src: '*.css',
      examples: 'examples/*.css'
    },

    less: {
      components: {
        options: {
          ieCompat: false,
          strictMath: true,
          strictUnits: true,
          outputSourceFiles: true,
          sourceMap: true
        },
        files: [
          {
            expand: true,
            cwd: '',
            src: ['*.less', 'controls/*.less', 'plugins/*.less', 'examples/*.less', '!slick.grid.less', '!slick.config.less', '!slick.config.*.less', '!slick.less.macros.less'],
            dest: '',
            ext: '.css'
          }
        ]
      },
      main: {
        options: {
          ieCompat: false,
          strictMath: true,
          strictUnits: true,
          outputSourceFiles: true,
          sourceMap: true
        },
        files: [
          {
            src: 'slick.grid.less',
            dest: 'slick.grid.css'
          }
        ]
      }
    },

    autoprefixer: {
        options: {
            browsers: ['last 2 versions']
        },
        dist: {
            files: {
                '*.css': ['tmp/*.css']
            }
        }
    },

    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: '<%= banner %>'
        },
        files: {
          src: ['slick*.js', 'controls/*.js', 'plugins/*.js', '*.css', '*.less', '*.scss']
        }
      }
    },

    csscomb: {
      sort: {
        options: {
          config: '.csscomb.json'
        },
        files: {
          'slick.grid.css': 'slick.grid.css',
          'slick-default-theme.css': 'slick-default-theme.css'
        }
      }
    },

    copy: {
      // synchronize library files in submodules to lib/_/
      libsync: {
        files: [
          {
            expand: true,       // `mkdir -p` equivalent
            cwd: 'lib/', 
            src: [
              'threedubmedia/event.drag/jquery.event.drag*.js', 'threedubmedia/event.drop/jquery.event.drop*.js', 
              'spectrum/spectrum.*', '!spectrum/spectrum.*.json', 
              'TinyColor/tinycolor.js',
              'verge-screendimensions/verge.js',
              'jquery-sparkline/dist/jquery.sparkline.js',
              'jquery-simulate/jquery.simulate.js',
              'jquery-multiselect/jquery.multiselect.*', 'jquery-multiselect/src/jquery.multiselect.js', 'jquery-multiselect/src/jquery.multiselect.filter.js'
            ], 
            flatten: true,      // ensures tinycolor.js, etc. all land in lib/_/ *sans subdirectory* 
            dest: 'lib/_/', 
            filter: 'isFile'
          }
        ]
      },
      // ---
      // copy fonts, etc. to the `dist/` output directory
      fonts: {
        expand: true,
        src: 'fonts/*',
        dest: 'dist/'
      },
      docs: {
        expand: true,
        cwd: './dist',
        src: [
          '{css,js}/*.min.*',
          'css/*.map',
          'fonts/*'
        ],
        dest: 'docs/dist'
      }
    },

    qunit: {
      options: {
        inject: 'js/tests/unit/phantom.js'
      },
      files: 'tests/**/*.html'
    }
  });


  // Load all files starting with `grunt-`
  require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});
  grunt.loadNpmTasks('assemble-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-version-bump');
  grunt.loadNpmTasks('grunt-rewrite');

  // Preparation task: synchronize the libraries (lib/*) from the submodules.
  grunt.registerTask('libsync', ['copy:libsync']);

  // Preparation (compile) task.
  grunt.registerTask('compile', ['clean', 'libsync', 'less']);

  // Lint task.
  grunt.registerTask('lint', ['csslint', 'jshint', 'jscs']);

  // Test task.
  grunt.registerTask('test', ['compile', 'lint', 'qunit']);

  // CSS distribution task.
  grunt.registerTask('dist-css', ['compile', 'csscomb', 'usebanner']);

  // Full distribution task.
  grunt.registerTask('dist', ['dist-css']);

  // Bump the version and update all files accordingly.
  grunt.registerTask('bump', ['version_bump', 'rewrite']);

  // Default task.
  grunt.registerTask('default', ['test', 'dist']);
};
