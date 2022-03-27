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
//let mat_r = new THREE.Matrix4.makeRotationX(THREE.MathUtils.degToRad(-40));
//boxObj.matrix = new THREE.Matrix4().makeTranslation(0, 0, 80);//.multiply(mat_r);

/* light */ 
const light = new THREE.DirectionalLight(0xFFFFFF, 0.5); // color, intensity  

/* EventListener with keyboard */
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    boxObj.matrixAutoUpdate = false;
    
    let obj_mat = boxObj.matrix.clone();

    var keyCode = event.which;
    if (keyCode == 87) {        // w : move 10 px to the up
        boxObj.position.y += 1;
    } else if (keyCode == 83) { // s : move 10 px to the down
        boxObj.position.y -= 1;
    } else if (keyCode == 65) { // a : move 10 px to the left
        boxObj.position.x -= 1;
    } else if (keyCode == 68) { // d : move 10 px to the right
        boxObj.position.x += 1;
    } else if (keyCode == 32) { // space - move to origin, return to origin 
        boxObj.position.x = 0.0;
        boxObj.position.y = 0.0;
    }

    if (keyCode == 82){         // r : 3 degree rotation in X 
        //let mat_r = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI / 180 * 3.0); same code 
        //let mat_r = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI / 6.0);
        //obj_mat.multiply(mat_r);
        //boxObj.matrix.copy(obj_mat);  
        let myAxis = new THREE.Vector3(1, 0, 0);
        cube.rotateOnWorldAxis(myAxis, Math.PI / 180 * 3.0);
    } else if (keyCode == 84) { // t : 3 degree rotation in Y
        let mat_r = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI / 180 * 3.0);
        obj_mat.multiply(mat_r);
        boxObj.matrix.copy(obj_mat);
    } else if (keyCode == 89) { // y : 3 degree rotation in Z
        boxObj.rotateZ(Math.PI / 180 * 3.0);
    } else if (keyCode == 80) { // p : -3 degree rotation in X
        let mat_r = new THREE.Matrix4().makeRotationX(Math.PI / 180 * -3.0);
        obj_mat.multiply(mat_r);
        boxObj.matrix.copy(obj_mat); 
        //boxObj.rotation.x -= 3;
        //boxObj.rotateX(3); same code
    } else if (keyCode == 71) { // g : -3 degree rotation in Y
        let mat_r = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI / 180 * -3.0);
        obj_mat.multiply(mat_r);
        boxObj.matrix.copy(obj_mat);
    } else if (keyCode == 72) { // h : -3 degree rotation in Z
        boxObj.rotation.z -= 3;
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
