"""Build an original rigged horned lion guardian, replacing the humanoid placeholder."""
import sys,importlib.util
from pathlib import Path
import bpy,math
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('library',ROOT/'scripts/build_library.py');lib=importlib.util.module_from_spec(spec);spec.loader.exec_module(lib)
sc=lib.setup_scene();mats=[lib.mat('Obsidian fur','293b4d'),lib.mat('Auburn mane','713e2c'),lib.mat('Bronze armor','bd9148',.55),lib.mat('Ivory horn','e8d6a8'),lib.mat('Ember eyes','ff6534',0,3),lib.mat('Nose','162128')]
s=lib.Sculpt(mats);rig=lib.armature('Flame_Guardian_Rig',0)
s.ell((0,.05,1.58),(.58,.42,.65),0)
s.ell((0,-.28,1.72),(.48,.19,.43),2)
for z in [1.45,1.65,1.85]:s.plate((0,-.46,z),.70,.20,.05,2)
for side,sign in [('L',1),('R',-1)]:
 s.tube([(sign*.24,0,1.05),(sign*.29,0,.57)],.21,0,'thigh.'+side)
 s.tube([(sign*.29,0,.57),(sign*.33,0,.18)],.17,0,'shin.'+side)
 s.ell((sign*.33,-.16,.19),(.26,.34,.18),0,'foot.'+side)
 s.tube([(sign*.38,0,1.93),(sign*.68,-.015,1.61)],.26,0,'upper_arm.'+side)
 s.tube([(sign*.68,-.015,1.61),(sign*.79,-.16,1.32)],.23,0,'forearm.'+side)
 s.ell((sign*.80,-.20,1.18),(.23,.23,.22),0,'hand.'+side)
 s.ell((sign*.49,0,1.95),(.32,.32,.21),2,'upper_arm.'+side)
 for j in range(4):
  xx=sign*.80+(j-1.5)*.10
  s.leaf((xx,-.34,1.16),(xx,-.48,1.1),(xx,-.46,.98),.045,3,'hand.'+side)
  s.leaf((sign*.33+(j-1.5)*.11,-.34,.22),(sign*.33+(j-1.5)*.11,-.50,.14),(sign*.33+(j-1.5)*.11,-.57,.1),.045,3,'foot.'+side)
 s.leaf((sign*.30,.03,2.80),(sign*.68,.0,3.25),(sign*.42,-.12,3.45),.13,3,'head')
 s.ell((sign*.25,-.38,2.62),(.12,.06,.065),4,'head')
 s.tube([(sign*.13,-.46,2.70),(sign*.34,-.34,2.73)],.055,1,'head')
 s.leaf((sign*.26,-.50,2.36),(sign*.25,-.62,2.13),(sign*.19,-.57,2.02),.075,3,'head')
s.ell((0,0,2.54),(.50,.37,.46),0,'head',24,14)
# Eye surfaces sit ahead of the skull and the snout has true depth.
for sign in [-1,1]:s.ell((sign*.24,-.35,2.64),(.13,.07,.075),4,'head')
s.ell((0,-.38,2.42),(.29,.28,.20),1,'head');s.ell((0,-.62,2.49),(.14,.08,.10),5,'head')
s.tube([(-.20,-.57,2.34),(0,-.63,2.30),(.20,-.57,2.34)],.027,5,'head')
for k in range(17):
 a=2*math.pi*k/17
 s.leaf((.42*math.cos(a),.04,2.55+.42*math.sin(a)),(.67*math.cos(a),.13,2.55+.66*math.sin(a)),(.55*math.cos(a),.27,2.55+.67*math.sin(a)),.13,1,'head')
s.tube([(0,.35,1.12),(.28,.65,.98),(.62,1.05,1.02),(.80,1.30,1.42)], [.12,.10,.075,.04],0,'cape')
s.leaf((.80,1.30,1.38),(1.0,1.35,1.65),(.85,1.30,1.9),.15,4,'cape')
ob=s.object('Flame_Guardian_Mesh',rig,0);rig['graphics_revision']=3;rig['asset_kind']='original horned lion guardian';lib.animations(rig,1,'halberd')
sc.frame_set(1);sc.camera.data.ortho_scale=6;sc.camera.location=(4,-9,5);sc.camera.rotation_euler=(lib.Vector((0,0,1.65))-sc.camera.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/boss.blend'),compress=True)
sc.render.filepath=str(ROOT/'previews/boss.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);ob.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ROOT/'samkok/web/models/boss.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_frame_range=False,export_cameras=False,export_lights=False,export_extras=True)
