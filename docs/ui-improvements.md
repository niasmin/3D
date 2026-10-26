# UX/UI — revision 7

The existing red/gold theme is retained. This pass addresses the four reviewed issues:
battle framing, phone readability/tap targets, city spacing/navigation, and the model viewer.

[Mobile showcase](../samkok/artifacts/ui/showcase.jpg) · [Battle before/after](../samkok/artifacts/ui/before-after.jpg) · [Landscape viewer](../samkok/artifacts/ui/viewer-landscape.png)

## Changes visible to players

- Battle camera fits the actual formation and reserves room for the header/controls and
  bottom action panel. Small fights are closer; full teams stay in frame. Portrait
  phones use a straight view to keep formation columns aligned. Short landscape battles reserve a command sidebar and frame the units in the remaining area. Rotating the camera
  remains available. Formation fitting is refreshed after viewport/action-panel resize.
- Unit names use 12px text or larger. HP/rage bars are larger; crowded phone formations
  omit the level/faction decoration from nameplates while retaining the full accessible
  label. Nameplates avoid one another and use thin leader lines to their character.
- Battle controls and model-viewer controls have at least 44px touch targets. The
  skill-use hint wraps instead of ending in an ellipsis.
- City header separates resources into a labeled row. Quick actions have consistent
  spacing, buildings retain large tap targets, and current navigation has a visible
  indicator. Header/nav do not shrink into the scrolling content; the last content can
  scroll clear of the bottom navigation. Dynamic viewport and safe-area CSS are used.
- Model viewer has a prominent full-width named skill button. Idle/Attack are primary;
  five secondary poses are in a native expandable menu. Evolution remains a separate
  row. Zoom in/out and reset are explicit controls, with touch/mouse instructions.
- Landscape model view puts the model and controls side by side. Short portrait screens
  can scroll the viewer controls while retaining a minimum model viewport.
- Tab/Shift+Tab stays inside the dialog, skips collapsed pose controls, and reaches
  expanded poses. Escape closes it. The canvas has the character's accessible name.

The resize handler immediately renders the new canvas size. Model loading also
paints before removing the loading indicator, avoiding a blank frame after a pose
menu changes the grid layout.

## Verification

`ui-report.json`: browser layouts at 320×568, 390×844, 768×1024, 1280×900 and 844×390.
Checks include navigation/content separation, tap sizes, wrapping battle hint,
name size, actual projected actor height, primary action styling, pose expansion,
zoom/reset behavior and clearing a skill preview on reset.

`ui-formation-report.json`: full 6-vs-5 battle on a phone viewport, all feet above the
command panel, labels below the top controls and inside the viewport, no label
rectangle overlaps, scroll-end clearance, keyboard trapping and Escape.

Core progression/rewards/save/reload/summon/fallback, x1/x2/x3 melee contact/return,
and actual skill playback are also rechecked. Simulation, save schema, account
identity, native models and skill recipes are unchanged.

Captures are in `samkok/artifacts/ui`. Camera inspections pause the battle playback
and remove the already-finished intro presentation so nameplates can be measured.
Before/after captures share viewport dimensions but are from different battle frames;
they are usability examples, not deterministic pixel comparisons.

Physical-phone touch, GPU performance and real-device notch geometry are NOT_CHECKED.
The browser tests use software WebGL and emulated touch viewports.
