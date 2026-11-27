# Mobile parish search and admission

## Implemented

- Native parish suggestions normalize accents, punctuation and common saint
  abbreviations; show stored address and distinguish same-name parishes.
- Community dropdown contains real per-parish records only, sorted by number.
  An explicit uncensused-number request replaces fabricated number options.
- Native declared roles are MEMBER, RESPONSIBLE, CO_RESPONSIBLE. Declarations
  grant no membership or permissions. Existing domain/service roles are retained.
- Pending onboarding shows own request, missing approver/census, personal data
  and reviewer message. It does not mount private community lists.
- Missing parish reports create only a non-official report, never a Parish.
- /mobile/admin/approvals uses the protected global API for the five request
  categories, filters, detail, person matching, verification, reason and explicit
  confirmation. Parish reports can be linked to an existing verified record.
- /mobile/admin/responsibles and /mobile/admin/delegations share an operational
  native screen for existing community members, reasoned role changes and
  explicit co-responsible permissions. No global role can be changed here.
- Approval shortcuts no longer treat isOnboardingAdmin as a global capability.
  Backend GLOBAL_ADMIN remains required without inventing admin membership.
- Late async responses are ignored after actor/context changes or destruction;
  component data is cleared when leaving. No local storage of applicant records.

Home V5 layout, imagery, palette, animated logo, auth/session primitives and the
ordinary web destination are not redesigned. Shared approval form changes only
support the backend decision-reason contract; no web administration panel added.

## Compatibility and release

Deploying this code alone against ga90304af does not make the new API routes
available. Coordinate the new backend and mobile build under existing manual
release gates. No Azure deploy, TestFlight upload, real invite, parish import,
account mutation or census is authorized by these commits.

The official full parish catalog remains blocked by source access/reuse and
missing provenance metadata. Per-request verifier delegation needs an explicit
scoped model proposal, not an onboarding flag or audit-as-permission workaround.
See backend docs/admission-mobile-workflow.md and parish-catalog-import-gate.md.

## Reproducible local checks

Run all scripts/test-*.mjs auth, invitation, platform role, mobile V5/admin suites,
npm run build and node tests/mobile-welcome.browser.cjs (no flow filter).
The full browser suite uses synthetic API/native adapters, including Android and
iOS global review/revocation, real-record suggestions and number 501 census.
It does not prove real-user approval or PostgreSQL behavior on Azure.

Run npx cap sync android, npx cap sync ios and Android assembleDebug plus
testDebugUnitTest / entra-native-auth-plugin:testDebugUnitTest with JDK 21.
macOS ios-testflight.yml with publish_testflight=false and upload_testflight=false
validates Swift/Xcode only, without uploading or distributing a new build.
