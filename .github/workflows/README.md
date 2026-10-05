App checks runs on every push, pull request, and manual dispatch.

The single check installs locked dependencies, builds and tests the backend,
checks frontend TypeScript, and bundles Expo for Android, iOS, and web.
Tests use a mocked user model; no Atlas credentials or GitHub secrets are needed.

Commit and push ci.yml to enable it. GitHub shows a green check on a commit
after its workflow succeeds, a pending indicator while it runs, or a failure
indicator if a check fails. Open the repository's Actions tab to inspect logs.
