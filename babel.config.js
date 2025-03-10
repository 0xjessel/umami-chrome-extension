module.exports = api => {
  // Check if we're running in test mode
  const isTest = api.env('test');
  
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            chrome: "90" // Target modern Chrome browsers
          },
          useBuiltIns: false, // Don't use polyfills that might require eval
          // Use 'commonjs' for Jest tests, 'false' for webpack builds
          modules: isTest ? 'commonjs' : false
        }
      ]
    ]
  };
};
