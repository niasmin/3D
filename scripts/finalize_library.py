"""Refresh embedded action instructions after the seven-action library upgrade."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
names=('Idle','Walk','Attack','Hit','Block','Defeat','Victory')
for path in sorted((ROOT/'assets').glob('*.blend')):
 bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
 t=bpy.data.texts.get('set_action.py') or bpy.data.texts.new('set_action.py');t.clear();t.write((ROOT/'scripts/set_action.py').read_text())
 for t in bpy.data.texts:
  if t.name.startswith('README'):
   text=t.as_string().replace('muted NLA tracks Idle/Walk/Attack','muted NLA tracks '+ '/'.join(names));t.clear();t.write(text)
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
 if path.stem.isdigit():
  meta=ROOT/'docs'/f'{path.stem}.json';d=json.loads(meta.read_text());d['graphics_revision']=max(3,int(d.get('graphics_revision',3)))
  for c in d['characters']:c['actions']=[c['rig']+'__'+n for n in names]
  meta.write_text(json.dumps(d,indent=2))
