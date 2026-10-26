"""Blender 4.3: build an explicitly stylized, editable first-pass library.
Run: blender -b -t 4 --python scripts/build_library.py -- --start 1 --end 69
No external Python packages or add-ons required.
"""
import bpy, math, json, argparse, sys, random
sys.path.insert(0,str(__import__("pathlib").Path(__file__).resolve().parent))
import detail_sculpt as detail
import numpy as np
from pathlib import Path
from mathutils import Vector
from math import sin, cos, pi

ROOT=Path(__file__).resolve().parents[1]
PROFILES=json.loads((ROOT/'scripts'/'hero-profiles.json').read_text())
# Per-reference art direction, manually read from all 69 supplied sheets.
# name, archetype, garment, accent, hair, weapon, beard, element
ROWS=[
('Silver Phoenix','knight','e4e4ef','71519c','251b22','spear',1,'b4a1ff'),
('Crimson Vanguard','knight','a11d28','e4b751','9d201c','spear',0,'ff431b'),
('Jade Chancellor','sage','392551','9661b0','1e1626','fan',1,'b35cff'),
('Verdant Immortal','sage','f0e1c2','73a86a','f3e8d9','staff',1,'8cfa65'),
('Violet Archer','archer','47224c','be74c7','35222a','bow',0,'ca69ff'),
('Crimson Warlord','general','52202a','a33232','292122','halberd',1,'ee304b'),
('Scarlet Cavalier','knight','b12427','efb649','241c24','spear',0,'ff342a'),
('Ivory Veteran','knight','e5ded3','aa3433','f6eadc','sword',1,'ffcb6d'),
('Golden Envoy','sage','d6a43b','a23120','2b2024','staff',0,'ffc94d'),
('Flame Sentinel','knight','9b2521','ca9b38','332523','spear',0,'ff4d1f'),
('Amber Veteran','knight','a63a23','d9ae52','eee2ca','sword',1,'ff8b27'),
('Blood Spear','general','a8232b','f0ae43','302329','spear',0,'ff313a'),
('Peony Dancer','dancer','f0b9aa','c83f3e','35232d','fan',0,'ff6946'),
('Ember Lion','general','a32527','d99737','862b20','blade',1,'ff343b'),
('Azure Lancer','knight','234a9a','dab250','222332','spear',0,'5b9cff'),
('Flame Blades','knight','ac2d26','e5b55b','572b23','blade',0,'ff5421'),
('River Strategist','sage','dee7d9','1f6997','272935','fan',0,'61b8ff'),
('Moon Scholar','sage','d9e5f2','496caf','282431','sword',0,'86b9ff'),
('Azure Guard','knight','284d92','dfb24f','2a2730','spear',0,'579dff'),
('Golden Shield','knight','294e8a','e5b752','29252a','shield',0,'e3d174'),
('Tide Chancellor','sage','dce9e8','30759b','302c2b','staff',1,'55cfff'),
('Crimson Lady','dancer','c53b30','f2cd8b','41262b','fan',0,'ff6d36'),
('Lion Admiral','general','324e84','e1b34b','312723','halberd',1,'e3c875'),
('Inferno Dancer','dancer','e24630','efbd64','a13124','fan',0,'ff4d1e'),
('Mountain Guardian','general','314b82','dfb04b','3b3028','axe',1,'659dff'),
('Phoenix Duelist','knight','b33223','e5b84e','923c23','sword',0,'ff6a22'),
('Bamboo Maiden','dancer','d9dfb4','418051','3c3025','fan',0,'8bfa72'),
('Storm Ranger','archer','315884','cfa558','292833','bow',0,'529cff'),
('Jade Ranger','archer','297344','d2ab4d','292b22','bow',0,'48e479'),
('Dark Regent','general','5b2827','b48b43','272321','halberd',1,'f22d45'),
('Forest Ranger','archer','4d7737','d9af51','302b25','bow',0,'74e372'),
('Sky Halberd','knight','c6d8e5','3e74a8','29262b','halberd',0,'69b8ff'),
('Ruby Blades','knight','b52f32','e4b04e','25202b','blade',0,'ff4244'),
('Jade Serpent','general','447853','dbc56b','4b3325','halberd',1,'66ee81'),
('Cloud Maiden','dancer','dfe5f0','849ed1','282333','fan',0,'91baff'),
('Violet Chancellor','sage','4d2d70','c99e49','2b202d','fan',1,'c57bff'),
('Night Scholar','sage','353647','ddd4b4','272632','sword',0,'80afff'),
('Red Commander','general','942b25','d7a13f','582e23','sword',1,'ff5830'),
('Spring Maiden','dancer','dce5b7','82a95e','59402b','fan',0,'a2ef62'),
('Ocean Champion','knight','30559d','dfb342','28232b','sword',0,'63abff'),
('Elder Archer','archer','ddd7bf','737b45','eee5d3','bow',1,'e7ee78'),
('Lilac Princess','dancer','d7b7e4','aa6eae','4a2c43','fan',0,'d991ff'),
('Azure Dragon','knight','294c9b','edbc45','262430','spear',0,'589fff'),
('Emerald Elder','general','396f40','ccad52','bfc3a5','halberd',1,'6ded7d'),
('Forest Scholar','sage','dee0c2','416f4e','292e24','fan',1,'8eea99'),
('Amethyst Bulwark','general','765381','e4b14d','a63520','shield',1,'cb77ff'),
('Jade Huntress','archer','e0e3bf','52844a','3d2e25','bow',0,'76f7a7'),
('Jade Dragon','knight','307c52','dfbd56','302c25','spear',0,'51ec99'),
('Emerald Cavalier','knight','386c3c','dfb94e','302820','sword',0,'89e768'),
('Ivory Commander','general','e0dcc1','9c5540','e1d9c8','sword',1,'f0dc85'),
('Jade Duelist','knight','d2dfd1','438e6c','302926','blade',0,'72e6a1'),
('Lilac Immortal','sage','e4d8ed','a174b5','e4d5e7','staff',1,'c997ff'),
('Sun Immortal','sage','f1e5b7','d8b448','f0e0ba','staff',1,'ffe56b'),
('Royal Tide','knight','244f92','deb342','25252b','sword',0,'62adff'),
('Fire Monarch','general','b63520','e6ab39','a23e20','halberd',1,'ff7428'),
('Scarlet Princess','dancer','e5bda8','b84532','462a28','fan',0,'ff8a4c'),
('Frost Monarch','sage','cdddf0','4368b6','332a35','staff',1,'8bb9ff'),
('Midnight Minister','sage','36304c','638bc0','292332','fan',1,'6eafff'),
('Jade Minister','sage','455c33','b5b766','363322','fan',1,'b1ef67'),
('Garden Princess','dancer','e6e1c6','7d9d70','4b3b2f','fan',0,'c5f5a5'),
('Bronze Bulwark','general','6d4c34','bd904c','412e26','shield',1,'f7b86b'),
('Violet Princess','dancer','e4c7e8','b77cb5','352336','fan',0,'e0a2ff'),
('Sage of Jade','sage','e7e0c4','4c8b70','312a26','sword',1,'93e3aa'),
('Emerald Crescent','general','1e6c41','c89e35','352b25','halberd',1,'54e777'),
('Inferno Crescent','general','ad2926','df9d36','392021','halberd',1,'ff512a'),
('Ivory Sage','sage','ece3ca','5a9c8d','3d3029','staff',1,'b4f1c6'),
('Jade War God','general','276443','d1a43d','272a24','halberd',1,'6ce789'),
('Crimson War God','general','b22223','dfa339','2d2425','halberd',1,'ff5d31'),
]

