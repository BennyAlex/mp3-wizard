module.exports = {
  root: true,
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    browser: true,
    node: true,
    es6: true,
    amd: true
  },
  globals: {
    "require": true,
    "requireNode": true,
    "console": true,
    "document": true,
    "window": true,
    "async": true,
    "Promise": true
  },
  rules: {
    "strict": [0, "never"],
    "dot-notation": 1,
    "eqeqeq": 1,
    "no-bitwise": 1,
    "curly": [1, "multi-line"],
    "guard-for-in": 1,
    "wrap-iife": [1, "outside"],
    "no-use-before-define": [1, {"functions": true, "classes": true}],
    "new-cap": 1,
    "no-caller": 1,
    "no-new": 1,
    "no-plusplus": 0,
    "no-debugger": 1,
    "no-unused-vars": 1,
    "no-undef": 1,
    "semi": 0,
    "no-console": 1,
    "no-empty": 1
  },
};
