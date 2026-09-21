import * as THREE from './assets/vendor/three.module.js';
let cleanup=()=>{};
function mount(){
 cleanup();const host=document.getElementById('tree-scene');if(!host)return;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-3.5,3.5,3,-3,0.1,60);
 camera.position.set(7,5.5,9);camera.lookAt(0,1.4,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.prepend(renderer.domElement);
 const hemi=new THREE.HemisphereLight(0xfffced,0x859369,2.1);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xfff8db,2);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-4;sun.shadow.normalBias=.03;scene.add(sun);
 const trunkMat=new THREE.MeshStandardMaterial({color:0x9b8d68,roughness:1,flatShading:true});
 const earthMat=new THREE.MeshStandardMaterial({color:0xd6ddb6,roughness:1,flatShading:true});
 const paleMat=new THREE.MeshStandardMaterial({color:0xe9e9d6,roughness:1,flatShading:true});
 const leafMats=[0x90ab69,0xa8bf7c,0xbed197,0x799955,0xcbd8a0].map(color=>new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true,side:THREE.DoubleSide}));
 const island=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.14,.21,38),earthMat);island.position.y=-.01;island.receiveShadow=true;scene.add(island);
 const rim=new THREE.Mesh(new THREE.CylinderGeometry(1.14,1.0,.13,38),paleMat);rim.position.y=-.18;scene.add(rim);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({opacity:.075}));ground.rotation.x=-Math.PI/2;ground.position.y=-.255;ground.receiveShadow=true;scene.add(ground);
 const tree=new THREE.Group();scene.add(tree);
 function branch(a,b,r){const vec=b.clone().sub(a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.64,r,vec.length(),7),trunkMat);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());mesh.castShadow=true;mesh.receiveShadow=true;tree.add(mesh);}
 let seed=92;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const leafGeo=new THREE.SphereGeometry(1,7,4);const state=window.getDCATreeState?.()||{count:0,weeks:0,motion:true};
 const height=2.25+state.count/60*.7;branch(new THREE.Vector3(0,.1,0),new THREE.Vector3(.06,height,0),.065);
 const levels=4+state.weeks;
 for(let i=0;i<levels;i++){
  const angle=i*2.399,baseY=.65+(i/(levels+1))*(height-1),length=(.65+random()*.25)*(1-(baseY/height)*.22),origin=new THREE.Vector3(.03,baseY,0),end=new THREE.Vector3(Math.cos(angle)*length,baseY+.48+random()*.22,Math.sin(angle)*length);
  branch(origin,end,.024+random()*.008);
  for(let j=0;j<7;j++){
   const t=.3+j*.11,pos=origin.clone().lerp(end,t);pos.y+=.08;
   const lateral=angle+(j%2===0?1:-1)*.8;
   const leaf=new THREE.Mesh(leafGeo,leafMats[Math.floor(random()*leafMats.length)]);
   const size=.27+random()*.13;leaf.scale.set(size,.072+random()*.035,size*.52);leaf.rotation.set(random()*.6,lateral,(random()-.4)*.5);leaf.position.copy(pos);leaf.position.x+=Math.cos(lateral)*.16;leaf.position.z+=Math.sin(lateral)*.16;leaf.castShadow=true;leaf.receiveShadow=true;tree.add(leaf);
  }
 }
 for(let j=0;j<5;j++){const leaf=new THREE.Mesh(leafGeo,leafMats[j]);leaf.scale.set(.26,.065,.13);leaf.position.set(Math.cos(j*2.4)*.15,height-.22+j*.045,Math.sin(j*2.4)*.14);leaf.rotation.set(.3,j*2.4,.6);leaf.castShadow=true;tree.add(leaf);}
 for(let i=0;i<7;i++){const a=random()*Math.PI*2,r=.65+random()*.4;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.05+random()*.05,0),paleMat);rock.position.set(Math.cos(a)*r,.12,Math.sin(a)*r);rock.scale.set(1.2,.55,1);rock.castShadow=true;scene.add(rock);}
 for(let i=0;i<9;i++){const a=random()*Math.PI*2,r=.85+random()*.28;const blade=new THREE.Mesh(new THREE.ConeGeometry(.02,.12+random()*.1,3),leafMats[1]);blade.position.set(Math.cos(a)*r,.17,Math.sin(a)*r);blade.rotation.z=(random()-.5)*.4;scene.add(blade);}
 let frame=0,disposed=false,animate=state.motion;
 function render(){if(disposed)return;renderer.render(scene,camera);}
 function tick(time){frame=0;if(disposed||!animate||document.hidden)return;tree.rotation.y=Math.sin(time*.0002)*.11;tree.rotation.z=Math.sin(time*.0006)*.006;render();frame=requestAnimationFrame(tick);}
 function resize(){if(disposed)return;const width=host.clientWidth,height=host.clientHeight,aspect=width/height;camera.left=-2.55*aspect;camera.right=2.55*aspect;camera.top=2.55;camera.bottom=-2.55;camera.updateProjectionMatrix();renderer.setSize(width,height);render();}
 const ro=new ResizeObserver(resize);ro.observe(host);resize();host.classList.add('ready');if(animate)frame=requestAnimationFrame(tick);
 const visibility=()=>{cancelAnimationFrame(frame);frame=0;if(!document.hidden&&animate)frame=requestAnimationFrame(tick);};document.addEventListener('visibilitychange',visibility);
 const update=e=>{if(e.detail.count!==state.count||e.detail.weeks!==state.weeks){mount();return;}animate=e.detail.motion;cancelAnimationFrame(frame);frame=0;if(animate)frame=requestAnimationFrame(tick);else render();};window.addEventListener('dca-tree-update',update);
 const lost=e=>{e.preventDefault();cleanup();};renderer.domElement.addEventListener('webglcontextlost',lost);
 cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);ro.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('dca-tree-update',update);renderer.domElement.removeEventListener('webglcontextlost',lost);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();host.classList.remove('ready');};
}
window.addEventListener('dca-tree-mount',mount);window.addEventListener('dca-tree-unmount',()=>cleanup());mount();
