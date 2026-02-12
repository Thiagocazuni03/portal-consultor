module.exports = (grunt) => {
   grunt.initConfig({
      svgstore: {
         options: {
            prefix: 'ic-',
            cleanup: ['fill'],
            symbol: {
               fill: 'currentColor',
               'fill-rule': 'evenodd', 
               'clip-rule': 'evenodd',
            },
            includedemo: true,
            svg: {
               id: 'svg-defs',
               style: 'display: none;'
            }
         },
         default: {
            files: {
               'assets/icons.svg': ['assets/icons/*.svg']
            }
         }
      },
   })

   grunt.loadNpmTasks('grunt-svgstore');
   grunt.registerTask('icons', ['svgstore'])
}