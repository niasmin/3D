"""Actual Blender motion frames for the sample rig (no image simulation)."""
import bpy,sys,argparse
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--asset',default='01');ap.add_argument('--action',default='Attack');args=ap.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets'/f'{args.asset}.blend'),load_ui=False)
sc=bpy.context.scene
for o in sc.objects:
 if o.type=='ARMATURE' and '_T1_' not in o.name:o.hide_render=True
 if o.type=='MESH' and o.parent and '_T1_' not in o.parent.name:o.hide_render=True
rig=next(o for o in sc.objects if o.type=='ARMATURE' and o.name.endswith('_Rig') and '_T1_' in o.name)
rig.animation_data.action=bpy.data.actions[rig.name+'__'+args.action]
sc.camera.location=(-.1,-10,5.8);sc.camera.rotation_euler=(Vector((-2.8,0,1.65))-sc.camera.location).to_track_quat('-Z','Y').to_euler();sc.camera.data.ortho_scale=4.6
sc.render.resolution_x=420;sc.render.resolution_y=420;sc.render.resolution_percentage=100
out=ROOT/'previews'/'motion'/args.action;out.mkdir(parents=True,exist_ok=True)
length={'Idle':80,'Walk':32,'Attack':48,'Hit':16,'Block':24,'Defeat':40,'Victory':64}[args.action]
for i in range(16):
 sc.frame_set(1+round(i*length/16));sc.render.filepath=str(out/f'{i:02d}.png');bpy.ops.render.render(write_still=True)