def srgb_color(h): return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))+(1,)
def color(h): return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in srgb_color(h)[:3])+(1,)
def mat(name,h,metal=0,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=color(h);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color(h);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.28 if metal else .58
 if emit:p.inputs['Emission Color'].default_value=color(h);p.inputs['Emission Strength'].default_value=emit
 if name.startswith(('Silk ','Accent ')) or name in ('Antique gold','Steel'):
  size=256;yy,xx=np.mgrid[0:size,0:size];cloth=name.startswith(('Silk ','Accent '))
  height=(np.sin(xx*np.pi/4)*np.cos(yy*np.pi/4)*.12+np.sin(xx*np.pi/16)*np.sin(yy*np.pi/16)*.10) if cloth else (np.cos(xx*np.pi/32)*np.cos(yy*np.pi/32)*.18+((xx%64<2)|(yy%64<2))*.22)
  key=('weave-' if cloth else 'engraved-')+h
  im=bpy.data.images.get(key)
  if not im:
   im=bpy.data.images.new(key,width=size,height=size,alpha=True);rgba=np.ones((size,size,4),dtype=np.float32);rgba[:,:,:3]=np.clip(np.array(srgb_color(h)[:3])[None,None,:]*(.90+height[:,:,None]*.35),0,1);im.pixels.foreach_set(rgba.ravel());im.pack();im.use_fake_user=True
  tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
  nmname='surface-normal-'+str(cloth);nm=bpy.data.images.get(nmname)
  if not nm:
   dy,dx=np.gradient(height);v=np.stack((-dx,-dy,np.ones_like(dx)),axis=-1);v/=np.linalg.norm(v,axis=-1,keepdims=True);rgba=np.ones((size,size,4),dtype=np.float32);rgba[:,:,:3]=v*.5+.5
   nm=bpy.data.images.new(nmname,width=size,height=size,alpha=True);nm.colorspace_settings.name='Non-Color';nm.pixels.foreach_set(rgba.ravel());nm.pack();nm.use_fake_user=True
  texn=m.node_tree.nodes.new('ShaderNodeTexImage');texn.image=nm;normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.28 if cloth else .45;m.node_tree.links.new(texn.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],p.inputs['Normal'])
 return m

