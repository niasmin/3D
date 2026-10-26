# Detailed sculpt pass — native revision 4

The requested change is richer editable 3D geometry and closer correspondence to the
supplied numbered reference sheets. This pass modifies all 68 character scenes,
three evolutions each (204 meshes). The original effect-only sheet 69 and the extra
boss are unchanged. These are procedurally authored sculpts, not hand-sculpted replicas.

## Changes

- Face surface follows chin, jaw, cheek, temple and crown sections. Eyes have almond
  whites, amber irises, pupil highlights and sculpted upper/lower lids. Nose, ears and
  lips have separate secondary forms. Zhang Fei has an open shouting mouth.
- Swept hair uses lenticular sections instead of round bead-like locks; longer hair
  and layered beards follow per-sheet observations. Guan Yu has an exposed forehead,
  folded green cloth and a long beard. Scholar hats have flared sections and gold ribs.
- Armor gains overlapping lamellae, lip trim, rivets, sculpted animal masks with eyes,
  brows, nostrils, horns and teeth; bracers, knee reliefs and boot seams are modeled.
- Split cloth panels, gold embroidery curves, cape motifs, red sashes, jade pendants
  and tassels remain weighted to the existing body/cloth bones. Fingers are geometry,
  not independently animated. Weapons gain grip wrapping and engraved collars.
- Material constants now convert sRGB colors to linear values. Cloth/metal images
  remain sRGB. This corrects pale hair/skin caused by using display values as linear.

## Reference corrections

Appearance is read from the numbered sheet, rather than overridden by the RPG role.
Young Liu Bei uses sheet 63 (66 is a related version); Guan Yinping uses sheet 47;
Young Guan Yu uses sheet 64. The prior Young Liu Bei/Guan Yinping mapping swapped a
female halberd wielder and a male twin-sword wielder. Sheet 49 / original Zhao Yun game
art is green with paired swords; it is no longer recolored silver/blue just because
of the hero name. Gameplay roles and combat math are unchanged.

## Evidence and limits

Before/after Guan Yu uses the same Cycles studio lights, camera, evolution and pose.
The before file is from commit `f357eb3`; the unchanged before render is retained in
`previews/details/67-before.png`.
This comparison includes both geometry and the color-space correction; it does not
attribute all visible improvement to topology. Fresh front/side/back review views,
actual runtime screenshots, native reopening/deformation checks and GLB tests are
provided separately.

**Artistic likeness: NOT_APPROVED.** The model still simplifies the original facial
style, fabric silhouette and individual ornament drawings. Shared construction and
assembly seams remain. Back/hidden surfaces are interpretations (UNKNOWN accuracy).
Some material seams and intersecting ornaments are intentional stylized assemblies;
these assets are not watertight printing meshes. Native geometry is editable, but is
not production retopology or a facial-rig asset. Physical-phone FPS is NOT_CHECKED.
