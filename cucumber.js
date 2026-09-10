require('dotenv').config();

const mobileFormat = [
  "./mobile/support/quietProgressFormatter.js",
  `html:reports/${process.env.MOBILE_REPORT_FILE || "mobile-cucumber-report"}.html`,
];

module.exports = {
  api: {
    paths: ["api/features/**/*.feature"],

    require: ["api/steps/**/*.ts", "api/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: ["progress", "html:reports/api-cucumber-report.html"],

    publishQuiet: true,
  },

  "api-ci": {
    paths: [],

    require: ["api/steps/**/*.ts", "api/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: [
      "progress",
      `json:reports/api-cucumber-report-${process.env.API_SHARD_INDEX || "local"}.json`,
      `html:reports/api-cucumber-report-${process.env.API_SHARD_INDEX || "local"}.html`,
    ],

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
      "html:reports/web-cucumber-report.html",
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
    paths: ["mobile/android/features/**/*.feature"],

    require: ["mobile/android/steps/**/*.ts", "mobile/android/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: ["progress", "html:reports/android-cucumber-report.html"],

    publishQuiet: true,
  },

  "android-mybanking": {
    paths: ["mobile/android-mybanking/features/**/*.feature"],
    require: ["mobile/android-mybanking/steps/**/*.ts", "mobile/android-mybanking/support/**/*.ts"],
    requireModule: ["tsx/cjs"],
    format: ["progress", "html:reports/android-mybanking-cucumber-report.html"],
    publishQuiet: true,
  },
};
