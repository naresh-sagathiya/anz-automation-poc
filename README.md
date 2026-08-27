# ANZ Automation POC

Test automation for the ParaBank application using TypeScript, Cucumber, Playwright, WebdriverIO, and Appium.

## Prerequisites

- Node.js current LTS and npm
- Git
- Internet access for the hosted ParaBank environment
- Google Chrome, Firefox, WebKit dependencies, and Microsoft Edge/Google Chrome if those Playwright projects are used
- Android Studio, Android SDK, an Android 14 emulator, and Appium 3 for Android tests

Check the installed Node.js and npm versions:

```powershell
node --version
npm --version
```

## Installation

Clone the repository and install the dependencies:

```powershell
git clone https://github.com/naresh-sagathiya/anz-automation-poc.git
cd anz-automation-poc
npm install
```

Install the Playwright browser binaries and operating-system dependencies:

```powershell
npx playwright install
npx playwright install-deps
```

`playwright install-deps` is mainly intended for Linux. On Windows, install or update the browsers listed in the prerequisites manually when needed.

## Environment Configuration

The test code loads `.env` automatically through `dotenv`. Create a `.env` file in the repository root. Do not commit real credentials or secrets.

Example configuration:

```dotenv
API_BASE_URL=https://parabank.parasoft.com/parabank/services/bank
CUSTOMER_ID=12212
PARABANK_USER=john
PARABANK_PASS=demo

# Mobile browser settings
HEADLESS=true
DEVICE=iPad
MOBILE_BASE_URL=https://parabank.parasoft.com/parabank

# Appium and Android settings
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723
APPIUM_PATH=/
ANDROID_DEVICE_NAME=Pixel_10_Pro
ANDROID_PLATFORM_NAME=Android
ANDROID_PLATFORM_VERSION=14
ANDROID_AUTOMATION_NAME=UiAutomator2
ANDROID_CHROME_PACKAGE=com.android.chrome
ANDROID_CHROME_ACTIVITY=com.google.android.apps.chrome.Main

# Web tests
BASE_URL=https://parabank.parasoft.com/parabank
```

The main variables are:

| Variable | Purpose | Default or example |
| --- | --- | --- |
| `API_BASE_URL` | API service base URL | Hosted ParaBank API URL |
| `CUSTOMER_ID` | Customer used by API scenarios | `12212` |
| `PARABANK_USER` / `PARABANK_PASS` | ParaBank login credentials | `john` / `demo` |
| `MOBILE_BASE_URL` | URL used by mobile browser scenarios | Hosted ParaBank URL |
| `PARABANK_BASE_URL` | Fallback mobile base URL | Not set |
| `HEADLESS` | Set to `false` to show mobile browser windows | `true` |
| `DEVICE` | Playwright mobile device profile | `iPad` |
| `BASE_URL` | URL used by web scenarios | Required for web tests |
| `APPIUM_HOST` / `APPIUM_PORT` / `APPIUM_PATH` | Appium server connection | `127.0.0.1` / `4723` / `/` |
| `ANDROID_DEVICE_NAME` | Android emulator name | `Pixel_10_Pro` |
| `ANDROID_PLATFORM_VERSION` | Android version | `14` |

Mobile code also derives a base URL from `API_BASE_URL` when `MOBILE_BASE_URL` and `PARABANK_BASE_URL` are not set. The fallback is the hosted ParaBank URL.

## Test Commands

All commands are run from the repository root.

### Cucumber suites

```powershell
npm run test:api
npm run test:web
npm run test:mobile
npm run test:mobile:headed
npm run test:mobile:parallel
npm run test:mobile:parallel:headed
npm run test:android
```

The headed mobile commands set `HEADLESS=false`. The parallel mobile commands run two Cucumber workers. Each scenario creates its own Cucumber World and browser context, so scenarios can run independently.

Run a tagged subset by passing Cucumber options after the npm script:

```powershell
npm.cmd run test:mobile:parallel -- --tags @ID-M7
npm.cmd run test:web -- --tags @smoke
npm.cmd run test:api -- --tags @A1
```

Useful mobile tags include `@ID-M1`, `@ID-M7`, `@ID-M8`, `@transfer`, `@payee`, and `@validation`.

### Playwright tests

The Playwright configuration is in `playwright.config.ts` and defines desktop, mobile, branded-browser, and fullscreen projects.

```powershell
npx playwright test
npx playwright test --project=chromium
npx playwright test --project="iPhone 12"
npx playwright test --headed
```

Playwright runs test files in parallel locally. CI uses one worker and two retries.

### Local API mock server

The mock server listens on port `4010` by default:

```powershell
npm run start:locale:server
```

In a second terminal, point API tests at it:

```powershell
$env:API_BASE_URL = "http://localhost:4010"
npm run test:api
```

The mock server supports these optional variables: `PORT`, `JWT_SECRET`, `ACCESS_TOKEN_SECONDS`, `REFRESH_TOKEN_SECONDS`, `MFA_SECONDS`, and `MFA_CODE`.

## Android and Appium Setup

Android tests use WebdriverIO through Appium and launch Chrome on a native Android emulator.

1. Install Android Studio and create an Android 14 emulator whose name matches `ANDROID_DEVICE_NAME`.
2. Start the emulator and confirm it is visible to ADB:

```powershell
adb devices
```

3. Install the Appium UiAutomator2 driver:

```powershell
npm run appium:install-uiatomator2
```

4. Start Appium in one terminal:

```powershell
npm run appium:start
```

5. Run the Android scenarios in a second terminal:

```powershell
npm run test:android
```

The emulator must have Chrome installed. The Android flow uses coordinate-based interactions, so display size and Chrome state can affect the test.

## Reports and Artifacts

Cucumber HTML reports are written to:

- `reports/api-cucumber-report.html`
- `reports/web-cucumber-report.html`
- `reports/mobile-cucumber-report.html`
- `reports/android-cucumber-report.html`

Playwright writes its HTML report to `playwright-report/`. Open it with:

```powershell
npx playwright show-report
```

Playwright traces are collected on the first retry. Test output and screenshots are stored under `test-results/` when produced by the runner.

## Project Layout

```text
api/       API features, services, hooks, mock server, and support code
android/   Android/Appium features, steps, and support code
mobile/    Mobile browser features, page objects, steps, and support code
web/       Web features, page objects, steps, hooks, and support code
core/      Shared Playwright abstractions
fixtures/  Playwright fixtures
tests/     Playwright test specs
utils/     Shared utilities
```

## Troubleshooting

- If Playwright reports a missing browser executable, run `npx playwright install`.
- If Android tests cannot connect, verify the emulator is running, `adb devices` lists it, and Appium is listening on `APPIUM_HOST:APPIUM_PORT`.
- If web tests navigate to `undefined`, set `BASE_URL` in `.env`.
- If API tests unexpectedly call the hosted service, set `API_BASE_URL=http://localhost:4010` after starting the mock server.
- If mobile tests open the wrong viewport, set `DEVICE` to a Playwright device profile such as `iPad`, `iPhone 12`, or `Pixel 5`.