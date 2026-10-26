# Revision 3 verification

- PASS — 10 inherited rules + 7 asset/presentation/integration tests.
- PASS — all 205 glTF models: skins, UVs and seven actions; all hero exports include embedded surface images/normal maps.
- PASS — 69 native reference scenes reopened and 1,428 character action deformations measured; boss native file reopened with 22 bones and seven actions.
- PASS — desktop and mobile-size Chromium gameplay, rewards, local save reload, summoning, full formation, no horizontal overflow and WebGL fallback.
- PASS — five principal generals, seven viewer poses and five signature effects.
- PASS — real anonymous Auth, private cloud RLS, rejected foreign writes, revision conflicts, one-time transfer and replay rejection.
- PASS — actual browser cloud upload/reload, both conflict choices with backup, mobile transfer UI. No original-game tables were written.
- PASS — guild message read/write isolation and feedback insert checked inside transactions that were rolled back. No test chat messages were published; scoped application test records were removed afterward.

Software WebGL verifies functionality/layout, not physical-phone GPU FPS. Auto render quality is bounded and tested, but real hardware still needs hands-on review. These remain stylized interpretations; no exact artistic likeness certification is claimed.

## Detailed geometry release (native revision 4 / renderer cache revision 5)

All 204 character evolution meshes have section-built faces, swept locks and added
costume/weapon geometry. 69 numbered native scenes reopened successfully; 1,428
actual vertex-deformation action checks and 207 spell-axis checks passed. The boss
and effect-only sheet 69 retain their prior geometry. Seven red-crest material
corrections independently preserve geometry, bone layout and weights (see root
`docs/crest-color-validation.json`).

All 17 Node checks pass with the new GLBs and corrected reference mapping. The core
desktop/mobile browser test passes, including victory/rewards, reload/save, summon,
full formations and fallback. Melee movement still reaches contact and returns at
x1/x2/x3 on both sides; ranged position is unchanged. Six representative revised
models load with seven clips and no page errors. Native studio renders and runtime
screenshots are separate evidence. Artistic likeness is **NOT_APPROVED**; these are
procedural interpretations with shared construction. Physical-phone GPU/FPS is
**NOT_CHECKED**. Existing online/API checks are from the prior online release;
this asset-only update does not change the backend or save schema.

## Per-character skill release (effects revision 1 / renderer cache revision 6)

- All 65 recipes (64 heroes + boss) match the game's skill names and have distinct
  cast/travel/impact/count combinations. All construct finite geometry and release
  resources. Node verification: 10 inherited combat tests + 11 presentation/asset tests.
- All 65 effects rendered in an isolated real-WebGL harness. After each effect only
  the two harness floor/grid geometries remained; after director disposal no textures
  remained. Maximum observed effect-only counts: 112 calls and 12,410 triangles.
  These are bounded scenario counts, not a physical-device FPS benchmark.
- Separate actual-game test: nine representative viewers including the boss; named
  button wiring, cast/release/impact, tier 3, multi-target battle action/hit bridge,
  unchanged save state, mobile reduced-motion playback and no page errors.
- Core desktop/mobile regression and x1/x2/x3 melee contact/return checks pass. Online
  code, save schema and native rigs are unchanged; online tests were not repeated.
- All-skill stills use the effect-only harness. `skills/game-*.png` and the Guan Yu GIF
  are actual game renders. Effects are stylized procedural interpretations, with
  shared geometric generators and individual recipes, not exact copies of the art.

## UX/UI revision 7

Browser layout checks pass at 320×568, 390×844, 768×1024, 1280×900 and
844×390: no horizontal document overflow, navigation separated from scroll content,
44px+ primary/touch targets, 12px+ unit names, wrapping skill hint, zoom/reset and
secondary-pose disclosure. Small phone battle models project at least 90px high in
the 390px-wide three-unit scenario. Full 6-vs-5 checks keep all feet above the action
panel and labels inside the field without label-rectangle overlap. Tab/Shift+Tab
skips collapsed poses and reaches expanded poses; Escape closes the dialog.

Core progression/save/summon/fallback, melee x1/x2/x3 and actual-game skill previews
pass after UI integration. Landscape rendering was separately inspected after
resize/reset/disclosure; resize now draws immediately, and model loading paints
before dismissing its loading indicator. Real-device touch/FPS/notch are NOT_CHECKED.
Screenshots used for position checks pause playback after dismissing the intro.
