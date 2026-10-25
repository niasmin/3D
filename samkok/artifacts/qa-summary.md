# Validation

- PASS — 10 inherited game-rule tests.
- PASS — 4 integration tests, covering all 204 GLBs, rigging, animation clips and roster mapping.
- PASS — Chromium/WebGL2 browser smoke tests at 1280×900 and 390×844.
- PASS — Three-level hero viewer and Attack selection; formation; campaign victory, rewards and save reload; summoning; six allied actors and five enemies; mobile horizontal overflow; renderer startup fallback.
- PASS — No Supabase requests during browser tests.

Browser rendering used software WebGL (SwiftShader). This verifies functionality and layout, not device GPU performance. No real multiplayer or native Cocos runtime testing was performed. Models remain first-pass stylized interpretations, with artistic likeness not approved.
