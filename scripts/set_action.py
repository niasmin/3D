"""Open in Blender's Text Editor and Run Script. Change ACTION below."""
import bpy
ACTION = 'Attack'  # 'Idle', 'Walk', 'Attack'
for rig in bpy.context.scene.objects:
    if rig.type != 'ARMATURE' or not rig.name.endswith('_Rig'):
        continue
    action = bpy.data.actions.get(rig.name + '__' + ACTION)
    if action:
        rig.animation_data_create()
        for track in rig.animation_data.nla_tracks:
            track.mute = True
        rig.animation_data.action = action
bpy.context.scene.frame_end = {'Idle': 80, 'Walk': 32, 'Attack': 48}[ACTION]
bpy.context.scene.frame_set(1)
