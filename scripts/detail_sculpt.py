"""Reference-directed sculpting primitives. Coordinates: Z up, front -Y.
Surface geometry, ornaments and clothing are retained as weighted editable meshes.
Back surfaces are designed interpretations of the supplied front/three-quarter art.
"""
import math
from math import sin,cos,pi
from mathutils import Vector

FEMALE={2,13,22,24,27,33,35,39,42,47,56,62}
LONG_HAIR={2,13,17,18,22,24,27,33,35,37,39,42,45,47,48,49,50,51,56,57,59,60,62,63,66}
# Overrides are observations from the numbered reference sheet, not RPG role names.
OVERRIDES={
 19:dict(weapon='shield'),20:dict(weapon='shield'),27:dict(weapon='spear'),33:dict(weapon='blade'),
 44:dict(identity='zhangfei',weapon='spear',beard='wild',hair='201a17',base='20553c',accent='d6ad50'),
 46:dict(weapon='blade'),47:dict(kind='knight',identity='guanyinping',weapon='halberd',base='237b4e',accent='e4c06c'),
 48:dict(identity='jiangwei',weapon='spear',base='235a3b',accent='d9b34c'),
 49:dict(kind='general',identity='reference49',weapon='sword',beard='short',base='27563d',accent='e6dcb8',hair='231c19'),
 50:dict(weapon='spear',base='e1e0c7',accent='36664c',hair='e5dfd3',beard=''),
 51:dict(identity='liubei',weapon='spear',base='e7e2cf',accent='276443',hair='28221e',beard=''),
 58:dict(base='252e49',accent='7294ba',beard='goatee'),
 60:dict(kind='sage',identity='zhuge',weapon='fan',base='28513c',accent='f0e4c4',hair='2b201c',beard='goatee'),
 63:dict(kind='knight',identity='liubei_y',weapon='sword',base='e5dfc9',accent='2d634c',hair='28221e',beard=''),
 64:dict(identity='guanyu_y',weapon='halberd',base='1d603d',accent='d8ad46',hair='241d1b',beard='long'),
 66:dict(kind='knight',identity='liubei_y',weapon='sword',base='e5dfc9',accent='2d634c',hair='28221e',beard=''),
 67:dict(identity='guanyu',weapon='halberd',base='175735',accent='d4aa43',hair='201a17',beard='long'),
 68:dict(identity='lubu',weapon='halberd',base='99251e',accent='d6a246',hair='221b17',beard='short'),
}

def direction(row,idx):
 name,kind,base,accent,hair,weapon,beard,element=row
 d=dict(identity='',kind=kind,base=base,accent=accent,hair=hair,weapon=weapon,beard='short' if beard else '',female=idx in FEMALE,skin='edb995')
 d.update(OVERRIDES.get(idx,{}))
 if idx in (3,6,11,21,23,30,36,38,41,52,53,55,61):d['beard']='long' if idx in (3,6,21,30,36,52,53) else 'short'
 if idx in (4,52,53):d['hair']='e8e1d4'
 if idx==67:d['skin']='c88868'
 if idx==44:d['skin']='ce9b73'
 return d

