"""Bounded material-only correction for seven sheets whose plumes are visibly red."""
import bpy,sys,json,struct,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from build_library import color
report=[]
for idx in (20,23,25,34,40,46,54):
 path=ROOT/'assets'/f'{idx:02d}.blend';bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
 def protected():
  h=hashlib.sha256()
  for ob in bpy.context.scene.objects:
   if ob.type=='MESH':
    for v in ob.data.vertices:h.update(struct.pack('3f',*v.co));h.update(str([(g.group,g.weight) for g in v.groups]).encode())
   if ob.type=='ARMATURE':
    for b in ob.data.bones:h.update(bytes(str((b.name,tuple(b.head_local),tuple(b.tail_local))),'utf8'))
  return h.hexdigest()
 before=protected()
 for m in bpy.data.materials:
  if m.name.startswith('Horsehair crest'):
   m.diffuse_color=color('b92a2b');m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color('b92a2b')
 assert protected()==before
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
 sc=bpy.context.scene;sc.render.filepath=str(ROOT/'previews'/f'{idx:02d}.png');bpy.ops.render.render(write_still=True)
 for tier in (1,2,3):
  p=ROOT/'samkok/web/models'/f'{idx:02d}-e{tier}.glb';raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);tail=raw[20+n:];count=0
  for m in d['materials']:
   if m['name'].startswith('Horsehair crest'):m['pbrMetallicRoughness']['baseColorFactor']=list(color('b92a2b'));count+=1
  assert count==1,(idx,tier,count)
  chunk=json.dumps(d,separators=(',',':')).encode();chunk+=b' '*((-len(chunk))%4)
  p.write_bytes(struct.pack('<III',0x46546c67,2,20+len(chunk)+len(tail))+struct.pack('<II',len(chunk),0x4e4f534a)+chunk+tail)
 report.append({'sheet':idx,'protected_geometry_rig_weights':'PASS','crest':'red per reference','action_change':False})
(ROOT/'docs/crest-color-validation.json').write_text(json.dumps(report,indent=2))
print('CREST_COLORS_COMPLETE',flush=True)
