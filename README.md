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
| `MOBILE_DEVICES` | Comma-separated profiles assigned to parallel Cucumber workers | Value of `DEVICE` |
| `BASE_URL` | URL used by web scenarios | Required for web tests |
| `APPIUM_HOST` / `APPIUM_PORT` / `APPIUM_PATH` | Appium server connection | `127.0.0.1` / `4723` / `/` |
| `ANDROID_DEVICE_NAME` | Android emulator name | `Pixel_10_Pro` |
| `ANDROID_PLATFORM_VERSION` | Android version | `14` |
| `ANDROID_UDID` | Optional ADB serial for selecting a specific emulator | Not set |
| `ANDROID_PARABANK_URL` | URL opened in Android Chrome | Hosted ParaBank URL |
| `ANDROID_UIAUTOMATOR2_SERVER_LAUNCH_TIMEOUT` | UiAutomator2 startup timeout in milliseconds | `120000` |
| `ANDROID_ADB_EXEC_TIMEOUT` | ADB command timeout in milliseconds | `120000` |

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
npm run test:mobile:devices
npm run test:mobile:devices:headed
npm run test:android
npm run test:android:parallel
```

The Android feature is emulator-independent. Select another AVD by setting `ANDROID_DEVICE_NAME` and `ANDROID_PLATFORM_VERSION`, or use the included examples:

```powershell
npm run test:android:pixel5
npm run test:android:galaxy
```

The AVD name and Android version must match the emulator installed on the machine. The Pixel 5 and Galaxy commands are examples and can be overridden with environment variables when your AVD uses a different name or API level.

To run Android scenarios in parallel, start the three AVDs first and then run:

```powershell
npm run test:android:parallel
```

This starts one Appium server and one Cucumber process per configured emulator. The default configuration targets `Pixel_10_Pro` on `emulator-5554`, `Pixel_6` on `emulator-5556`, and `Pixel_10` on `emulator-5558`, using Appium ports `4723`, `4725`, and `4727`. Override the definitions when your AVD names or serials differ:

```powershell
$env:ANDROID_DEVICES = "Pixel_10_Pro:emulator-5554:14:4723,Pixel_6:emulator-5556:17:4725,Pixel_10:emulator-5558:14:4727"
npm.cmd run test:android:parallel -- --tags @chrome
```

Every emulator must have a unique ADB serial and Appium port. Use `adb devices` to confirm the serials before running.

The headed mobile commands set `HEADLESS=false`. The parallel mobile commands run independent Cucumber workers. To run the same scenarios across multiple Playwright mobile profiles, use `test:mobile:devices`; it assigns workers to `iPad`, `iPhone 12`, and `Pixel 5`. You can provide a custom comma-separated profile list and matching worker count:

```powershell
$env:MOBILE_DEVICES = "iPad,iPhone 12,Galaxy S9"
npm.cmd run test:mobile -- --parallel 3
```

Each scenario creates its own Cucumber World and browser context, so scenarios can run independently.

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
npm run appium:start:android
```

The Android scenarios use Appium's `mobile: deepLink` command for Chrome launch, so the standard Appium server is sufficient. The older `appium:start:android` command remains available for other tests that explicitly require ADB shell access.

5. Run the Android scenarios in a second terminal:

```powershell
npm run test:android
```

### Pixel 10 Pro Fold (Android 16)

The Pixel 10 Pro Fold AVD is supported with these properties:

```text
AVD name: Pixel_10_Pro_Fold
Display name: Pixel 10 Pro Fold
Android: 16 (API 36.1, Baklava)
Image: Google Play x86_64
```

Start the already-created `Pixel_10_Pro_Fold` emulator, confirm its ADB serial, and run the dedicated command:

```powershell
adb devices
npm run test:android:fold -- --tags @chrome
```

The dedicated command uses `ANDROID_DEVICE_NAME=Pixel_10_Pro_Fold` and `ANDROID_PLATFORM_VERSION=16`. If more than one emulator is connected, select the Fold explicitly by setting its ADB serial:

```powershell
$env:ANDROID_UDID = "<pixel-10-pro-fold-adb-serial>"
npm run test:android:fold -- --tags @chrome
```

Chrome is launched automatically at `https://parabank.parasoft.com/parabank`. Override the URL when required:

```powershell
$env:ANDROID_PARABANK_URL = "https://parabank.parasoft.com/parabank"
npm run test:android:fold -- --tags @chrome
```

The emulator must have Chrome installed. The Android flow uses coordinate-based interactions, so display size and Chrome state can affect the test.

If PowerShell cannot find `adb`, add the Android SDK `platform-tools` directory to `PATH` or use the full path to `adb.exe`. The default Windows location is usually `%LOCALAPPDATA%\Android\Sdk\platform-tools`.

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

Mobile visual baselines for M15 can be generated or verified for the configured mobile projects with:

```powershell
npm run test:mobile:visual
npm run test:mobile:visual -- --update-snapshots
```

Snapshots are stored under `tests/__snapshots__/` by device project. Account balances and transaction dates are masked before comparison.

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