class Sculpt:
 def __init__(self,mats):self.v=[];self.f=[];self.mi=[];self.b=[];self.mats=mats
 def add(self,vs,fs,m,b):
  off=len(self.v);self.v.extend(vs);self.b.extend([b]*len(vs));self.f.extend([tuple(off+i for i in f) for f in fs]);self.mi.extend([m]*len(fs))
 def ell(self,c,s,m,b='chest',nu=16,nv=10):
  vs=[]
  for j in range(nv+1):
   ph=pi*(j+.001)/(nv+.002)
   for i in range(nu):
    a=2*pi*i/nu;vs.append((c[0]+s[0]*sin(ph)*cos(a),c[1]+s[1]*sin(ph)*sin(a),c[2]+s[2]*cos(ph)))
  fs=[(j*nu+i,j*nu+(i+1)%nu,(j+1)*nu+(i+1)%nu,(j+1)*nu+i) for j in range(nv) for i in range(nu)]
  self.add(vs,[tuple(reversed(f)) for f in fs],m,b)
 def tube(self,pts,r,m,b='chest',n=10):
  vs=[]
  rr=[r]*len(pts) if isinstance(r,(int,float)) else r
  for k,p in enumerate(pts):
   t=Vector(pts[min(k+1,len(pts)-1)])-Vector(pts[max(0,k-1)]);t.normalize();u=t.cross(Vector((0,1,0)))
   if u.length<.01:u=t.cross(Vector((1,0,0)))
   u.normalize();w=t.cross(u)
   for i in range(n):vs.append(Vector(p)+rr[k]*(u*cos(i*2*pi/n)+w*sin(i*2*pi/n)))
  fs=[tuple(range(n-1,-1,-1)),tuple((len(pts)-1)*n+i for i in range(n))]
  fs += [(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i) for k in range(len(pts)-1) for i in range(n)]
  self.add(vs,fs,m,b)
 def leaf(self,a,c,z,width,m,b='chest'):
  a,c,z=Vector(a),Vector(c),Vector(z);pts=[];rad=[]
  for i in range(9):
   t=i/8;pts.append((1-t)**2*a+2*t*(1-t)*c+t*t*z);rad.append(.007+width*sin(pi*t)**.8)
  self.tube(pts,rad,m,b,n=6)
 def plate(self,c,w,h,depth,m,b='chest',taper=.8):
  # Closed trapezoidal lamellar plate with a raised central ridge.
  x,y,z=c;vs=[(x-w/2,y,z+h/2),(x+w/2,y,z+h/2),(x+w*taper/2,y,z-h/2),(x-w*taper/2,y,z-h/2),(x,y-depth,z),
    (x-w/2,y+.018,z+h/2),(x+w/2,y+.018,z+h/2),(x+w*taper/2,y+.018,z-h/2),(x-w*taper/2,y+.018,z-h/2)]
  self.add(vs,[(0,4,1),(1,4,2),(2,4,3),(3,4,0),(5,6,7,8),(0,1,6,5),(1,2,7,6),(2,3,8,7),(3,0,5,8)],m,b)
 def robe(self,top,bottom,rt,rb,m,b='pelvis',phase=0):
  vs=[];n=48
  for j in range(5):
   t=j/4;r=rt*(1-t)+rb*t
   for k in range(n):
    a=2*pi*k/n;wave=1+.065*cos(a*12+phase)*t;vs.append((r*cos(a)*wave,r*sin(a)*wave,top*(1-t)+bottom*t+.045*sin(3*a)*t))
  self.add(vs,[(j*n+i,(j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n) for j in range(4) for i in range(n)],m,b)
 def panel(self,side,tier,m):
  # Flowing double-sided cape with distinct sections and a gold hem.
  vs=[];nx=16;ny=12
  for j in range(ny):
   t=j/(ny-1)
   for i in range(nx):
    u=i/(nx-1);x=side*(.20+u*(.45+.28*tier)*(.4+.6*t));y=.18+.65*t+.12*sin(u*pi*3+t*3);z=1.97-1.42*t+.16*sin(u*pi)
    vs.append((x,y,z))
  self.add(vs,[(j*nx+i,j*nx+i+1,(j+1)*nx+i+1,(j+1)*nx+i) for j in range(ny-1) for i in range(nx-1)],m,'cape')
  self.tube(vs[-nx:],.018,2,'cape')
 def object(self,name,rig,offset):
  me=bpy.data.meshes.new(name);me.from_pydata(self.v,[],self.f);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
  for m in self.mats:me.materials.append(m)
  for p,idx in zip(me.polygons,self.mi):p.material_index=idx;p.use_smooth=True
  uv=me.uv_layers.new(name='SurfaceUV')
  for poly in me.polygons:
   axis=max(range(3),key=lambda a:abs(poly.normal[a]));axes=([1,2] if axis==0 else [0,2] if axis==1 else [0,1]);scale=1.5
   for li in poly.loop_indices:
    co=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]*scale,co[axes[1]]*scale)
  groups={b:ob.vertex_groups.new(name=b) for b in sorted(set(self.b))}
  indices={b:[] for b in groups}
  for i,b in enumerate(self.b):indices[b].append(i)
  for b,ids in indices.items():groups[b].add(ids,1,'REPLACE')
  mod=ob.modifiers.new('Skeletal deformation','ARMATURE');mod.object=rig;ob.parent=rig;ob.location=(0,0,0)
  return ob

def armature(name,x):
 ar=bpy.data.armatures.new(name);ob=bpy.data.objects.new(name,ar);bpy.context.collection.objects.link(ob);ob.location.x=x;bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 specs=[('root',(0,0,.05),(0,0,.35),None),('pelvis',(0,0,.85),(0,0,1.16),'root'),('spine',(0,0,1.16),(0,0,1.65),'pelvis'),('chest',(0,0,1.65),(0,0,2.04),'spine'),('neck',(0,0,2.04),(0,0,2.19),'chest'),('head',(0,0,2.19),(0,0,2.85),'neck'),('cape',(0,.16,1.95),(0,.65,.9),'chest'),('plume',(0,.1,2.8),(0,.5,3.3),'head')]
 for side,s in [('L',1),('R',-1)]:
  specs += [(f'upper_arm.{side}',(s*.38,0,1.93),(s*.68,-.015,1.61),'chest'),(f'forearm.{side}',(s*.68,-.015,1.61),(s*.79,-.16,1.32),f'upper_arm.{side}'),(f'hand.{side}',(s*.79,-.16,1.32),(s*.8,-.18,1.18),f'forearm.{side}'),(f'weapon.{side}',(s*.8,-.18,1.18),(s*.8,-.18,1.9),f'hand.{side}'),(f'thigh.{side}',(s*.23,0,.98),(s*.29,0,.57),'pelvis'),(f'shin.{side}',(s*.29,0,.57),(s*.33,0,.18),f'thigh.{side}'),(f'foot.{side}',(s*.33,0,.18),(s*.33,-.3,.12),f'shin.{side}')]
 for n,h,t,p in specs:
  b=ar.edit_bones.new(n);b.head=h;b.tail=t
  if p:b.parent=ar.edit_bones[p]
 bpy.ops.object.mode_set(mode='OBJECT');ob.select_set(False);ob.show_in_front=True
 return ob

