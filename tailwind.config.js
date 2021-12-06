module.exports = {
  theme: {
    // every thing put it in extend will be merger with full config
    // every thing outside will override default config property
    extend: {
      colors: {},
      spacing: {}
    },
  },
  // all about focus ,hover,active responsive like sm lg md
  variants: {
    // active the backgroundColor for active state recompile to get new css file
    // when override utility make sure to give all necessary variants 
    // the order does matter 
    backgroundColor: ['responsive', 'hover', 'focus', 'active']
  },
  plugins: [],
}
