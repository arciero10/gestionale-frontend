# Mobile navy and gold

## Home, community and profile V2

Home header reads ParishName and CommunityName from /api/me, in that order.
The editorial photo has no text overlay; a separate navy community CTA uses
the backend member count. Personal summary shows only available calendar events,
own assignments and upcoming birthdays. Notices have no API yet and are not
invented. Quick links keep explanatory subtitles and a single navy/gold palette.

The fourth tab is Profilo (/mobile/profilo); /mobile/altro is a legacy redirect.
Profile settings link to /mobile/account, personal membership (approval management for authorized actors only),
notification preferences, help and /mobile/informazioni (independence disclaimer).
Existing profile editing, privacy, logout and refresh remain available.

/mobile/community is the compact dashboard. /mobile/community/members retains
the existing full directory, search, member detail and management actions.
Preview includes at most six members, horizontal avatar rails, responsible and
co-responsible roles, three privacy-filtered upcoming birthdays and only pending
actionable requests matching the current parish/community. Approval history is
kept on its existing page. Counts derive from actual API results, not demo data.
Couples load on demand from existing member detail spouse projections, with
four concurrent reads maximum and unordered-pair deduplication. No inferred
relationships from surnames or contacts; no new endpoint or storage cache.

Backend inspected read-only: Community -> Parish exists; Diocese/Sector and
community Groups are not exposed by the current model/API. No new hierarchy,
fake groups, schema change or migration is introduced. Group quick link keeps
the existing honest unavailable view until real data exists.

## Welcome V2

Native welcome keeps the existing full-bleed photo with navy overlay, serif brand
and one gold CTA. Normal: Accedi + email-code microcopy. Pending invitation: the
same component shows generic invite copy + Continua, without recipient metadata.
No icon, registration CTA, demo/FAQ links, bordered access panel or copyright row.
Footer: Un progetto PANTELEIA - APS / Applicazione indipendente.
The root view selects the already-existing OTP UI preference for Accedi; SDK,
NativeAuthPanel and auth services/configuration are not modified. An invitation
now displays its dedicated welcome before the user chooses Continua. Existing
post-login routing, invitation API/linking and locked-session UI are unchanged.
Signup/password/reset SDK tests remain even though signup has no welcome CTA.

UI-only theme and navigation. Backend, auth flows, API, models and
invitation/privacy/import logic are unchanged. Global CSS is scoped to app-mobile-shell,
app-mobile-welcome and app-native-auth-panel; desktop styles retain their values.

## Tokens

src/assets/mobile/_tokens.scss centralizes navy #1F264B / #1C2242,
gold #B79A46 / #D7B96A, background #F5F6FA, white surfaces, text #212529,
secondary #667085, semantic success/warning/danger, borders, focus, radius,
shadow, 4/8/16/24/32 spacing and font stacks. Components consume variables.
Gold #756021 is the accessible text/focus variant on light surfaces; bright
gold is decorative or uses dark navy text, never small gold text on white.

## Typography and visuals

System stack for controls, names, lists and body. Cinzel is preferred only if
already installed; Palatino/Book Antiqua/Georgia are the intentional serif
fallback for brand and special headers. No Google Fonts requests, new font
binaries or official logos. White/black alpha colors and navy gradient stops
in the existing welcome photo are the documented compositing exceptions.

Header navy/white with a gold divider and circular initial. Bottom tabs remain
Home/Calendario/Comunita/Profilo; active uses navy and a thin gold indicator.
Home uses existing next-event/assignment data and upcoming birthdays, omitting
unavailable notices from the personal summary. Permission-gated places remain.
Profilo links to app information with the independent-app disclaimer.
Community/member/birthdays/calendar/invitations/import share surfaces and focus.
Import stepper is derived from existing draft status, not a new workflow.

## Accessibility and verification

44px minimum action target; safe-area insets remain, form fields 16px to avoid
iOS focus zoom, text wrapping and reduced-motion handling. Existing privacy
filtering is untouched. Gold marks relevant calendar entries and today's
birthday without being the only indicator (existing labels remain).
Run production build and tests/mobile-welcome.browser.cjs for responsive
Android/iOS mocks and unchanged desktop routes. The shared theme assertions
check computed header/nav/button values, focus, overflow and touch sizes.
Screenshots are written under dist/mobile-welcome-check (not committed).