def animations(rig,seed,weapon='sword'):
 rig.animation_data_create()
 for name,length in [('Idle',80),('Walk',32),('Attack',48),('Hit',16),('Block',24),('Defeat',40),('Victory',64)]:
  act=bpy.data.actions.new(rig.name+'__'+name);rig.animation_data.action=act;act.use_fake_user=True
  for frame in range(1,length+2,4):
   t=(frame-1)/length;wave=sin(t*2*pi)
   for p in rig.pose.bones:p.rotation_mode='XYZ';p.rotation_euler=(0,0,0);p.location=(0,0,0)
   rig.pose.bones['root'].location.y=(.025*(1-cos(t*4*pi)) if name=='Walk' else .025*wave)
   rig.pose.bones['chest'].rotation_euler.y=.035*wave
   rig.pose.bones['cape'].rotation_euler.x=.08*wave
   rig.pose.bones['plume'].rotation_euler.y=.10*sin(t*2*pi+.5)
   rig.pose.bones['head'].rotation_euler.z=.04*wave
   for side,s in [('L',1),('R',-1)]:
    rig.pose.bones['upper_arm.'+side].rotation_euler.y=.035*s*wave
    if name=='Walk':
     rig.pose.bones['thigh.'+side].rotation_euler.x=.43*s*wave
     rig.pose.bones['shin.'+side].rotation_euler.x=max(0,-s*wave)*.60
     rig.pose.bones['upper_arm.'+side].rotation_euler.x=-.30*s*wave
     rig.pose.bones['forearm.'+side].rotation_euler.x=-.12-.12*max(0,s*wave)
   if name=='Attack':
    strike=sin(pi*min(1,max(0,(t-.15)/.65)))**2
    rig.pose.bones['chest'].rotation_euler.z=-.35*strike
    rig.pose.bones['upper_arm.R'].rotation_euler.x=-1.2*strike
    rig.pose.bones['forearm.R'].rotation_euler.x=-.65*strike
    rig.pose.bones['upper_arm.L'].rotation_euler.y=.5*strike
    if weapon=='bow':
     rig.pose.bones['upper_arm.R'].rotation_euler.x=-.9*strike
     rig.pose.bones['upper_arm.R'].rotation_euler.z=-.4*strike
     rig.pose.bones['upper_arm.L'].rotation_euler.x=-1.0*strike
     rig.pose.bones['forearm.L'].rotation_euler.x=-1.3*strike
     rig.pose.bones['chest'].rotation_euler.y=.20*strike
    elif weapon in ('staff','fan'):
     for side in ['L','R']:rig.pose.bones['upper_arm.'+side].rotation_euler.x=-1.1*strike;rig.pose.bones['forearm.'+side].rotation_euler.x=-.4*strike
     rig.pose.bones['root'].location.y=.10*strike
    elif weapon in ('spear','halberd'):
     rig.pose.bones['upper_arm.R'].rotation_euler.x=-.65*strike
     rig.pose.bones['forearm.R'].rotation_euler.x=-1.10*strike
     rig.pose.bones['chest'].rotation_euler.x=.20*strike
   if name=='Hit':
    recoil=sin(pi*t);rig.pose.bones['chest'].rotation_euler.x=-.25*recoil;rig.pose.bones['head'].rotation_euler.x=-.18*recoil
   if name=='Block':
    guard=sin(pi*t);rig.pose.bones['upper_arm.L'].rotation_euler.x=-1.05*guard;rig.pose.bones['forearm.L'].rotation_euler.x=-1.25*guard;rig.pose.bones['chest'].rotation_euler.y=.20*guard
   if name=='Defeat':
    fall=min(1,t*1.4);rig.pose.bones['spine'].rotation_euler.x=.65*fall;rig.pose.bones['head'].rotation_euler.x=.40*fall;rig.pose.bones['root'].location.y=-.38*fall
    for side in ['L','R']:rig.pose.bones['thigh.'+side].rotation_euler.x=-.55*fall;rig.pose.bones['shin.'+side].rotation_euler.x=1.0*fall
   if name=='Victory':
    salute=sin(pi*min(1,t*2)/2);rig.pose.bones['upper_arm.R'].rotation_euler.x=-2.45*salute;rig.pose.bones['forearm.R'].rotation_euler.x=-.4*salute;rig.pose.bones['root'].location.y=.045*abs(wave)
   for p in rig.pose.bones:p.keyframe_insert('rotation_euler',frame=frame,group=p.name)
   rig.pose.bones['root'].keyframe_insert('location',frame=frame,group='root')
  for fc in act.fcurves:
   for k in fc.keyframe_points:k.interpolation='BEZIER'
  track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,act);track.mute=True
 rig.animation_data.action=bpy.data.actions.get(rig.name+'__Idle')

