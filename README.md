# TFS Core Playwright Tests

End-to-end test suite for Turnitin Feedback Studio (TFS) built with [Playwright](https://playwright.dev/) and TypeScript.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- Access to a Turnitin QA environment (credentials + VPN if required)

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

### Environment variables

| Variable | Description |
|---|---|
| `TII_URL` | Base URL of the Turnitin environment |
| `TII_LOGIN_URL` | Login page URL (with captcha override if applicable) |
| `INSTRUCTOR_USERNAME` / `INSTRUCTOR_PASSWORD` | Instructor account credentials |
| `STUDENT_USERNAME` / `STUDENT_PASSWORD` | Student account credentials |
| `SDK_WRAPPER_URL` | SDK Wrapper REST API endpoint |
| `SDK_WRAPPER_ACCOUNT_ID` | Classic account ID |
| `SDK_WRAPPER_TFSPLUS_ACCOUNT_ID` | TFS+ account ID |
| `PANDA_SUBMISSION_PURGE_URL` | Panda submission purge API |
| `PANDA_SUBMISSION_SEARCH_URL` | Panda submission search API |
| `UPLOAD_DIR` | Absolute path to `src/documents/` on your machine |

See `.env.example` for reference values.

## Running tests

All tests run in Chromium by default (single worker, serial execution).

```bash
# Full suite — headed (visible browser)
npm run test:headed

# Full suite — headless
npm test

# GRAF grading tests
npm run test:graf -- --headed

# Submission / paper assignment tests
npm run test:submission -- --headed

# Single test by title
npx playwright test --headed -g "Instructor grades a GRAF submission"

# Debug mode (Playwright inspector)
npm run test:debug
```

## Project structure

```
src/
├── api/              # REST API helpers (SDK Wrapper, Panda)
├── config/           # Environment config loader
├── documents/        # Test upload files
├── fixtures/         # Playwright custom fixtures (turnitin.fixture.ts)
├── pages/            # Page Object Models
│   ├── base-page.ts
│   ├── login.page.ts
│   ├── top-nav.page.ts
│   ├── breadcrumbs.page.ts
│   ├── instructor-home.page.ts
│   ├── student-home.page.ts
│   ├── class-home.page.ts
│   ├── standard-class.page.ts
│   ├── assignment-info.page.ts
│   ├── modify-assignment.page.ts
│   ├── inbox.page.ts
│   ├── graf.page.ts
│   └── student-portfolio.page.ts
└── tests/            # Test specs
    ├── instructor-graf.spec.ts
    └── instructor-submission.spec.ts
```

## Test suites

| Spec | What it covers |
|---|---|
| `instructor-graf.spec.ts` | Creates a TFS+ LFW assignment, uploads a student submission, grades it in GRAF, and verifies the saved grade. |
| `instructor-submission.spec.ts` | Creates paper assignments (including Korean-language titles/instructions), verifies student visibility, and tests assignment CRUD. |

Both suites create test data via the SDK Wrapper API in `beforeEach` and clean up (destroy classes/submissions) in `afterEach`.

## Reports

After a run, an HTML report is generated automatically:

```bash
npx playwright show-report
```
