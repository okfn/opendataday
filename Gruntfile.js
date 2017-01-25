module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    svgstore: {
      options: {
        prefix: 'icon-', // This will prefix each ID
        svg: { // will be added as attributes to the resulting SVG
          class : 'svgstore'
        },
        includedemo: '{{#each icons}}<li><svg><use xlink:href="#{{name}}" /></svg><pre>&lt;svg&gt&lt;use xlink:href=&quot;#{{name}}&quot; /&gt&lt;/svg&gt</pre></li>{{/each}}',
      },
      default : {
        files: {
          'templates/includes/icons.svg': ['assets/icons/*.svg'],
        },
      },
    },

    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: 'assets/scss',
          src: ['*.scss'],
          dest: 'assets/css',
          ext: '.css'
        }]
      }
    },

    cssmin: {
      options: {
        sourceMap: true
      },
      target: {
        files: {
          'assets/css/style.css': ['node_modules/normalize.css/normalize.css', 'node_modules/animate.css/animate.css', 'assets/css/main.css']
        }
      }
    },

    concat: {
      options: {
        separator: '\n',
      },
      dist: {
        src: ['node_modules/waypoints/lib/jquery.waypoints.min.js', 'node_modules/waypoints/lib/shortcuts/sticky.min.js', 'node_modules/jquery-smooth-scroll/jquery.smooth-scroll.min.js', 'node_modules/slicknav/dist/jquery.slicknav.min.js'],
        dest: 'assets/js/plugins.js',
      },
    },

		watch: {
			css: {
				files: '**/*.scss',
				tasks: ['sass']
			},
      cssmin: {
				files: 'assets/css/main.css',
				tasks: ['cssmin']
			},
      icons: {
				files: 'assets/icons/*.svg',
				tasks: ['svgstore']
			}
		}
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-svgstore');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('icons', ['svgstore']);
  grunt.registerTask('plugins', ['concat']);
  grunt.registerTask('default',['watch']);

};
