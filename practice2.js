import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js'; // jsm : js module version 
// 상대경로가 아닌 package name 바로 적었음, 이를 해결해야 import가 됨 
// 이를 해결하는 것이 Importmap 

/* MediaPipe */
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

/* renderer, scene, camera */
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceMesh.send({image: videoElement});
    },
    width: 1280,
    height: 720
  });

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

/* Add OrbitControls */
// camera 가 OrbitControl 안에 들어가므로 OrbitControl이 알아서 내부적으로 setting 해주므로 이제 camera 관련 작업ㅇ르 할 필요 없음 
// (three package 상대 경로 수정) -> OrbitControl 생성 -> camera 연결 -> upate 
const controls = new OrbitControls( camera, renderer.domElement); // render, camera 


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
    
    window.addEventListener("resize", onWindowResize );
    
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                       {color: '#C0C0C070', lineWidth: 1});
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
      }
    }
    canvasCtx.restore();
  }
  
  const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }});
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onResults);

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
