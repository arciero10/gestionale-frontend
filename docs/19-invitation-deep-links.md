# Invitation HTTPS deep links

Canonical URL: https://test.eventidicomunita.it/invite/PUBLIC_ID (real public GUID).
Email button and plain-text fallback use the same canonical URL. Old root
?inviteId=GUID links continue to be captured by the website. No auth token is put
in the new path. Invite paths are public but never expose Person data before JWT.

## Angular and native lifecycle

invitation-link.ts validates exact trusted HTTPS origin, GUID and supported paths;
it rejects foreign hosts, userinfo, fragments and ambiguous inviteId parameters.
InvitationDeepLinkService owns one Capacitor appUrlOpen listener and getLaunchUrl
for cold start. The browser captures its own current path/query before bootstrap.
Pending GUID uses the existing sessionStorage key, one-hour TTL. Auth cleanup
preserves only that hint and its original expiry, never auth secrets. This is not
an authorization source; there are no native credentials in this store.

Unlinked and already linked accounts resume /invite/ID before default Home.
Native invite login selects the existing OTP UI; SDK protocols, Entra scopes,
client/tenant IDs, biometrics and auth callbacks are unchanged. A browser-auth
fallback callback now ignores unrelated HTTPS invite events.
The user explicitly confirms the existing privacy acknowledgment before accept.
GET/POST existing onboarding invitations endpoints enforce JWT email, expiry,
cancellation and compatible Person/User linkage. Success refreshes /api/me then
opens /mobile/community (web: existing dashboard). Old embedded onboarding stays
compatible. Terminal states or explicit dismissal clear the pending hint.
Replayed acceptance remains server 409 with no duplicate Person/membership.

## Android TEST

Manifest: separate autoVerify VIEW/DEFAULT/BROWSABLE filter for HTTPS host
test.eventidicomunita.it and pathPrefix /invite; msauth filter is preserved.
public/.well-known/assetlinks.json uses android_app, package
it.panteleia.eventidicomunita, and the ACTUAL current debug certificate SHA-256:

7F:69:D3:1F:D6:8C:85:D5:A2:2C:E2:02:A0:5E:EC:9D:C4:7F:17:4F:E5:7B:72:49:A8:D6:D7:FF:C0:C9:AA:B5

Derived with keytool from the local ~/.android/debug.keystore / androiddebugkey.
This is TEST/debug only. No release signing configuration or release fingerprint
was found. For production use the actual release/Play App Signing SHA-256, not
this debug certificate, and configure the actual production domain separately.

After website deploy and installation:
```powershell
adb shell pm verify-app-links --re-verify it.panteleia.eventidicomunita
adb shell pm get-app-links it.panteleia.eventidicomunita
adb shell am start -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://test.eventidicomunita.it/invite/REAL_TEST_PUBLIC_ID"
```
Do not force an approval state with pm set-app-links, clear application data or
bypass biometrics. Verify the implicit VIEW resolves to MainActivity, not Chrome.

## iOS: Team ID required

App/App.entitlements contains applinks:test.eventidicomunita.it and is referenced
by both Xcode build configurations. Existing SceneDelegateProxy already forwards
userActivity for Universal Links/cold start. No callback implementation replaced.

No DEVELOPMENT_TEAM, provisioning profile or Apple signing certificate was found
locally. AASA is deliberately valid but DISABLED: applinks.details=[] (no fake appID).
Universal Links are NOT ready/verified until the real signing identifier is known.
Find Team ID under Apple Developer > Account > Membership details, or Xcode >
Signing & Capabilities > Team. Verify signed application-identifier prefix too.
With the real ten-character Team ID, run:
```powershell
node scripts/configure-ios-universal-links.mjs REAL_APPLE_TEAM_ID
```
This generates the actual TEAM.it.panteleia.eventidicomunita appID with paths
/invite/* only. Commit/publish that file; no placeholder is shipped. Enable
Associated Domains for the App ID in Apple Developer, select the real Team in
Xcode, regenerate the profile and sign/install on an iPhone. Check entitlement
application-identifier matches AASA. Xcode/real-device build cannot run on Windows.

Tap the HTTPS invitation from Mail/Notes on device, both killed and running app.
On a correctly signed simulator build: xcrun simctl openurl booted HTTPS_INVITE_URL.
Typing a URL into Safari or staying on the same website is not proof of universal
link handling. Account for Apple CDN caching; follow Apple's debugging guide.

## Azure hosting

Angular explicitly copies public/.well-known to output .well-known. SWA excludes
/.well-known/* from SPA fallback and serves the two association files anonymously
with application/json, no redirects. Extensionless AASA is intentional.
Live SWA ignored a Content-Type override on the extensionless file, so its route
internally rewrites to apple-app-site-association.json. The public Apple URL
remains extensionless and returns 200, not a redirect. The iOS configuration
script generates both identical copies; do not edit only one of them manually.
Check live HTTPS status, MIME and content after Actions deploy; static local
tests alone do not prove domain verification on Android/iOS.

## Verification and limitations

test:invitation-links covers parser/TTL/auth-cleanup, cold/warm bridge and duplicate
events. Browser suite covers native OTP->invite->accept->community, terminal/error
states, untrusted event rejection and anonymous web fallback. Existing auth and
membership tests remain. No real invitation accepted or real email sent by tests.
No new migration or backend endpoint; only the backend URL builder changes.

References: https://capacitorjs.com/docs/guides/deep-links
https://developer.apple.com/documentation/xcode/supporting-associated-domains
https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links
https://learn.microsoft.com/en-us/azure/static-web-apps/configuration
