import * as THREE from '../node_modules/three/build/three.module.js';

/* renderer, scene, camera */
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); 

/* box object */  
const texture = new THREE.TextureLoader().load('test.jpg');
const geo_box = new THREE.BoxGeometry(1, 1, 1); 
const material_box = new THREE.MeshPhongMaterial({color : 0xFFFFFF, emissive : 0x101000, specular : 0xFF0000, shininess : 1000, map:texture}); 
const boxObj = new THREE.Mesh(geo_box, material_box);
boxObj.matrixAutoUpdate = false;

/* light */ 
const light = new THREE.DirectionalLight(0xFFFFFF, 1); // color, intensity  

/* Control key state */
let isCtrl = 0;


init();
animate();


function init() {
    
    document.body.appendChild( renderer.domElement );

    renderer.setSize( window.innerWidth, window.innerHeight ); 
    renderer.setViewport(0,0,window.innerWidth, window.innerHeight);
    
    camera.position.set( 0, 0, 5 ); 
    camera.lookAt( 0, 0, 0 ); 
    camera.up.set(0,1,0);  

    light.position.set(0, 3, 3);
    
    scene.add(boxObj);
    scene.add(light); 
    
    /* EventListener with keyboard */
    document.addEventListener("keydown", onDocumentKeyDown, false);
    window.addEventListener("resize", onWindowResize );
    
}

function onDocumentKeyDown(event) {
    
    let obj_mat = boxObj.matrix.clone();
    let mat_r;
    let vec_pos = new THREE.Vector3(); 

    /* Calculate 10px to World Space */
    let point1_np = new THREE.Vector3(10/ window.innerWidth * 2 - 1, 0 / window.innerHeight * 2 + 1, -1).unproject(camera); // vector from near plane(camer space)
    let point2_np = new THREE.Vector3(0/ window.innerWidth * 2 - 1, 0 / window.innerHeight * 2 + 1, -1).unproject(camera); // vector from near plane(camer space)
    let cameraToWorld = new THREE.Vector3();
    let objectToWorld = new THREE.Vector3();
    camera.localToWorld(cameraToWorld);
    boxObj.localToWorld(objectToWorld);
    let dist_ss = point1_np.distanceTo(point2_np);
    let dist_objTocam = cameraToWorld.distanceTo(objectToWorld);
    let dist = dist_ss * dist_objTocam; // dist_objTocam = 5
    
    let test = boxObj.localToWorld(new THREE.Vector3()).project(camera);
    console.log((test.x+1)/2*window.innerWidth);
    
    let keyCode = event.which;
    switch (keyCode) {
        case 17 : // ctrl : convert the way to rotate object
            isCtrl += 1;
            break;
        case 87 : // w : move 10 px to the up
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.y += dist; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 83 : // s : move 10 px to the down
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.y -= dist; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 65 : // a : move 10 px to the left
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.x -= dist; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 68 : // d : move 10 px to the right
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.x += dist; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 32 : // space - move to origin, return to origin 
            boxObj.matrix.copy(obj_mat.setPosition(0, 0, 0)); 
            break; 

        case 82 : // r : 3 degree rotation in X 
            //boxObj.rotateX(3); same code
            //boxObj.rotation.y += (Math.PI / 180 * 3.0); 
            mat_r = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(3));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);  // box 중심 축 roation  
            else obj_mat.premultiply(mat_r);               // screen 보는 방향 중심 축 rotation  
            boxObj.matrix.copy(obj_mat);
            break;
        case 84 : // t : 3 degree rotation in Y
            mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(3));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break; 
        case 89 : // y : 3 degree rotation in Z
            mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(3));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break;
        case 80 : // p : -3 degree rotation in X
            mat_r = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(-3));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break;  
        case 71 : // g : -3 degree rotation in Y
            mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-3));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);      
            break; 
        case 72 : // h : -3 degree rotation in Z
            mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(-3));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break; 
    }    
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight);
    //renderer.render();
}

function animate() {
    requestAnimationFrame( animate ); 
    renderer.render(scene, camera);
}
