# CISO Simulator

A dependency-free, single-player cybersecurity management strategy game. Lead a fictional organisation through a 12-month mandate.

## Play locally

Open the project with a local static web server, e.g. `python -m http.server 8000`, then visit http://localhost:8000. No build, account, database or API keys required.

## Gameplay

- Four industries, three difficulty levels, seeded scenario selection from 14 fictional scenarios.
- Ten permanent security controls, five staff roles with recurring payroll, six repeatable initiatives.
- Three management actions per month, a mandatory event with three response options, incident costs and risk mitigation.
- Security, compliance, productivity, board trust and morale metrics with weighted score.
- Monthly board funding, payroll and operational drift, early failure conditions and end-of-year assessment.
- Versioned browser-local saves, responsive UI, decision log and JSON board report export.

All costs are fictional USD thousands. This is an educational simulation, not real-world regulatory or incident-response guidance.

## Tests

Run `node test.js`. The deterministic engine tests cover validation, budget and action constraints, duplicate decisions, immutable transitions, repeatability, monthly progression and 300 baseline campaigns plus 1,200 mixed-strategy campaigns across all industries and difficulties. Every scenario response and its mitigation are exercised. To run browser smoke tests: `npm install --no-save --package-lock=false --ignore-scripts playwright@1.56.1`, `npx playwright install chromium firefox webkit`, then `node browser-test.js`.

## Deployment

This repository contains static files. Vercel builds the static app using `vercel.json`. The build runs engine tests and copies only the public assets into `site/`. GitHub Actions independently runs cross-browser regression tests.

## Privacy

No tracking or remote requests. Progress remains in localStorage on the current browser. Exported reports are generated locally. No sensitive information is required.
