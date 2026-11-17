# Scoped deployment and Chromium release gate

GitHub `kaj-jensen/cumbuco-net-br` on `codex/initial-build` owns Cloudflare Worker `cumbuco-net-br`. Production is https://www.cumbuco.net.br.

The Browser checks workflow runs source scans, locked dependency checks, repository checks, the production build and desktop/mobile Chromium before giving the deployment job its Worker-only `WEBSITE_DEPLOY_TOKEN`. Fork and Dependabot pull requests cannot deploy. Preview children have no production email, database, rate-limit or secret bindings. The private dashboard retains its Access issuer/audience and rejects unauthenticated requests.

Production uploads and activates a Worker version, preserving externally configured routes, schedules, Access and workers.dev exposure. The workflow checks the exact current source commit and deploys the exact browser-tested asset artifact. Changes to routes or schedules require separately applying those hosting settings. Live browser verification never submits enquiry data.

Use `npm run deploy` to dispatch the gated production workflow. No notification sender, PR comment bot or schedule is added. Existing credentials are retained for recovery and are not used by this workflow.
