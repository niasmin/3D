# Samkok 3D presentation layer

This fork imports https://github.com/niasmin/samkok at commit `b61a1fc66d6169e7aecf6de4ebf5870fbd8fa511` as ordinary files under `samkok/`. The upstream repository is not modified.

## What changed

- A real Three.js city diorama with working building menus, a courtyard, pagodas, trees and camera orbit.
- Rigged GLB characters in campaign, tower, arena, story, raid, training and trial battles. The existing deterministic `simulate` remains authoritative. Attack playback, projectiles, hit flashes, falling defeated units, health, rage, speed, manual skills, skip and rewards use the original battle events.
- Formation and idle campaign previews use the same 3D characters. Existing formation buttons remain usable, including empty slots.
- All 64 playable hero IDs plus the guild boss resolve to a model. The hero viewer supports all three evolutions and Idle / Walk / Attack with orbit and zoom.
- 204 Blender-derived hero GLB files plus one original beast boss are shipped locally. Three.js is bundled locally, so no runtime CDN is required for the renderer. Models load on demand; cache entries are reference-counted and unused entries are evicted after twelve cached resources. Actors release their materials, skeletons and animation mixers; scene teardown releases the WebGL context.
- Static scenery is merged by material; Standard quality uses directional shadows on desktop and soft contact shadows on small screens. High enables directional shadows on all screen sizes; Low reduces pixel ratio and antialiasing.
- Local save key: `kunphon-samkok-3d-v1`. Original JSON saves remain importable through the existing save menu. The fork does not overwrite the original game's local save.
- Service worker caching uses a separate `samkok3d-` namespace and only handles requests inside its own scope.

## Deliberate limits

These are the stylized procedural first-pass models in the parent repository, not detailed likeness-approved sculpts. Shared base bodies and approximate ornaments remain. Revision 2 adds role-specific weapons, four attack families, segmented armor, archer quivers, larger scholar sleeves and per-hero beard/eyepatch details. Intersecting garment layers were removed. Roster coverage does not mean 64 artist-approved unique sculpts: a few IDs share a reference model. UI cards, the world map and some original menu illustrations remain 2D, as normal interface graphics. The Cocos project is retained from upstream; this is the playable **web** 3D edition, not a completed native Cocos port.

The guild boss now uses an original horned lion guardian authored in Blender, with a mane, tusks, claws, tail and its own rigged GLB. Effect geometry is newly generated in the renderer; the original illustrated spell animals are not recreated.

## Online services

`web/three/config.js` defaults to `online:false`. Campaign, collection, upgrades, summoning, offline rewards, NPC arena and the original local systems work without connecting to the upstream Supabase production project. Real player chat, cloud save, server coupons and real multiplayer are not enabled in this edition. No remote schema, policies or production player data were modified.

The original backend adapter is retained for a later deliberate connection. Do not set `online:true` casually: the retained adapter still points to the upstream project. A separate production backend and its policies should be configured before releasing real online play.

## Model mapping

`src/models.json` contains the image-match mapping from supplied sheets to upstream evolution artwork. `reference-matches.json` records image-feature match counts, not a quality certificate. `src/layout.js` explicitly overrides the five unmatched/low-confidence heroes (Cao Cao, Guan Yu, Lü Bu, Sun Ce and Sima Yi) and routes the boss to the new guardian asset. Runtime roster names and stats still come from the original game's hero data.

## Build and run

From `samkok/`:

```sh
npm ci
npm test
npm run build
python3 -m http.server 8000 --directory web
```

Open `http://localhost:8000/`. Serve over HTTP/HTTPS; opening a `file://` URL does not load module scripts or GLBs reliably.

Export source models again from the parent repository:

```sh
blender -b -t 4 --python scripts/export_game_models.py -- --start 1 --end 68
```

`npm test` runs ten inherited game-rule tests and five asset/integration tests, including all 205 GLBs, skins and animation clips. Browser QA additionally covers hero evolution and animation, campaign victory, rewards, save reload, summoning, the new beast boss viewer, the six-player/five-enemy formation, mobile layout and WebGL startup fallback. The browser test requires Playwright plus Chromium and a running server:

```sh
CHROMIUM_PATH=/usr/bin/chromium node three/tests/browser.cjs
```

Browser screenshots and its report are in `samkok/artifacts/`. The GitHub Pages workflow builds and publishes only `samkok/web`, not the Blender source library.
