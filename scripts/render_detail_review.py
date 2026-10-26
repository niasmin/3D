import bpy,sys,argparse,math
from pathlib import Path
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--file',required=True);p.add_argument('--out',required=True);p.add_argument('--tier',type=int,default=3);p.add_argument('--view',default='three-quarter');p.add_argument('--clay',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.open_mainfile(filepath=a.file,load_ui=False)
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE' and o.name.endswith('_Rig') and f'_T{a.tier}_' in o.name)
for ob in sc.objects:
 if ob.type in ('MESH','ARMATURE'):ob.hide_render=not(ob==rig or ob.parent==rig)
rig.location.x=0
rig.animation_data.action=bpy.data.actions[rig.name+'__Idle'];sc.frame_set(1)
# Identical studio setup for old/new review. This reads but never resaves the asset.
sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=32;sc.cycles.use_denoising=False
sc.render.resolution_x=800;sc.render.resolution_y=1000;sc.render.resolution_percentage=100
sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.045,.055,.075,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.5
sc.view_settings.view_transform='AgX';sc.render.film_transparent=False
angle={'front':0,'side':math.pi/2,'back':math.pi,'three-quarter':.32}[a.view]
sc.camera.location=(8*math.sin(angle),-8*math.cos(angle),3.7);sc.camera.rotation_euler=(Vector((0,0,1.72))-sc.camera.location).to_track_quat('-Z','Y').to_euler();sc.camera.data.ortho_scale=4.30
if a.clay:
 m=bpy.data.materials.new('Neutral clay');m.diffuse_color=(.38,.38,.38,1);sc.view_layers[0].material_override=m
# Ground for contact shadows, separate from native geometry.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.04));ground=bpy.context.object;m=bpy.data.materials.new('Studio ground');m.diffuse_color=(.045,.052,.065,1);ground.data.materials.append(m)
sc.render.filepath=a.out;bpy.ops.render.render(write_still=True)
