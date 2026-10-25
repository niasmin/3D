"""Reopen every native file and test the actual evaluated deformation."""
import bpy, json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
report=[]
for path in sorted((ROOT/'assets').glob('*.blend')):
 bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
 sc=bpy.context.scene
 chars=[o for o in sc.objects if o.type=='ARMATURE' and o.name.endswith('_Rig')]
 checks={'opens':'PASS','reference_packed':'PASS' if any(i.packed_file for i in bpy.data.images) else 'FAIL','expected_characters':'PASS' if len(chars)==(0 if path.stem=='69' else 3) else 'FAIL'}
 details=[]
 for rig in chars:
  meshes=[o for o in sc.objects if o.type=='MESH' and o.parent==rig]
  ob=meshes[0];weights=all(len(v.groups)>0 for v in ob.data.vertices)
  group_bones=all(g.name in rig.data.bones for g in ob.vertex_groups)
  detail={'rig':rig.name,'weighted_vertices':'PASS' if weights and group_bones else 'FAIL','bones':len(rig.data.bones),'animations':{}}
  for name in ('Idle','Walk','Attack'):
   act=bpy.data.actions.get(rig.name+'__'+name)
   if not act:detail['animations'][name]={'status':'FAIL','reason':'missing action'};continue
   rig.animation_data.action=act
   sampled=[]
   for f in [1,9,17,25]:
    sc.frame_set(f);deps=bpy.context.evaluated_depsgraph_get();ev=ob.evaluated_get(deps);me=ev.to_mesh();sampled.append([v.co.copy() for v in me.vertices]);ev.to_mesh_clear()
   delta=max((a-b).length for frame in sampled[1:] for a,b in zip(sampled[0],frame))
   finite=all(math.isfinite(c) for frame in sampled for v in frame for c in v)
   detail['animations'][name]={'status':'PASS' if delta>.001 and finite else 'FAIL','max_vertex_motion_m':round(delta,5)}
  details.append(detail)
 checks['rigging_and_motion']='PASS' if all(d['weighted_vertices']=='PASS' and all(a['status']=='PASS' for a in d['animations'].values()) for d in details) else 'FAIL'
 effects=[o for o in sc.objects if o.type=='MESH' and o.parent and not o.parent.name.endswith('_Rig')]
 spell_checks=[]
 for ob in effects:
  samples=[]
  for f in (1,21):
   sc.frame_set(f);ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();samples.append([v.co.copy() for v in me.vertices]);ev.to_mesh_clear()
  dz=max(abs(a.z-b.z) for a,b in zip(*samples));move=max((a-b).length for a,b in zip(*samples))
  spell_checks.append({'mesh':ob.name,'max_height_change_m':dz,'max_motion_m':move,'status':'PASS' if dz<.0001 and move>.01 else 'FAIL'})
 checks['spell_axis_and_motion']='PASS' if len(effects)==3 and all(s['status']=='PASS' for s in spell_checks) else 'FAIL'
 checks['artistic_likeness']='NOT_CHECKED';checks['game_runtime']='NOT_CHECKED';checks['back_view_accuracy']='UNKNOWN'
 report.append({'file':str(path.relative_to(ROOT)),'checks':checks,'characters':details,'spell_checks':spell_checks})
 print('VALIDATED',path.name,checks['rigging_and_motion'],flush=True)
(ROOT/'docs'/'validation.json').write_text(json.dumps(report,indent=2))
fails=[r['file'] for r in report if 'FAIL' in r['checks'].values()]
print('VALIDATION_RESULT',len(report),'FILES',len(fails),'FAILURES',fails)
if len(report)!=69 or fails:raise RuntimeError('Incomplete or failed native library')
