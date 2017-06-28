/* eslint-env node */
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  var config = {
    "ember-cli-qunit": {
      useLintTree: true
    },
    /* etc */
    babel: {
      plugins: ["transform-class-properties", "syntax-class-properties"],
      includePolyfill: true,
      blacklist: [
        "es6.blockScoping/constants",
        'es6.arrowFunctions',
        'es6.forOf',
        'regenerator',
        'es6.arrowFunctions',
        'es6.constants',
        'es6.blockScoping',
        'es6.templateLiterals'],
      optional: {"es7.classProperties": 0}
    },
    sourcemaps: {
      enabled: true,
      extensions: ['js']
    }
  };

  var app = new EmberApp(defaults, config);

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
};