def make_character(row,tier,x,idx):
 name,kind,base,accent,hair,weapon,beard,element=row
 profile=PROFILES.get(str(idx),{});look=profile.get('look',{});role=profile.get('role');female=bool(look.get('f',False)) if profile else kind=='dancer'
 identity=profile.get('id','')
 if role:
  kind={'war':'general','cav':'knight','arch':'archer','strat':'sage','heal':'sage'}[role]
  if female and role in ('heal','strat'):kind='dancer'
  weapon={'war':'blade','cav':'spear','arch':'bow','strat':'fan','heal':'staff'}[role]
  if profile.get('id') in ('guanyu','guanyu_y','lubu'):weapon='halberd'
  if profile.get('id') in ('zhangfei','zhangfei_y'):weapon='spear'
  if profile.get('id')=='xuhuang':weapon='axe'
  if profile.get('id')=='xiahoudun':weapon='shield'
  beard=bool(look.get('beard'));hair=look.get('hair','#251b22').lstrip('#')
  if look.get('old'):hair='d8d5cf'
  # Color-correct cloth using faction accents; keep the reference's primary palette.
 skin=look.get('skin','#efb992').lstrip('#')
 if profile.get('id')=='liubei_y':base,accent='38704d','e7d8ae'
 if profile.get('id')=='guanyu':skin='c48763'
 if identity in ('liubei_y','liubei'):weapon='sword';base,accent='285a40','e9d8aa'
 if identity in ('guanyu','guanyu_y'):base,accent='205a42','be983f'
 if identity=='guanyu':look={**look,'beard':'long'}
 if identity=='zhangfei':base,accent='263f39','986c35';skin='be916c'
 if identity=='zhaoyun':base,accent='cbdde5','2c6894'
 if identity=='zhuge':base,accent='e2dfc8','386d63';look={**look,'beard':'goatee'};beard=True
 # The supplied sheet is the authority for appearance; RPG labels do not recolor it.
 art=detail.direction(row,idx);kind=art['kind'];female=art['female'];identity=art['identity'];base=art['base'];accent=art['accent'];hair=art['hair'];weapon=art['weapon'];skin=art['skin'];beard=bool(art['beard']);look={**look,'beard':art['beard']}
 mats=[mat('Silk '+base,base),mat('Accent '+accent,accent),mat('Antique gold','c99a3f',.78),mat('Hair '+hair,hair),mat('Warm skin',skin),mat('Ink','201d29'),mat('Ivory','f4e8d4'),mat('Boot leather','3c3033'),mat('Jade and gemstone '+element,element,.25,.18),mat('Steel','9aafbd',.65)]
 mats.extend([mat('Amber iris','79401d'),mat('Lip and ear warmth','a96b59'),mat('Hair strand sheen','514035'),mat('Crimson silk ties','9d1f23')])
 rig=armature(f'{idx:02d}_T{tier}_{name}_Rig',x);s=Sculpt(mats)
 robust=kind=='general';scholar=kind=='sage';armored=kind in ('general','knight');r=.39 if robust else .29 if female else .32
 # Layered tunic, breastplate, articulated legs, boots, belts.
 if not armored:s.robe(1.35,.42,.29,.54+.045*tier,0,phase=idx*.3)
 # One continuous garment surface avoids two intersecting robes flickering in glTF.
 for a in ([] if armored else range(0,360,60)):
  a=math.radians(a);s.tube([( .30*cos(a),.30*sin(a),1.30),(.43*cos(a),.43*sin(a),.98),(.47*cos(a),.47*sin(a),.84 if armored else .45)],.012,2,'pelvis',6)
 s.ell((0,0,1.16),(.30,.22,.20),7,'pelvis')
 s.ell((0,0,1.64),(r,.24,.40),0)
 if armored:
  s.ell((0,-.06,1.70),(r*.97,.20,.30),9)
  for j in range(4):
   for k in range(5):
    xx=(k-2)*.116;zz=1.48+j*.105;yy=-.27+.09*(abs(xx)/.3)**2
    s.plate((xx,yy,zz),.109,.12,.022,2 if j==3 else 9)
  for sign in [-1,1]:
   for j in range(3):s.plate((sign*.23,-.34,1.15-j*.13),.19,.16,.035,9,'pelvis')
  for sign in [-1,1]:s.tube([(sign*.25,-.24,1.92),(sign*.17,-.33,1.63),(sign*.08,-.27,1.42)],.024,2)
  s.ell((0,-.335,1.78),(.085,.03,.105),2)
 else:
  s.tube([(-.25,-.19,1.96),(0,-.30,1.64),(.20,-.22,1.43)],.037,1)
  if kind=='archer':
   s.tube([(-.25,-.22,1.96),(.04,-.27,1.65),(.24,-.22,1.38)],.045,7)
   s.tube([(.25,.23,1.4),(.38,.26,2.15)],.11,7)
   for k in range(5):
    s.tube([(.29+k*.028,.26,1.7),(.35+k*.028,.26,2.42)],.012,2)
    s.leaf((.35+k*.028,.26,2.30),(.42+k*.028,.26,2.37),(.35+k*.028,.26,2.43),.035,6)
  else:
   for sign in [-1,1]:
    for j in range(3):s.leaf((sign*.05,-.31,1.85-j*.14),(sign*.18,-.32,1.84-j*.14),(sign*.25,-.23,1.88-j*.14),.014,2)
 s.ell((0,0,1.29),(.35,.27,.075),7,'pelvis');s.ell((0,-.275,1.29),(.105,.045,.09),2,'pelvis');s.ell((0,-.32,1.29),(.038,.02,.045),8,'pelvis')
 for side,sign in [('L',1),('R',-1)]:
  s.tube([(sign*.23,0,1.03),(sign*.29,0,.57)],.12,7,'thigh.'+side)
  s.tube([(sign*.29,0,.57),(sign*.33,0,.18)],.105,7,'shin.'+side)
  s.ell((sign*.33,-.12,.16),(.16,.28,.14),7,'foot.'+side)
  s.ell((sign*.33,-.15,.10),(.17,.285,.045),2,'foot.'+side)
  s.ell((sign*.29,-.075,.60),(.135,.09,.16),2 if not scholar else 1,'shin.'+side)
  s.tube([(sign*.38,0,1.91),(sign*.68,-.015,1.61)],.14 if robust else .115,0,'upper_arm.'+side)
  s.ell((sign*.43,0,1.94),(.24 if robust else .16,.24,.15),2 if armored else 0,'upper_arm.'+side)
  if armored:
   for j in range(tier+1):s.plate((sign*.47,-.18,1.97-.07*j),.28,.10,.04,2 if j==0 else 9,'upper_arm.'+side)
  s.tube([(sign*.68,-.015,1.61),(sign*.79,-.16,1.32)], [.19,.16] if scholar else [.10,.12],0 if (scholar or female) else 9,'forearm.'+side)
  s.ell((sign*.79,-.16,1.32),(.13,.12,.055),2,'forearm.'+side)
  s.ell((sign*.8,-.18,1.22),(.105,.10,.125),4 if female else 7,'hand.'+side)
  if tier>=2 or scholar or female:s.panel(sign,tier,0 if armored else 0 if sign==1 else 1)
 # Neck, large chibi head, cheeks and sculpted face. Front faces negative Y.
 s.ell((0,0,2.06),(.12,.12,.20),4,'neck')
 detail.face(s,idx,female)
 detail.hair(s,idx,tier,female,art['beard'])
 # Headgear has different profiles for each family and increases by tier.
 if identity in ('liubei_y','liubei','reference49','jiangwei','zhangfei'):
  s.ell((0,.06,2.90),(.13,.13,.16),3,'head');s.tube([(-.28,-.14,2.76),(0,-.25,2.80),(.28,-.14,2.76)],.035,2,'head');s.ell((0,-.28,2.81),(.045,.023,.06),8,'head')
  if idx in (44,48,49,51):
   for j in range(7):s.leaf((0,.10,2.97),(.24+j*.025,.35,3.28),(.50+j*.025,.55,2.88-j*.045),.045,13,'plume')
 elif identity in ('guanyu','guanyu_y'):
  s.ell((0,.05,2.79),(.34,.24,.13),0,'head');s.plate((0,-.22,2.8),.20,.10,.02,2,'head')
  for sign in [-1,1]:s.leaf((sign*.2,.08,2.82),(sign*.39,.22,2.6),(sign*.48,.30,2.3),.075,0,'plume')
 elif armored and not female:
  s.ell((0,.055,2.76),(.39,.29,.20),9 if kind=='knight' else 2,'head')
  s.tube([(-.34,-.16,2.64),(0,-.294,2.73),(.34,-.16,2.64)],.035,2,'head')
  for sign in [-1,1]:s.ell((sign*.33,.015,2.50),(.075,.20,.23),9,'head')
  s.leaf((0,-.28,2.65),(0,-.34,2.85),(0,-.20,3.02),.08,2,'head')
  plume='b92a2b'
  pm=len(mats);mats.append(mat('Horsehair crest',plume));s.ell((0,.05,2.97),(.10,.11,.08),2,'head')
  for j in range(7+tier*2):
   s.leaf((0,.08,3.00),(.18+.03*j,.30,3.52+.015*j),(.52+.035*j,.48,3.04-.07*j),.060,pm,'plume')
 elif scholar and not female:
  s.ell((0,.03,2.84),(.28,.23,.15),5 if identity=='zhuge' else 0,'head')
  if identity=='zhuge':s.tube([(0,.04,2.86),(0,.04,3.13)],[.20,.16],5,'head',8)
  for sign in [-1,1]:s.tube([(sign*.22,.03,2.86),(sign*.26,.04,3.12)],.033,2,'head')
  s.tube([(-.25,.04,3.12),(0,.06,3.15),(.25,.04,3.12)],.025,2,'head')
  s.ell((0,-.20,2.87),(.07,.035,.10),2,'head');s.ell((0,-.236,2.88),(.033,.02,.048),8,'head')
 elif idx==47:
  # Open phoenix tiara: thin swept wing leaves, not upright round beads.
  for sign in [-1,1]:
   for j in range(3):
    detail.lock(s,(sign*.035,-.14,2.83),(sign*(.14+j*.04),-.17,2.96),(sign*(.20+j*.045),-.10,2.96+j*.065),.028,2,'head')
  s.ell((0,-.18,2.91),(.027,.018,.045),8,'head')
 else:
  for j in range(3+tier):
   xx=(j-(2+tier)/2)*.10;s.leaf((xx,-.06,2.85),(xx*1.1,-.08,3.04),(xx*1.1,-.03,3.00+.12*(1-abs(xx))),.035,2,'head')
 if look.get('patch'):
  s.ell((-.153,-.305,2.49),(.10,.023,.067),7,'head')
  s.tube([(-.30,-.14,2.70),(0,-.30,2.54),(.29,-.18,2.38)],.018,7,'head')
 if look.get('pheasant'):
  for sign in [-1,1]:s.leaf((sign*.15,.05,2.88),(sign*.65,.24,3.9),(sign*.90,.48,3.55),.048,1,'plume')
 # Right-hand weapon. Real 3D attachments deform with weapon.R.
 b='weapon.R';wx=-.80;wy=-.18
 if weapon in ('spear','staff','halberd'):
  s.tube([(wx,wy,.15),(wx,wy,2.85)],.033,7,b)
  for z in [.35,1.10,1.40,2.70,2.85]:s.ell((wx,wy,z),(.065,.065,.035),2,b)
  if weapon=='staff':
   s.ell((wx,wy,3.03),(.13,.13,.18),8,b)
   for sign in [-1,1]:s.leaf((wx,wy,2.8),(wx+sign*.22,wy,3.02),(wx+sign*.14,wy,3.28),.05,2,b)
  else:
   if identity in ('guanyu','guanyu_y','guanyinping'):
    contour=[]
    for p0,p1,p2 in [((0,2.85),(-.47,2.99),(-.42,3.23)),((-.42,3.23),(-.35,3.48),(0,3.65)),((0,3.65),(-.14,3.37),(-.04,3.15)),((-.04,3.15),(.01,2.96),(0,2.85))]:
     for k in range(10):
      t=k/10;contour.append(((1-t)**2*p0[0]+2*t*(1-t)*p1[0]+t*t*p2[0],(1-t)**2*p0[1]+2*t*(1-t)*p1[1]+t*t*p2[1]))
    vs=[(wx+dx,wy+dy,z) for dy in [-.026,.026] for dx,z in contour];n=len(contour)
    fs=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    s.add(vs,fs,9,b);s.tube([(wx,wy-.03,2.88),(wx-.10,wy-.03,3.18),(wx,wy-.03,3.53)],[.020,.016,.004],2,b)
   elif identity not in ('zhangfei','zhangfei_y'):
    s.leaf((wx,wy,2.78),(wx-.05,wy,3.12),(wx,wy,3.51),.13,9,b)
    s.tube([(wx,wy-.025,2.82),(wx,wy-.025,3.43)],[.025,.004],2,b)
   if weapon=='halberd' and identity not in ('guanyu','guanyu_y','guanyinping'):s.leaf((wx,wy,2.83),(wx-.58,wy,2.94),(wx-.34,wy,3.40),.18,2,b)
   if identity in ('zhangfei','zhangfei_y'):
    s.tube([(wx,wy,2.86),(wx-.1,wy,3.05),(wx+.1,wy,3.27),(wx-.05,wy,3.55)],[.055,.06,.045,.005],9,b)
   for j in range(5):s.leaf((wx,wy,2.75),(wx-.12,wy-.02,2.60),(wx+(j-2)*.045,wy,2.34),.028,1,b)
 elif weapon in ('sword','blade'):
  s.tube([(wx,wy,1.07),(wx,wy,1.50)],.045,7,b)
  s.tube([(wx-.18,wy,1.45),(wx+.18,wy,1.45)],.04,2,b)
  s.leaf((wx,wy,1.47),(wx-.06 if weapon=='blade' else wx,wy,2.16),(wx+.12 if weapon=='blade' else wx,wy,2.75),.13 if weapon=='blade' else .08,9,b)
  if identity in ('liubei_y','liubei','reference49'):
   xx=.8;bb='weapon.L';s.tube([(xx,wy,1.08),(xx,wy,1.48)],.04,7,bb);s.tube([(xx-.13,wy,1.46),(xx+.13,wy,1.46)],.035,2,bb);s.leaf((xx,wy,1.48),(xx,wy,2.0),(xx,wy,2.55),.07,9,bb)
 elif weapon=='axe':
  s.tube([(wx,wy,.75),(wx,wy,2.48)],.05,7,b)
  for sign in [-1,1]:s.leaf((wx,wy,2.26),(wx+sign*.42,wy,2.16),(wx+sign*.32,wy,2.60),.20,9,b)
 elif weapon=='bow':
  pts=[(wx-.25*sin(pi*t/16),wy, .68+t/16*1.65) for t in range(17)];s.tube(pts,.038,2,b)
  s.tube([pts[0],pts[-1]],.008,6,b,6)
  s.tube([(wx,wy-.015,1.35),(wx,wy-.015,2.15)],.012,7,b,6)
 elif weapon=='fan':
  for j in range(9):
   a=-.9+j/8*1.8;tip=(wx+sin(a)*.50,wy,1.36+cos(a)*.57)
   s.leaf((wx,wy,1.23),((wx+tip[0])/2,wy-.025,(1.23+tip[2])/2),tip,.045,6 if j%2 else 1,b)
  s.tube([(wx,wy,1.17),(wx,wy,1.45)],.028,2,b)
 if weapon=='shield':
  s.ell((wx,wy-.08,1.52),(.34,.13,.47),2,b);s.ell((wx,wy-.19,1.52),(.27,.065,.38),0,b);s.ell((wx,wy-.26,1.52),(.09,.05,.11),2,b)
 detail.details(s,idx,tier,kind,female,weapon)
 ob=s.object(f'{idx:02d}_T{tier}_{name}_Mesh',rig,x)
 rig['reference']=f'references/{idx:02d}.jpg';rig['evolution']=tier;rig['status']='Reference-directed detailed sculpt; likeness review pending';rig['height_m']=3.5
 rig['graphics_revision']=4;rig['detail_revision']=1;rig['source_authority']='numbered reference image';rig['visual_identity']=identity or name;rig['costume_palette']=base+','+accent;rig['weapon']=weapon;rig['archetype']=kind;rig['hero_id']=profile.get('id','unassigned');rig['surface_detail']='UV woven cloth and engraved metal'
 animations(rig,idx,weapon)
 return rig,ob

