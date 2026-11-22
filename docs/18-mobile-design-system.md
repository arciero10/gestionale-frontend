# Mobile navy and gold

## Home V4

Home has exactly two primary cards: La mia comunita -> /mobile/community-life
and Convivenze -> /mobile/retreats. The greeting now says Benvenuto in comunita.
The profile reminder remains functional below the primary navigation.
The community hub is titled La mia comunita and contains horizontal links to
Fratelli (/mobile/community, preserving its compact dashboard/full directory),
Calendario, Gruppi, Compleanni and Avvisi. Retreats keeps the existing module
URLs and CREATE_CONVIVENZA check for places, with Gestione convivenze as label.

Actual source directory is public/images/backgrounds, not public/layout/images.
Camino_Neocatecumenal_virgen_maria.jpg is the cover background on the Home shell
only; a pale overlay and readable content surfaces protect text contrast.
The two Home photos are censimento-comunita-bg.jpg and convivenze-bg.jpg,
with dark caption overlays. Internal rows use a thumbnail on a white text
surface: census for brothers, jubilee for calendar, assembly for retreats and
places for accommodation. Groups/birthdays/notices use neutral icon tiles:
no unrelated or random photos. Original files are never overwritten.

scripts/prepare-mobile-backgrounds.mjs uses development-only sharp to generate
960px WebP renditions under public/images/backgrounds/mobile. Combined output
is about 380KB versus about 4.6MB of source photos; Home picture elements also
retain the original JPEG fallback. The Virgin source is already small (252KB).
Bottom tabs remain Home/Calendario/Comunita/Profilo as stable shortcuts: the
community tab still opens the existing dashboard directly, without removing
member management or changing routes/permissions. Auth and API are untouched.

## Macro areas V3 and native icons

Home keeps the real personal summary above three primary links: community,
community life and retreats. The duplicated small quick-link grid is removed.
/mobile/community-life is a navigation-only hub for calendar, groups, birthdays
and notices. /mobile/retreats links to the existing /mobile/convivenze module
and to places only with CREATE_CONVIVENZA. Existing guards and module URLs stay
unchanged. No Organization placeholder or invented backend data is introduced.
The retreat photo is the existing assets/images/dashboard/convivenze.jpg.
Profile and bottom navigation retain their existing structure.

Native launcher artwork is rasterized from public/layout/images/logo/logo-cn.svg,
the original vector matching the web favicon, not the legacy GC favicon under
src/assets. Web favicon files are untouched. scripts/generate-native-icons.mjs
requires sharp as development-only tooling (NODE_PATH may point to a tooling
installation), and produces five Android density sets and the existing modern
universal 1024px opaque iOS icon. Adaptive foreground uses a 60dp symbol in a
108dp layer on the existing white background, inside the central safe circle.
No additional text is added to the emblem. Package/bundle IDs and associated
domains are unchanged. Actual iOS compilation still requires macOS/Xcode.

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