def face(s,idx,female):
 # Sparse semantic cross-sections: chin / jaw / cheeks / temples / forehead / crown.
 broad=idx in (6,14,23,25,30,34,40,44,46,55,61,65,68)
 width=1.10 if broad else .95 if female else 1
 rings=[(2.10,.055,.065,.005),(2.16,.17,.16,-.025),(2.24,.275,.225,-.018),(2.34,.335,.265,0),(2.45,.365,.284,.008),(2.57,.366,.281,.015),(2.69,.339,.254,.025),(2.79,.258,.192,.03),(2.85,.15,.12,.03),(2.88,.008,.01,.03)]
 vs=[];n=40
 for z,rx,ry,cy in rings:
  for k in range(n):
   a=2*pi*k/n;yy=sin(a);yy=-(-yy)**.38 if yy<0 else yy
   vs.append((width*rx*cos(a),cy+ry*yy,z))
 fs=[(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k) for j in range(len(rings)-1) for k in range(n)]
 s.add(vs,fs,4,'head')
 # Eye whites are almond surfaces. Eyelids are separate tapered sculpted rims.
 for sign in [-1,1]:
  cx=sign*.151*width;z=2.48;points=[]
  for k in range(25):
   a=k*2*pi/24;xx=.102*cos(a);zz=.055*sin(a)*(abs(sin(a))**.28);points.append((cx+xx,-.292+.025*(abs(cx+xx)/.35)**2,z+zz+sign*xx*.15))
  vs=[(cx,-.316,z)]+points
  s.add(vs,[(0,k+1,(k+1)%24+1) for k in range(24)],6,'head')
  iris=10 # amber brown, shared dedicated material appended by caller
  s.ell((cx-sign*.008,-.318,z),(.044,.013,.050),iris,'head',20,12)
  s.ell((cx-sign*.010,-.330,z+.001),(.021,.006,.036),5,'head',16,10)
  s.ell((cx-sign*.023,-.337,z+.020),(.012,.004,.013),6,'head',10,8)
  s.ell((cx+sign*.012,-.336,z-.018),(.005,.003,.006),6,'head',8,6)
  upper=[points[k] for k in range(13)];upper=[(x,y-.012,z) for x,y,z in upper]
  s.tube(upper,[.004+.010*sin(pi*k/12) for k in range(13)],3,'head',6)
  s.tube([(x,y-.006,z) for x,y,z in points[12:]],.004,4,'head',5)
  s.leaf((sign*.060,-.299,2.575),(sign*.16,-.300,2.615),(sign*.27,-.267,2.615),.024 if broad else .016,3,'head')
  # Concha and helix, independent of cheek volume.
  s.ell((sign*.365*width,.005,2.455),(.057,.062,.095),4,'head',16,12)
  s.ell((sign*.386*width,-.047,2.452),(.027,.013,.054),11,'head',12,10)
  if female:
   s.ell((sign*.36*width,-.018,2.36),(.022,.022,.025),2,'head',12,8)
   s.ell((sign*.36*width,-.018,2.30),(.019,.022,.044),8,'head',12,8)
 # Nasal bridge, tip, nostril wings, subtle lower lip, no painted-on grin.
 s.ell((0,-.283,2.414),(.027,.034,.066),4,'head',16,12)
 s.ell((0,-.316,2.389),(.038,.036,.030),4,'head',16,10)
 for sign in [-1,1]:s.ell((sign*.027,-.308,2.383),(.019,.015,.012),11,'head',12,8)
 s.tube([(-.060,-.267,2.303),(0,-.282,2.295),(.060,-.267,2.303)],[.003,.006,.003],11,'head',7)
 s.ell((0,-.272,2.280),(.043,.010,.012),4,'head',16,8)
 if idx==44:
  # Zhang Fei's characteristic open shouting mouth rather than a generic smile.
  s.ell((0,-.355,2.31),(.105,.026,.079),11,'head',20,12)
  s.ell((0,-.379,2.315),(.082,.010,.056),5,'head',20,12)
  s.ell((0,-.392,2.347),(.070,.007,.013),6,'head',16,8)

def lock(s,start,control,end,width,m=3,b='head'):
 # Lenticular hair/feather cross sections, with a tapered end and a raised centre ridge.
 a,c,z=Vector(start),Vector(control),Vector(end);vs=[];rows=17;n=8
 for j in range(rows):
  t=j/(rows-1);p=(1-t)**2*a+2*t*(1-t)*c+t*t*z;tangent=2*(1-t)*(c-a)+2*t*(z-c);tangent.normalize()
  normal=Vector((0,-1,0)) if p.y<.08 else Vector((0,1,0));u=tangent.cross(normal).normalized();normal=u.cross(tangent).normalized()
  r=.001+width*sin(pi*t)**.65
  for k in range(n):
   ang=k*2*pi/n;vs.append(p+u*(r*cos(ang))+normal*(r*.20*sin(ang)))
 fs=[(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k) for j in range(rows-1) for k in range(n)]
 s.add(vs,fs,m,b)