def effect(element,tier,x,label):
 mats=[mat('Spell light',element,0,3),mat('Spell gold','e4bd65',.5,1)]
 s=Sculpt(mats)
 for j in range(2+tier):
  radius=.65+j*.12;pts=[(radius*cos(a*2*pi/64),radius*sin(a*2*pi/64),.07+j*.025) for a in range(65)];s.tube(pts,.012 if j%2 else .020,j%2,'root',6)
 for k in range(2+tier):
  pts=[]
  for j in range(40):
   t=j/39;a=t*pi*1.6+2*pi*k/(2+tier);r=1.05-.35*t;pts.append((r*cos(a),r*sin(a),.12+.50*t*tier))
  s.tube(pts,[.008+.024*sin(pi*j/39) for j in range(40)],0,'root',6)
 for k in range(8+tier*4):
  a=2*pi*k/(8+tier*4);s.ell((1.05*cos(a),1.05*sin(a),.14+.06*sin(k)),(.025,.025,.055),1,'root',8,6)
 rig=armature(label,x)
 ob=s.object(label+'_Geometry',rig,x)
 rig.animation_data_create();act=bpy.data.actions.new(label+'__SpellLoop');rig.animation_data.action=act;act.use_fake_user=True
 for frame,angle in [(1,0),(81,2*pi)]:
  p=rig.pose.bones['root'];p.rotation_mode='XYZ';p.rotation_euler.y=angle;p.keyframe_insert('rotation_euler',frame=frame)
 for fc in act.fcurves:
  for k in fc.keyframe_points:k.interpolation='LINEAR'
 return rig

