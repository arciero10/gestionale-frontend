# Mobile release candidate 1.0 (1013)

## Completed real-client authorization checks

On the existing Pixel 8 emulator, using the normal installed Angular/Capacitor
client and personal Microsoft authentication:

- The administrative identity entered the native administration area without a
  community membership and loaded the real parish list.
- After full native logout and personal-account login, Home V5 was shown with the
  existing personal community. No membership or privilege changes were performed.
- The ordinary account made a real GET `/api/admin/parishes` through the existing
  CurrentUserService HttpClient, including the normal authentication interceptor.
  Azure TEST returned HTTP 403.
- The current verified profile belonged to the personal account, was ready and
  authenticated, and had no global platform roles.
- Direct navigation using the app Router to `/mobile/admin` resulted in
  `/forbidden`; navigation back to `/mobile/home` succeeded.
- The prior administrative component had no remaining instances or parish,
  community or editor state after account change. The current profile had no
  reference to the previous administrative account.

DevTools was used only to invoke the existing client service and inspect boolean
outcomes. No bearer token, OTP, request headers, native cache or private account
identifiers were retrieved or exported. The loopback debugging connection was
closed. This demonstrates application-state isolation, not forensic erasure of
every OS memory page or a new independent Keychain audit.

Backend compatibility: TEST revision `ca-gestionale-api--ga90304af`. No backend,
Azure, database, identity, invitation or community-data changes in this release.

## Presentation-only changes

- 22px mobile card corners, softer token-derived shadows and translucent surfaces.
- Lighter Home photo overlay while retaining text contrast and existing pictures.
- Consistent community-area, member, calendar, profile and administration cards.
- Existing palette, safe areas, navigation, text, logo animation and login unchanged.
- Styling is scoped to mobile hosts; no legacy web feature was added.

## Verification and distribution boundary

Local verification: mobile authentication, platform-role, invitation, completion,
iOS configuration, Home V5 and mobile-admin TypeScript suites; deployment gates;
Angular production build; complete browser fixture suite with 320/390/412px
views, iOS/Android, authorized/denied states, account switching, CRUD contracts,
rounded-card assertions, theme contrast, image loading and overflow checks;
Capacitor Android/iOS sync; Android debug build and Kotlin unit tests.

Physical iPhone verification of the restyling and this release is still required.
Native Swift/Xcode tests and signing must be verified in the macOS workflow.
The signed workflow must use `publish_testflight=true`, `upload_testflight=false`
and `build_number=1013`. Build 1012 already appears in workflow history.

No Azure deploy, App Store upload, external beta distribution or public review
submission is authorized by preparing this artifact. Check the actual workflow
conclusion and signed artifact before calling the iOS build complete.
