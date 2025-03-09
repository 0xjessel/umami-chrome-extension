module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          chrome: "90" // Target modern Chrome browsers
        },
        useBuiltIns: false, // Don't use polyfills that might require eval
        modules: false // Let webpack handle modules
      }
    ]
  ]
};
