# Validation

- PASS — 10 inherited game-rule tests.
- PASS — 5 integration tests, covering all 205 GLBs, rigging, animation clips and roster mapping.
- PASS — Chromium/WebGL2 browser smoke tests at 1280×900 and 390×844.
- PASS — Three-level hero viewer, new beast boss and Attack selection; formation; campaign victory, rewards and save reload; summoning; six allied actors and five enemies; mobile horizontal overflow; renderer startup fallback.
- PASS — No Supabase requests during browser tests.

Browser rendering used software WebGL (SwiftShader). This verifies functionality and layout, not device GPU performance. No real multiplayer or native Cocos runtime testing was performed. Models remain first-pass stylized interpretations, with artistic likeness not approved.

Graphics revision 2: all 69 numbered Blender files reopened and evaluated successfully; the extra boss file also reopened with one mesh, 22 bones and three actions. All hero exports carry revision 2 metadata. Representative weapon mappings and distinct bow/sword attack outputs are checked. The before/after comparison changes geometry, weapons, materials and lighting together; it is not a controlled geometry-only comparison.