def hair(s,idx,tier,female,beard):
 s.ell((0,.055,2.68),(.368,.28,.205),3,'head',32,16)
 for k in range(12):
  a=-.10+k*pi/11;start=(.10*cos(a),.08+.09*sin(a),2.85);control=(.34*cos(a),.08+.30*sin(a),2.76);end=(.36*cos(a),.06+.27*sin(a),2.31+.08*cos(k))
  lock(s,start,control,end,.085)
 # Swept asymmetrical forelocks; Guan Yu's forehead is exposed beneath his cloth.
 if idx not in (64,67):
  for k in range(7):
   t=k/6;start=(.08+t*.17,-.10,2.84-t*.025);control=(-.22+t*.15,-.345,2.82-t*.045);end=(-.31+t*.085,-.30,2.58-.07*sin(t*pi))
   lock(s,start,control,end,.058)
 for sign in [-1,1]:
  for k in range(3):lock(s,(sign*.30,.02,2.71),(sign*.39,-.02,2.52),(sign*(.35+k*.02),.02,2.31-k*.035),.045)
 if idx in LONG_HAIR:
  for k in range(10 if female else 7):
   sign=-1 if k%2 else 1;u=k/10;lock(s,(sign*.20,.15,2.70),(sign*(.29+.23*u),.55,2.1),(sign*(.28+.24*u),.72+.08*sin(k),1.65+.22*u),.075)
 if idx==47:
  s.ell((.04,.15,2.96),(.115,.12,.15),3,'head',24,16)
  for k in range(12):
   t=k/11;sign=1 if k%2 else -1
   lock(s,(.04,.15,2.98),(sign*(.40+t*.22),.65,2.82),(sign*(.48+t*.28),.92,1.72+t*.32),.065)
 if beard:
  length={'long':.60,'wild':.35,'goatee':.24,'short':.15}.get(beard,.16);n=15 if beard in ('long','wild') else 7
  for k in range(n):
   u=k/(n-1)*2-1;xx=u*(.23 if beard=='wild' else .13 if beard=='long' else .08)
   lock(s,(xx,-.259,2.29+abs(u)*.045),(xx*1.05,-.34,2.23-length*.3),(xx*.65,-.29,2.29-length*(1-.32*abs(u))),.026 if beard=='wild' else .022)
  for sign in [-1,1]:lock(s,(sign*.01,-.337,2.36),(sign*.09,-.35,2.35),(sign*.16,-.283,2.30),.020)

def beast(s,c,r,b,kind='dragon',gem=8):
 x,y,z=c
 # Relief face sits on armor, with brow, snout, nostrils, teeth and swept horns.
 def p(a,d,h):return (x+a*r,y+d*r,z+h*r)
 s.ell(c,(r*.82,r*.38,r*.83),2,b,16,12)
 s.ell(p(0,-.34,-.18),(r*.55,r*.26,r*.31),2,b,16,10)
 for sign in [-1,1]:
  s.ell(p(sign*.38,-.37,.18),(r*.24,r*.08,r*.14),5,b,12,8)
  s.ell(p(sign*.38,-.46,.18),(r*.13,r*.04,r*.075),gem,b,12,8)
  s.leaf(p(sign*.12,-.40,.28),p(sign*.52,-.54,.53),p(sign*.84,-.15,.34),r*.13,2,b)
  s.ell(p(sign*.22,-.57,-.16),(r*.10,r*.025,r*.06),5,b,10,6)
  s.leaf(p(sign*.50,0,.48),p(sign*.95,.08,1.24),p(sign*.95,.18,1.34),r*.12,2,b)
  s.leaf(p(sign*.36,-.38,-.34),p(sign*.43,-.47,-.61),p(sign*.22,-.47,-.57),r*.055,6,b)
  for j in range(3):s.leaf(p(sign*.64,.02,.30-j*.23),p(sign*(1.05+j*.07),.12,.34-j*.28),p(sign*(.97+j*.06),.25,.46-j*.28),r*.12,2,b)
 s.tube([p(-.33,-.59,-.33),p(0,-.63,-.39),p(.33,-.59,-.33)],r*.035,5,b,6)

def scroll(s,c,scale,b='chest',m=2,flip=1):
 x,y,z=c
 pts=[]
 for k in range(29):
  t=k/28;a=t*pi*2.4;r=scale*(1-t*.8);pts.append((x+flip*r*cos(a),y-.004*sin(a),z+r*sin(a)))
 s.tube(pts,[.003+scale*.055*sin(pi*k/28) for k in range(29)],m,b,5)
 for sign in [-1,1]:s.leaf((x+sign*scale*.65,y,z),(x+sign*scale*1.15,y,z+scale*.75),(x+sign*scale*.90,y,z+scale*1.2),scale*.09,m,b)

