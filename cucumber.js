const mobileFormat = process.env.HEADLESS === 'false'
  ? ['./mobile/support/quietProgressFormatter.js', 'html:reports/mobile-cucumber-report.html', 'allure-cucumberjs/reporter']
  : ['progress', 'html:reports/mobile-cucumber-report.html', 'allure-cucumberjs/reporter'];

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

    require: ["web/steps/**/*.ts", "web/support/**/*.ts"],

    requireModule: ["tsx/cjs"],

    format: ["progress", "html:reports/web-cucumber-report.html"],

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

  "android-mybanking": {
    paths: ["android-mybanking/features/**/*.feature"],
    require: ["android-mybanking/steps/**/*.ts", "android-mybanking/support/**/*.ts"],
    requireModule: ["tsx/cjs"],
    format: ["progress", "html:reports/android-mybanking-cucumber-report.html"],
    publishQuiet: true,
  },
};
