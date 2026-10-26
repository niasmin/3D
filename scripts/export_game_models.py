"""Export the native rigged character evolutions into self-contained glTF binaries."""
import bpy,sys,argparse,json,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--start',type=int,default=1);ap.add_argument('--end',type=int,default=68);ap.add_argument('--wait-for-detail',action='store_true');args=ap.parse_args(sys.argv[sys.argv.index('--')+1:])
out=ROOT/'samkok/web/models';out.mkdir(parents=True,exist_ok=True)
for idx in range(args.start,args.end+1):
 if args.wait_for_detail:
  deadline=time.monotonic()+1800
  while json.loads((ROOT/'docs'/f'{idx:02d}.json').read_text()).get('graphics_revision')!=4:
   if time.monotonic()>deadline:raise TimeoutError(f'Detailed native asset {idx} not ready')
   time.sleep(3)
 for tier in (1,2,3):
  bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets'/f'{idx:02d}.blend'),load_ui=False)
  rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE' and o.name.endswith('_Rig') and f'_T{tier}_' in o.name)
  for act in list(bpy.data.actions):
   if not act.name.startswith(rig.name+'__'):bpy.data.actions.remove(act,do_unlink=True)
  rig.location.x=0;rig.animation_data.action=bpy.data.actions[rig.name+'__Idle'];bpy.context.scene.frame_set(1)
  bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
  for o in bpy.context.scene.objects:
   if o.parent==rig:o.select_set(True)
  bpy.context.view_layer.objects.active=rig
  p=out/f'{idx:02d}-e{tier}.glb'
  bpy.ops.export_scene.gltf(filepath=str(p),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=False,export_cameras=False,export_lights=False,export_extras=True)
  print('GLB_EXPORTED',p.name,p.stat().st_size,flush=True)