def details(s,idx,tier,kind,female,weapon):
 armored=kind in ('general','knight');scholar=kind=='sage';gold=2
 # Wrapped collar and contrasted inner lapel, following chest contours.
 for sign in [-1,1]:
  pts=[(sign*.15,-.115,2.045),(sign*.22,-.22,1.96),(sign*.08,-.29,1.72),(-sign*.08,-.27,1.48)]
  s.tube(pts,[.038,.040,.034,.018],6 if sign<0 else 1,'chest',8)
  s.tube([(x,y-.025,z) for x,y,z in pts],.009,gold,'chest',5)
 # Articulated lamellae with rivets, dark under-layer and thin gold upper lips.
 if armored:
  for row in range(4):
   for col in range(6):
    xx=(col-2.5)*.096;zz=1.48+row*.095;yy=-.295+.07*(abs(xx)/.3)**2
    s.plate((xx,yy,zz),.089,.104,.010,9 if idx not in (44,67) else 0)
    s.tube([(xx-.039,yy-.004,zz+.045),(xx,yy-.013,zz+.037),(xx+.039,yy-.004,zz+.045)],.004,gold,'chest',5)
    for sign in [-1,1]:s.ell((xx+sign*.025,yy-.013,zz+.025),(.007,.005,.007),gold,'chest',6,4)
  for side,sign in [('L',1),('R',-1)]:
   b='upper_arm.'+side
   beast(s,(sign*.47,-.195,1.97),.125+tier*.012,b,kind='dragon' if idx%3 else 'lion')
   for j in range(3):
    s.plate((sign*(.48+.025*j),-.15,1.91-j*.075),.29,.12,.025,0,b)
    s.tube([(sign*.36,-.168,1.95-j*.075),(sign*.49,-.198,1.94-j*.075),(sign*.63,-.168,1.95-j*.075)],.009,gold,b,6)
   beast(s,(sign*.29,-.166,.60),.072,'shin.'+side)
 if tier>=2:
  for side,sign in [('L',1),('R',-1)]:
   for k in range(7):
    t=k/6;lock(s,(sign*.32,.10,2.04),(sign*(.50+t*.20),.16,2.02),(sign*(.58+t*.25),.22,1.88+t*.07),.045,6,'upper_arm.'+side)
 # Belt animal face and sash are separate, modelled attachments.
 beast(s,(0,-.332,1.29),.080,'pelvis')
 red=13
 for sign in [-1,1]:
  s.leaf((sign*.02,-.35,1.31),(sign*.18,-.40,1.21),(sign*(.16+.10*tier),-.30,.78),.045,red,'pelvis')
 # Overlapping front split cloth panels with actual thickness-free double-sided fabric.
 # Distinct lobes replace a circular cone silhouette. Retain editable surfaces.
 for sign in [-1,1]:
  rows=15;cols=7;vs=[]
  for j in range(rows):
   t=j/(rows-1)
   for k in range(cols):
    u=k/(cols-1);xx=sign*(.035+u*.21+t*(.04+u*.11));yy=-.285-.075*t+.022*sin(u*pi*2+t*3);zz=1.25-t*(.67 if armored else .87)+.07*u*t
    vs.append((xx,yy,zz))
  fs=[(j*cols+k,j*cols+k+1,(j+1)*cols+k+1,(j+1)*cols+k) for j in range(rows-1) for k in range(cols-1)]
  s.add(vs,fs,1 if sign<0 else 0,'pelvis')
  for edge in [vs[::cols],vs[cols-1::cols],vs[-cols:]]:s.tube(edge,.009,gold,'pelvis',5)
  for j in range(2+tier):
   t=(j+1)/(3+tier);scroll(s,(sign*(.16+t*.05),-.31-.075*t,1.15-t*.50),.045,'pelvis',flip=sign)
 # Gold cuff rims, fingers, boot seams and straps follow their actual limb bones.
 for side,sign in [('L',1),('R',-1)]:
  b='forearm.'+side
  for j in [0,1]:
   zz=1.38+j*.11;s.tube([(sign*.70,-.23,zz),(sign*.79,-.27,zz),(sign*.87,-.20,zz)],.013,gold,b,7)
  scroll(s,(sign*.79,-.273,1.43),.052,b)
  for j in range(4):
   xx=sign*(.735+j*.032);s.tube([(xx,-.247,1.28),(xx,-.284,1.23),(xx,-.259,1.18)],[.020,.021,.014],4,'hand.'+side,8)
   s.tube([(xx,-.281,1.235),(xx,-.275,1.218)],.003,11,'hand.'+side,5)
  s.tube([(sign*.72,-.19,1.29),(sign*.69,-.24,1.25),(sign*.73,-.27,1.22)],[.027,.026,.019],4,'hand.'+side,8)
  for j in range(3):
   zz=.25+j*.10;s.tube([(sign*.23,-.09,zz),(sign*.32,-.125,zz+.02),(sign*.41,-.09,zz)],.009,gold,'shin.'+side,6)
  s.tube([(sign*.22,-.27,.17),(sign*.33,-.39,.19),(sign*.44,-.27,.17)],.012,gold,'foot.'+side,7)
  # Weighted hanging jade and red silk tassel.
  s.tube([(sign*.23,-.32,1.29),(sign*.28,-.36,1.10)],.008,gold,'pelvis',5)
  s.ell((sign*.28,-.36,1.085),(.030,.019,.042),8,'pelvis',12,8)
  for k in range(5):s.tube([(sign*.28,-.36,1.04),(sign*.28+(k-2)*.008,-.36,.91+.007*cos(k))],[.006,.003],red,'pelvis',5)
 # Embroidered cape motifs follow the original curved cloth surface and cape bone.
 if tier>=2 or scholar or female:
  for sign in [-1,1]:
   for row in range(2+tier):
    t=.30+row*.12;u=.72
    pts=[]
    for k in range(25):
     f=k/24;a=f*pi*2.4;r=.045*(1-f*.8);uu=u+r*cos(a);tt=t+r*sin(a)
     pts.append((sign*(.20+uu*(.45+.28*tier)*(.4+.6*tt)),.18+.65*tt+.12*sin(uu*pi*3+tt*3)-.008,1.97-1.42*tt+.16*sin(uu*pi)))
    s.tube(pts,.005,gold,'cape',5)
 if idx in (64,67):
  # Folded headcloth has a forehead band rather than a hemispherical cap alone.
  vs=[];n=32
  for j in range(4):
   for k in range(n):
    a=k*2*pi/n;vs.append((.355*cos(a),.025+.265*sin(a),2.66+j*.045+.012*cos(3*a)))
  s.add(vs,[(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k) for j in range(3) for k in range(n)],0,'head')
  s.tube([(.355*cos(a),.025+.269*sin(a),2.68+.012*cos(3*a)) for a in [pi+i*pi/32 for i in range(33)]],.008,gold,'head',5)
 # Crown jewels and filigree are only placed on existing headgear.
 for sign in [-1,1]:
  scroll(s,(sign*.17,-.23,2.81),.063,'head',flip=sign)
 s.ell((0,-.279,2.81),(.036,.024,.053),8,'head',20,12)
 if idx in (3,36,58,59,60):
  # Flared scholar's hat, cut from a few deliberate section profiles.
  vs=[];n=32;profiles=[(2.79,.29,.23),(2.88,.30,.23),(3.08,.28,.21),(3.23,.34,.24)]
  for z,rx,ry in profiles:
   for k in range(n):a=k*2*pi/n;vs.append((rx*cos(a),.035+ry*sin(a),z+.025*cos(4*a)))
  s.add(vs,[(j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k) for j in range(3) for k in range(n)]+[tuple(range(3*n,4*n))],5 if idx==60 else 0,'head')
  for k in range(7):
   a=pi+k*pi/6;s.tube([(rx*cos(a),.035+ry*sin(a)-.006,z+.025*cos(4*a)) for z,rx,ry in profiles],.009,gold,'head',5)
  s.tube([( .34*cos(k*2*pi/48),.035+.24*sin(k*2*pi/48),3.23+.025*cos(k*8*pi/48)) for k in range(49)],.012,gold,'head',6)
 if weapon in ('spear','halberd','staff'):
  b='weapon.R';wx=-.8;wy=-.18
  # Inlaid repeating grip bands and engraved collar at the spear/blade interface.
  for j in range(9):
   z=1.02+j*.043;s.tube([(wx+.043*cos(k*pi/8),wy+.043*sin(k*pi/8),z+.024*k/16) for k in range(17)],.006,gold,b,5)
  beast(s,(wx,wy-.04,2.77),.074,b)
  if idx in (47,64,67,68):
   pts=[]
   for k in range(30):
    t=k/29;pts.append((wx+.052*cos(t*4*pi),wy-.050-.015*sin(t*pi),2.91+t*.48))
   s.tube(pts,[.009+.007*sin(pi*k/29) for k in range(30)],gold,b,6)
   for k in range(5):scroll(s,(wx-.13-k*.016,wy-.045,3.02+k*.075),.035,b)
 if weapon=='fan':
  for j in range(9):
   a=-.9+j/8*1.8;start=Vector((-.8,-.21,1.28));tip=Vector((-.8+sin(a)*.50,-.21,1.36+cos(a)*.57));mid=(start+tip)/2
   s.tube([start,mid,tip],[.005,.006,.002],gold,'weapon.R',5)
   for sign in [-1,1]:
    for k in range(4):
     t=.40+k*.10;p=start.lerp(tip,t);q=start.lerp(tip,t+.07)+Vector((sign*.022,0,-.012));s.tube([p,q],.0025,6,'weapon.R',4)