def setup_scene():
 bpy.ops.wm.read_factory_settings(use_empty=True)
 sc=bpy.context.scene;sc.render.engine='BLENDER_WORKBENCH';sc.render.resolution_x=1440;sc.render.resolution_y=960;sc.render.resolution_percentage=75
 sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
 sh=sc.display.shading;sh.light='STUDIO';sh.studiolight_rotate_z=.3;sh.color_type='MATERIAL';sh.show_shadows=True;sh.show_cavity=True;sh.cavity_type='BOTH';sh.curvature_ridge_factor=1.3;sh.curvature_valley_factor=1.0;sh.show_specular_highlight=True;sh.background_type='WORLD';sc.world=bpy.data.worlds.new('Dark blue studio');sc.world.color=(.035,.045,.065)
 sc.view_settings.view_transform='Standard';sc.render.fps=24;sc.frame_start=1;sc.frame_end=80
 cam_data=bpy.data.cameras.new('Overview');cam=bpy.data.objects.new('Overview',cam_data);sc.collection.objects.link(cam);cam.location=(4.5,-16,9);target=Vector((0,0,1.50));cam.rotation_euler=(target-Vector(cam.location)).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=10.5;sc.camera=cam
 # Usable lights included for switching to Eevee/Cycles.
 for name,loc,energy,size in [('Key',(-4,-6,9),1400,7),('Rim',(3,5,7),1800,5),('Fill',(5,-3,4),700,5)]:
  d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;ob=bpy.data.objects.new(name,d);sc.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,1.4))-ob.location).to_track_quat('-Z','Y').to_euler()
 return sc

