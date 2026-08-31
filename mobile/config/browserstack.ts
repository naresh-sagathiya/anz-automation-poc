export const capabilities = {
  platformName: 'Android',
  browserName: 'Chrome',

  'bstack:options': {
    userName: process.env.BROWSERSTACK_USERNAME,
    accessKey: process.env.BROWSERSTACK_ACCESS_KEY,

    deviceName: 'Google Pixel 7',
    osVersion: '13.0',

    projectName: 'ANZ Mobile POC',
    buildName: 'Build-1',
    sessionName: 'ParaBank Login'
  }
};