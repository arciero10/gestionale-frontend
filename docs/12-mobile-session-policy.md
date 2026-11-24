# Mobile access revision: baseline analysis

Baseline 1009 uses one Angular welcome, Home V5 and mobile shell on both OSes.
Startup configures MSAL once, restores the account and immediately displays
the unlock panel when an account exists. App background locks the SDK and
clears the backend context; protected root outlet requires verified /api/me.
iOS uses deviceOwnerAuthentication; Android uses BiometricPrompt with device
credential. OTP and cache/refresh stay owned by the official Microsoft SDKs.

Unlock currently retrieves an API token before setting the Angular outcome,
then /api/me's interceptor retrieves it again. These sequential calls are not
covered by the existing in-flight token single-flight mechanism.

There is no protected full-authentication age record or snapshot shield yet.
The web login and role/membership model must remain unchanged.

## Conservative implementation decisions

- Welcome first, including a restored account: restore never grants access.
- Access starts the OS prompt, or the existing email/OTP panel if not reusable.
- Cancelled biometrics do not silently switch accounts or delete SDK cache.
- Full-authentication age defaults to 30 days, bounded by provider policy.
  A native, account-bound protected record is updated only by completed MSAL
  authentication, not local unlock or refresh. Missing/invalid/rolled-back
  records fail closed to Microsoft authentication. This local upper bound
  is NOT a replacement for backend JWT validation or revocation enforcement.
- Keep one /api/me request on each successful unlock. No persistent profile
  authorization, and no offline route access. In-memory context leases are
  deferred until revocation/freshness semantics have been measured and agreed.
- Remove duplicate prefetch, not server verification. A one-second target
  depends on actual OS verification and network latency and is not guaranteed.
- Native snapshot protection must conceal personal UI during inactivity.
- Stress tests use mocks only; physical Face ID/Touch ID/device credentials
  require device testing and must never be reported as tested via mocks.

## Implemented policy and rollout

MOBILE_REAUTHENTICATION_DAYS in entra-settings.ts configures 1..30 days;
both native plugins reject values outside that bound. iOS stores an account-
bound receipt in Keychain WhenPasscodeSetThisDeviceOnly. Android encrypts its
receipt with AES-GCM and a non-exportable AndroidKeyStore key; the account ID
is authenticated additional data. No receipt/token/identity is logged.
Only the SDK full sign-in completion writes authenticatedAt. Unlock and token
refresh preserve it. Logout clears only this receipt and the SDK account.
Missing receipts (including upgrade from 1009), corruption or clock rollback
require Microsoft authentication. A first OTP after this upgrade is expected.
If protected persistence is unavailable, only the current full-authenticated
process can proceed; a cold restore requires OTP. The OS gate is never skipped.

Background clears the visible server context, invalidates the completion key
and returns to Welcome. Late profile callbacks cannot restore an old UI.
Apple inactivity shields the window for app-switcher snapshots. Android uses
FLAG_SECURE, also disabling screenshots/recording (intentional privacy tradeoff).
OS credential handling is unchanged: Apple deviceOwnerAuthentication, Android
BiometricPrompt strong + device credential on API 30+, legacy-supported weak
+ device credential below API 30. No custom PIN form or PIN collection exists.
Biometric enrolment changes remain subject to OS ownership/device credentials;
they do not renew the full-authentication receipt.

## Local verification and performance

- TypeScript auth/security/stress tests: passed, including 100 unlocks,
  500 lock/unlock cycles and 20 recreated JS sessions (SDK/API mocks).
- Browser Android/iOS/web: passed with Welcome first, one prompt on double tap,
  warm background return, logout/account switch and provider/local-unavailable
  fallbacks. Root remains blocked on profile failures.
- Android Kotlin policy unit tests, app unit tests and assembleDebug: passed.
- Android assets verification: passed (329 files); final bundle/hash are
  reported by android:verify-assets, not hardcoded into the policy.
- Mock warm access to visible Home: 64..87 ms across local runs
  (latest: Android 73 ms, iOS 64 ms).
  These numbers exclude real OS biometric latency/network and are NOT phone
  measurements. No physical before/after baseline is available.
- Ordinary auth path: 1 GET /api/me, no duplicate token prefetch (previously
  2 sequential token SDK calls; now 1 before profile). The Home then starts
  its existing birthday/calendar calls: measured total 3 API calls for MEMBER;
  privileged approval summary may add one. Provider refresh traffic is SDK-
  dependent; zero provider requests is not guaranteed.
- Native device tests remain pending: no ADB devices were attached. User will
  test iPhone through TestFlight. Touch ID and Android physical credentials
  have not been exercised by these automated tests.

## Files

- src/app.ts: Welcome entry, locked root guard and stale completion handling.
- src/app/auth/mobile-auth.service.ts, entra-native-core.ts, entra-settings.ts:
  access single-flight, one token request, policy configuration and lock epoch.
- src/app/auth/mobile-welcome.ts and .html: busy state and safe feedback only.
- src/app/auth/native-auth-panel.ts: an OTP result requiring local unlock
  returns to Welcome instead of forcing the old intermediate panel.
- src/app/auth/native-auth-diagnostics.ts: safe unlock/token references.
- native/entra-native-auth/ios/Sources/EntraNativeAuthPlugin/
  EntraNativeAuthPlugin.swift, NativeAuthDiagnostic.swift,
  FullAuthenticationPolicy.swift: native policy, shield and receipt.
- native/entra-native-auth/android/src/main/java/it/panteleia/entranativeauth/
  EntraNativeAuthPlugin.kt, FullAuthenticationPolicy.kt: native gate/policy.
- android/app/src/main/java/it/panteleia/eventidicomunita/MainActivity.java:
  snapshot protection; native plugin build.gradle: JUnit test dependency.
- Tests: mobile-auth.test.ts, auth-completion.test.ts, native-auth-ios.swift,
  mobile-welcome.browser.cjs, FullAuthenticationPolicyTest.kt.
- scripts/test-ios-msal-configuration.mjs: receipt write-site and age bounds.
- member-invitation.test.ts: removed existing personal-data debug log only;
  no invitation functionality changed or introduced.
