# Global administrator UI release - TEST only

Code preparation, not deployed. No native login, Home V5 or workflow gate changes.

The authoritative global capability is authenticated /api/me.platformRoles
containing GLOBAL_ADMIN, with non-INACTIVE account status. Community role,
isOnboardingAdmin, email, localhost, localStorage and TEST hostname are not global
grants. PlatformAdminAccess and the post-login admin destination use that same
predicate. No separate Android/iOS UI or identity is created.

An unlinked global admin has no community-association warning. A verified narrow
onboarding admin sees a scoped approvals notice but is not made GLOBAL_ADMIN.
Ordinary pending/unlinked messages and member Home V5 remain unchanged. UI is
not an authorization boundary: administrative API requests always require the
backend JWT global policy. Legacy direct test pages cannot obtain protected data
without it, even if a route itself remains loadable.

Publish only after the separately approved backend restricted candidate passes
real admin and personal-account tests. Read the backend global-admin-test-release
runbook. TEST still requires independent environment approval and a dedicated
TEST deployment secret; neither can be bypassed. This source push performs CI
only, not Azure or TestFlight distribution.

For a refresh/direct admin URL, the existing root session/profile verification
must finish before admin access. Missing/failed /api/me is not a global grant.
Backend role revocation denies the next API call even if an already loaded menu
has not refreshed. Refreshing /api/me removes the UI capability; local storage
is not an authorization cache or recovery mechanism.

Validation: six role/banner tests, eighteen post-login/root safety checks and
the existing auth/deep-link/iOS-configuration/Home/distribution/gate suites pass
(84 unit checks total). Production build and full browser regression pass with
fixture SDK/API for iOS, Android and web. No real-device or live granted-admin
test is claimed. The workflow change only adds this security suite to CI;
manual-only deployment approvals and all publication gates remain unchanged.
