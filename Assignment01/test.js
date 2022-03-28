import * as THREE from '../node_modules/three/build/three.module.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); 
renderer.setViewport(0,0,window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); // np, perspective ratio, fp... parameter 
camera.position.set( 0, 0, 20 );
camera.lookAt( 0, 0, 0 ); 
camera.up.set(0,1,0);   

/* box object */  
const texture = new THREE.TextureLoader().load('test.jpg');
const geo_box = new THREE.BoxGeometry(5, 5, 5); //color : 0xFFFFFF, emissive : 0x101000, specular : 0xFF0000, shininess : 1000
const material_box = new THREE.MeshBasicMaterial({map:texture}); // 선이 아니면 mesh를 사용한다! 
const boxObj = new THREE.Mesh(geo_box, material_box);
let isCtrl = 0;
//let mat_r = new THREE.Matrix4.makeRotationX(THREE.MathUtils.degToRad(-40));
//boxObj.matrix = new THREE.Matrix4().makeTranslation(0, 0, 80);//.multiply(mat_r);

/* light */ 
const light = new THREE.DirectionalLight(0xFFFFFF, 0.5); // color, intensity  

/* EventListener with keyboard */
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    
    boxObj.matrixAutoUpdate = false;

    let obj_mat = boxObj.matrix.clone();
    let mat_r, mat_t;

    let keyCode = event.which;
    switch (keyCode) {
        case 17 : // ctrl : matrixQutoUpdate = false; 
            isCtrl += 1;
            break;
        case 87 : // w : move 10 px to the up
            //mat_t = obj_mat.makeTranslation(0, 1, 0);
            //console.log(obj_mat.getPosition());
            boxObj.matrix.copy(obj_mat.makeTranslation(0, 1, 0));
            //boxObj.matrix.copy(mat_t);
            break;
        case 83 : // s : move 10 px to the down
            boxObj.position.y -= 1; 
            
            break;
        case 65 : // a : move 10 px to the left
            boxObj.position.x -= 1; 
            
            break;
        case 68 : // d : move 10 px to the right
            boxObj.position.x += 1; 
            
            break;
        case 32 : // space - move to origin, return to origin 
            boxObj.position.x = 0.0;
            boxObj.position.y = 0.0;
            boxObj.position.z = 0.0;

            
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
            boxObj.matrixAutoUpdate = false;
            mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break;
        case 80 : // p : -3 degree rotation in X
            boxObj.matrixAutoUpdate = false;
            mat_r = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(-30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break;  
        case 71 : // g : -3 degree rotation in Y
            boxObj.matrixAutoUpdate = false;
            mat_r = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);      
            break; 
        case 72 : // h : -3 degree rotation in Z
            boxObj.matrixAutoUpdate = false;
            mat_r = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(-30));
            if (isCtrl % 2 == 0) obj_mat.multiply(mat_r);
            else obj_mat.premultiply(mat_r); 
            boxObj.matrix.copy(obj_mat);
            break; 
    }    
}

//renderer.render(scene, camera); 
scene.add(light); 
scene.add(boxObj);

function animate() {
    requestAnimationFrame( animate );
    //boxObj.rotation.x += 0.005;
    //boxObj.rotation.y -= 0.01; 
    renderer.render(scene, camera);
}

animate();
