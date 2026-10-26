# Samkok 3D edition — revision 3

The original game rules remain authoritative. The web renderer uses Blender-authored rigged GLBs. The native Cocos project is retained for reference; it is not a finished native mobile port.

## Graphics

- 204 hero GLBs and one beast boss; all have a 22-bone rig, UV coordinates and seven independent clips: Idle, Walk, Attack, Hit, Block, Defeat, Victory.
- Woven cloth and engraved-metal color/normal images are packed into native files and glTF. Procedural material sources and UV generation remain in `scripts/build_library.py`.
- Liu Bei's paired swords/topknot, Guan Yu's headcloth/beard/guandao, Zhang Fei's broad face/serpent spear, Zhao Yun's silver-blue armor/white plume, and Zhuge Liang's dark hat/feather fan give the main cast distinct silhouettes. Other heroes still share family construction; likeness has not been artistically approved.
- Five signature effects are actual geometry and can be previewed from the hero viewer. Existing damage, healing and reward calculations are unchanged. Guard reactions reflect low-damage defensive hits; they do not introduce a new damage reduction rule.
- Hero and boss defeat/victory clips are played by battle events. Manual viewer buttons expose all seven clips.
- Standard quality uses desktop directional shadows and mobile contact shadows. Auto quality reduces pixel ratio/shadows when observed frame time remains high, without changing gameplay. Manual quality choices remain available. Physical-phone GPU performance is not verified by the software-rendered browser tests.

## Online

Guest Auth connects to the existing Supabase project, but all 3D data uses separate `samkok3d_*` tables. The original `players`, `saves` and administrative coupon data are not written by this edition. The frontend SDK is bundled locally.

Cloud writes compare revisions atomically. A conflict pauses automatic cloud writes and offers local/remote choices. The replaced side is retained in a dedicated local backup without overwriting the player's three manual save slots. The transfer UI uses an 18-character single-use, hashed capability valid for twenty minutes; replay is rejected. Private save RLS and guild-channel RLS were checked with separate Auth identities.

Guest identity belongs to this browser. Before clearing browser data, export a save or use the transfer mechanism. This is not permanent email/password account recovery or continuous cross-device account linking. Duels against shared player teams are asynchronous, and rankings remain casual client-calculated results. Guilds are open-join groups. The existing local named coupons still work; the upstream administrative coupon RPCs are not enabled.

See [data boundaries and advisor review](../../docs/online-security.md) and the SQL reference files in `tools/sql/samkok3d-*.sql`. For a fresh setup, apply the references in order: online → chat → feedback → save-conflicts. Remote migration names correspond to those additions. The private transfer table intentionally has no client grants/policies; guarded private functions are its only access path.

## Build / verification

From `samkok/`:

```sh
npm ci
npm test
npm run build
python3 -m http.server 8000 --directory web
```

`npm test` is offline: ten inherited rule tests plus seven asset/presentation/integration tests, including all 205 binary assets, surface data, clip coverage, weapon mapping and bounded adaptive quality. Browser scripts require Playwright and Chromium and a running local server:

```sh
node three/tests/browser.cjs
node three/tests/graphics.browser.cjs
node three/tests/cloud.browser.cjs
NODE_USE_ENV_PROXY=1 node three/tests/online.integration.mjs
```

Cloud/API scripts explicitly create temporary guest profiles in the isolated 3D tables. Do not run them casually against a production project; retain the recorded fixture IDs in the OS temporary directory (`samkok3d-api-fixtures.json` / `samkok3d-browser-fixtures.json`) for scoped cleanup. They never post test chat messages. Guild/feedback SQL checks were performed inside rolled-back transactions. During this implementation the scoped test profiles and saves were removed afterward.

Browser reports and actual screenshots are in `artifacts/`. Browser graphics tests use SwiftShader and verify functionality/layout, not real-phone FPS. Native inspection reopens 69 numbered Blender scenes and evaluates 1,428 character actions; the additional boss has seven clips. The GitHub Pages workflow publishes only `web/`.

Regenerate native sources from the parent checkout with `scripts/build_library.py`, the boss with `scripts/build_boss.py`, and glTF delivery copies with `scripts/export_game_models.py`. Exporting is deliberately separate from source authoring. Model mapping still derives from the supplied reference sheets plus explicit aliases in `src/layout.js`.

Melee presentation: warriors and cavalry approach the first damage target, face it,
strike at the existing 30% impact beat, turn and walk back before the next action.
HP labels and contact shadows follow the actor. Archers and strategists keep their
formation positions and launch projectiles. Area attacks approach one primary target;
other affected targets retain their skill effects. This changes presentation only,
not simulation damage, targeting or rewards. Browser verification for both sides and
x1/x2/x3: `node three/tests/melee.browser.cjs` (uses a controlled browser clock).
