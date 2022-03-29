import * as THREE from '../node_modules/three/build/three.module.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); 
renderer.setViewport(0,0,window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); 
camera.position.set( 0, 0, 20 );
camera.lookAt( 0, 0, 0 ); 
camera.up.set(0,1,0);   

/* box object */  
const texture = new THREE.TextureLoader().load('test.jpg');
const geo_box = new THREE.BoxGeometry(5, 5, 5); //color : 0xFFFFFF, emissive : 0x101000, specular : 0xFF0000, shininess : 1000
const material_box = new THREE.MeshBasicMaterial({map:texture}); 
const boxObj = new THREE.Mesh(geo_box, material_box);
let isCtrl = 0;

/* light */ 
const light = new THREE.DirectionalLight(0xFFFFFF, 0.5); // color, intensity  

/* EventListener with keyboard */
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    
    boxObj.matrixAutoUpdate = false;

    let obj_mat = boxObj.matrix.clone();
    let mat_r; 
    let vec_pos = new THREE.Vector3();

    let keyCode = event.which;
    switch (keyCode) {
        case 17 : // ctrl : convert the way to rotate object
            isCtrl += 1;
            break;
        case 87 : // w : move 10 px to the up
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.y += 10; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 83 : // s : move 10 px to the down
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.y -= 10; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 65 : // a : move 10 px to the left
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.x -= 1; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 68 : // d : move 10 px to the right
            vec_pos.setFromMatrixPosition(obj_mat);
            vec_pos.x += 1; 
            boxObj.matrix.copy(obj_mat.setPosition(vec_pos));
            break;
        case 32 : // space - move to origin, return to origin 
            boxObj.matrix.copy(obj_mat.setPosition(0, 0, 0)); 
            break; 

        case 82 : // r : 3 degree rotation in X 
            //boxObj.rotateX(3); same code
            //boxObj.rotation.y += (Math.PI / 180 * 3.0); 
            mat_r = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);  // box 중심 축 roation  
            else obj_mat.premultiply(mat_r);               // screnn 보는 방향 중심 축 rotation  
            boxObj.matrix.copy(obj_mat);
            break;
        case 84 : // t : 3 degree rotation in Y
            mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break; 
        case 89 : // y : 3 degree rotation in Z
            mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break;
        case 80 : // p : -3 degree rotation in X
            mat_r = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(-30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break;  
        case 71 : // g : -3 degree rotation in Y
            mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);      
            break; 
        case 72 : // h : -3 degree rotation in Z
            mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(-30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break; 
    }    
}

scene.add(light); 
scene.add(boxObj);

function animate() {
    requestAnimationFrame( animate ); 
    renderer.render(scene, camera);
}

animate();
