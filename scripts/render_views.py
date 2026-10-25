"""Render front/side/back from native geometry for three representative families."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'previews'/'views';out.mkdir(exist_ok=True)
for asset in ('01','03','13'):
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets'/f'{asset}.blend'),load_ui=False)
 sc=bpy.context.scene;sc.frame_set(1)
 for o in sc.objects:
  if o.type=='MESH' and o.parent and '_T1_' not in o.parent.name:o.hide_render=True
 sc.camera.data.ortho_scale=4.2;sc.render.resolution_x=420;sc.render.resolution_y=480;sc.render.resolution_percentage=100
 for name,a in [('front',0),('side',math.pi/2),('back',math.pi)]:
  target=Vector((-2.8,0,1.70));sc.camera.location=target+Vector((10*math.sin(a),-10*math.cos(a),2));sc.camera.rotation_euler=(target-sc.camera.location).to_track_quat('-Z','Y').to_euler()
  sc.render.filepath=str(out/f'{asset}-{name}.png');bpy.ops.render.render(write_still=True)
