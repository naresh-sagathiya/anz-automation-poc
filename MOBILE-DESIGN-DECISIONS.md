# Mobile automation design decisions

This document is the evidence map for the mobile checklist in the delivery brief. The
mobile suite is the Cucumber suite under [`mobile/`](./mobile/); the Playwright visual
suite is under [`tests/`](./tests/).

| ID | Status | Evidence |
| --- | --- | --- |
| F1 | Implemented | [`tsconfig.json`](./tsconfig.json) uses `strict` and now compiles `mobile/**/*.ts` and `tests/**/*.ts`; aliases include `@core` and `@fixtures`. |
| F2 | Implemented | [`mobile/pages/`](./mobile/pages/) contains page objects; [`fixtures/mobile.fixture.ts`](./fixtures/mobile.fixture.ts) exposes reusable page components to Playwright tests. |
| F3 | Implemented for updated mobile pages | Assertions are in step definitions; mobile page objects return data/state or perform actions only, including transaction-list uniqueness and URL checks. |
| F4 | Implemented | [`fixtures/banking.fixture.ts`](./fixtures/banking.fixture.ts) and [`fixtures/mobile.fixture.ts`](./fixtures/mobile.fixture.ts) use `test.extend`. |
| F5 | Partial | Playwright visual tests use authenticated setup logic, but a committed per-role `storageState` global setup is still required for production banking environments. |
| F6 | Implemented in updated flows | Role locators are used for navigation and authentication actions; CSS is scoped to stable form names where the application has no accessible labels. |
| F7 | Improved | Removed mobile rotation/navigation hard waits and swallowed waits. Remaining waits are condition-based Playwright waits. |
| F8 | Implemented | [`mobile/config.ts`](./mobile/config.ts) centralises environment URL and credentials; CI passes environment values without source changes. Local defaults are demo-fixture credentials only. |
| F9 | Partial | Offline HAR routing exists in [`mobile/mocks/mobileMocks.ts`](./mobile/mocks/mobileMocks.ts); customer/payee API seeding is not yet connected to mobile scenarios. |
| F10 | Implemented | Credentials are environment variables, `.env` is ignored, and CI runs Gitleaks in [`playwright.yml`](./.github/workflows/playwright.yml). |
| F11 | Partial | [`mobile/config.ts`](./mobile/config.ts) provides redaction for tokens, PANs, and account numbers; failure attachment masking should be added before production data is used. |
| F12 | Partial | Mobile scenarios are tagged (`@smoke`, `@accessibility`, and ID tags); CI currently runs the mobile profile and should add explicit smoke/regression stages. |
| F13 | Implemented for mobile execution | [`scripts/run-mobile-shard.js`](./scripts/run-mobile-shard.js) deterministically partitions feature files and CI runs two independent mobile matrix shards. |
| F14 | Implemented | Cucumber/Playwright retries are controlled by CI and Playwright retries are two on CI, zero locally. Retry-only reporting still needs a result publisher. |
| F15 | Partial | Zod is available for API contracts, but mobile-specific API responses are not all schema validated. |
| F16 | Implemented baseline | Each mobile shard publishes uniquely named Cucumber JSON/HTML; Playwright blob/HTML reports plus trace, video, and screenshot are retained on failure. |
| F17 | Implemented | [`mobile/steps/accessibility.steps.ts`](./mobile/steps/accessibility.steps.ts) runs axe against WCAG 2.1 AA tags for login, dashboard, and transfer journeys. |
| F18 | Partial | [`Dockerfile.api`](./Dockerfile.api) covers API execution; a Playwright official-image Dockerfile is still required for identical mobile browser runs. |

## Verification commands

```powershell
npx tsc --noEmit
npm run test:mobile
npm run test:mobile:visual
npx gitleaks detect --config .gitleaks.toml
```

CI publishes mobile shard JSON, Playwright HTML/blob output, traces, videos, and
screenshots as retained artifacts. Environment-specific credentials must be configured
as GitHub Actions secrets; no credential should be added to `.env.example`.