def run(idx,render=True):
 sc=setup_scene();records=[]
 if idx<=68:
  row=ROWS[idx-1]
  for tier,x in [(1,-2.8),(2,0),(3,2.8)]:
   rig,ob=make_character(row,tier,x,idx);effect(row[7],tier,x,f'{idx:02d}_T{tier}_Spell')
   records.append({'tier':tier,'rig':rig.name,'mesh':ob.name,'vertices':len(ob.data.vertices),'bones':len(rig.data.bones),'actions':[rig.name+'__'+a for a in ['Idle','Walk','Attack','Hit','Block','Defeat','Victory']]})
  title=row[0]
 else:
  for tier,x in [(1,-2.8),(2,0),(3,2.8)]:effect('94f164',tier,x,f'69_T{tier}_EmeraldVortex')
  title='Emerald Vortex Effects'
  sc.camera.location=(3,-13,12);sc.camera.rotation_euler=(Vector((0,0,.5))-sc.camera.location).to_track_quat('-Z','Y').to_euler()
 # Persistent reference is packed; no missing external texture paths.
 ref=ROOT/'references'/f'{idx:02d}.jpg';im=bpy.data.images.load(str(ref));im.pack();im.use_fake_user=True
 txt=bpy.data.texts.new('README — asset scope');txt.write(f'Reference {idx:02d}: {title}\nReference-directed detailed sculpt. Artistic likeness remains unapproved. Back views are designed assumptions.\nThree evolutions left-to-right. Front=-Y, Z up, meters.\nCharacters: active Idle action; muted NLA tracks Idle/Walk/Attack/Hit/Block/Defeat/Victory. Select rig, unmute ONE track and clear active action to preview it.\nReference image packed in this file. No external add-ons required.\n')
 helper=bpy.data.texts.new('set_action.py');helper.write((ROOT/'scripts'/'set_action.py').read_text())
 sc['reference_number']=idx;sc['art_status']='DETAILED_REFERENCE_SCULPT_REVIEW_PENDING';sc['source_reference']=f'references/{idx:02d}.jpg';sc.frame_set(1)
 for screen in bpy.data.screens:
  for area in screen.areas:
   if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets'/f'{idx:02d}.blend'),compress=True)
 if render:sc.render.filepath=str(ROOT/'previews'/f'{idx:02d}.png');bpy.ops.render.render(write_still=True)
 return {'reference':idx,'name':title,'blend':f'assets/{idx:02d}.blend','preview':f'previews/{idx:02d}.png','status':'DETAILED_REFERENCE_SCULPT_REVIEW_PENDING','graphics_revision':4,'characters':records,'effects':3}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--start',type=int,default=1);ap.add_argument('--end',type=int,default=69);ap.add_argument('--no-render',action='store_true');args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--'in sys.argv else [])
 (ROOT/'assets').mkdir(exist_ok=True);(ROOT/'previews').mkdir(exist_ok=True);(ROOT/'docs').mkdir(exist_ok=True)
 for i in range(args.start,args.end+1):
  record=run(i,not args.no_render);(ROOT/'docs'/f'{i:02d}.json').write_text(json.dumps(record,indent=2));print('ASSET_COMPLETE',i,flush=True)
