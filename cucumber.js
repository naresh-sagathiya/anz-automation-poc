require('dotenv').config();

const mobileFormat = [
  "progress",
  "html:reports/mobile-cucumber-report.html",
];

module.exports = {
  api: {
    paths: ["api/features/**/*.feature"],

    require: ["api/steps/**/*.ts", "api/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: ["progress", "html:reports/api-cucumber-report.html"],

    publishQuiet: true,
  },

  web: {
    paths: ["web/features/**/*.feature"],

    require: [
      "web/steps/**/*.ts",
      'web/hooks/**/*.ts', 
      "web/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: [
      "progress",
      "html:reports/web/web-cucumber-report.html",
      "allure-cucumberjs/reporter",
    ],

    formatOptions: { resultsDir: "allure-results" },

    parallel: Number(process.env.WEB_PARALLEL_WORKERS || 1),

    publishQuiet: true,
  },

  mobile: {
    paths: ["mobile/features/**/*.feature"],

    require: ["mobile/steps/**/*.ts", "mobile/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: mobileFormat,

    publishQuiet: true,
  },

  android: {
    paths: ["android/features/**/*.feature"],

    require: ["android/steps/**/*.ts", "android/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: ["progress", "html:reports/android-cucumber-report.html"],

    publishQuiet: true,
  },
};
