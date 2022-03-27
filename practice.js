import * as THREE from '../node_modules/three/build/three.module.js';

// drawing lines 
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); 
renderer.setViewport(0,0,window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); // np, perspective ratio, fp... parameter 
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 ); 
camera.up.set(0,1,0);   

const scene = new THREE.Scene();

const points = [];
points.push( new THREE.Vector3( - 10, 0, 0 ) );
points.push( new THREE.Vector3( 0, 10, 0 ) );
points.push( new THREE.Vector3( 10, 0, 0 ) );

const geometry = new THREE.BufferGeometry().setFromPoints( points ); 
const material = new THREE.LineBasicMaterial({color : 0xFFFFff});
const line = new THREE.Line( geometry, material );  

line.position.set(0, 5, 0);
line.up.set(0, 1, 0);
line.lookAt(0, 0, -1);

line.matrixAutoUpdate = false;
//let mat_rr = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-40));
line.matrix = new THREE.Matrix4().makeTranslation(0, 0, 80);
//line.matrix = new THREE.Matrix4().makeTranslation(0, 0, 0).multiply(mat_r);

/* box example */  
//const texture = new THREE.TextureLoader('./test.png').load();
const geo_box = new THREE.BoxGeometry(5, 5, 5);
const material_box = new THREE.MeshPhongMaterial({ color : 0xFFFFFF, emissive : 0x101000, specular : 0xFF0000, shininess : 1000}); // 선이 아니면 mesh를 사용한다! 
const boxObj = new THREE.Mesh(geo_box, material_box);

boxObj.matrixAutoUpdate = false;
//let mat_r = new THREE.Matrix4.makeRotationX(THREE.MathUtils.degToRad(-40));
boxObj.matrix = new THREE.Matrix4().makeTranslation(0, 0, 80);//.multiply(mat_r);

const light = new THREE.DirectionalLight(0xffffff, 0.5);  

scene.add(light); 
scene.add(boxObj); 
scene.add(line);

renderer.render(scene, camera); 

function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
}


document.addEventListener("click", modifyText, false);

function modifyText() {
    const t2 = document.getElementById("mytest");
    t2.textContent = "^^";
}
