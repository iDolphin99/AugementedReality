import { Loader } from "three";
import * as THREE from "three/build/three.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
//import { GUI } from "three/build/"

import { TRIANGULATION } from "../triangulation.js";

// web pack 하고 싶으면 이런 방식으로 import 하자
import "./node_modules/@mediapipe/camera_utils/camera_utils.js";
import "./node_modules/@mediapipe/control_utils/control_utils.js";
import "./node_modules/@mediapipe/drawing_utils/drawing_utils.js"; 
import "./node_modules/@mediapipe/face_mesh/face_mesh.js"; 

/* MediaPipe */
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

/* renderer */
const renderer = new THREE.WebGLRenderer();
const render_w = 640;
const render_h = 480;
renderer.setSize( render_w, render_h ); 
renderer.setViewport(0, 0, render_w, render_h);
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

/* camera */
const camera_ar = new THREE.PerspectiveCamera(45, render_w/render_h, 0.1, 1000);
camera_ar.position.set(-1, 2, 3);
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt(0, 1, 0); // scale이 작게 setting 되어 있음 

const camera_world = new THREE.PerspectiveCamera(45, render_w/render_h, 0.1, 1000);
camera_world.position.set(0, 1, 3);
camera_world.up.set(0, 1, 0);
camera_world.lookAt(0, 1, 0); 
camera_world.updateProjectionMatrix();

/* scene */
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xa0a0a0 );
scene.fog = new THREE.Fog( 0xa0a0a0, ); // plane과 background가 만날 때 gaussian blur를 넣어주기 위함 

/* light */ 
const hemiLight = new THREE.HemisphereLight();
hemiLight.position.set( 0, 20, 0 ); 
scene.add(hemiLight); 

const dirLight = new THREE.DirectionalLight( );
dirLight.castShadow = true;
dirLight.shadow.camera.top = 5;
dirLight.shadow.camera.bottom = -5;
dirLight.shadow.camera.left = -5;
dirLight.shadow.camera.right = 5;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 500; // shadow effect는 비싼 연산에 속한다 
scene.add(dirLight);

/* Add Ground to Scene */
const ground_mesh = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000 ), new THREE.MeshPhongMaterial());
ground_mesh.rotation.x = - Math.PI / 2; 
ground_mesh.receiveShadow = true;
scene.add( ground_mesh );

const grid_helper = new THREE.GridHelper( 1000, 1000 );
grid_helper.rotation.x = Math.PI / 2; 
scene.add(grid_helper);

/* Add Model *
Loader.laod( "./Xbot.glb", function (gltf) {
  model = gltf.scene();
  scene.add( model );

  let bones = [];
  model.traverse ( function (object) {

    if ( object.isMesh ) 
  });

  if (Object.isBone) { 
    skeleton = new THREE.Skeleton(bones);
  }
};
*/



// main rendering thread 하나만 써서 streaming 할 것임 
const test_points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial()); 


/* video background */ 
const texture_bg = new THREE.VideoTexture( videoElement );
scene.background = texture_bg;

/* OrbitControls */
const controls = new OrbitControls( camera_ar, renderer.domElement); 


function ProjScale(p_ms, cam_pos, src_d, dst_d) {
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);  
  
  {
    let pose_landmarks_dict = {};
    results.poseLandmarks.forEach()
  }
      const p_c = new THREE.Vector3(0, 0, 0).unproject(camera_ar);
      const vec_acam2center = new THREE.Vector3().subVectors(p_c, camera_ar.position); // cs에서 WS상의 점 사이의 벡터 
      const center_dist = vec_acam2center.length(); // 위 벡터의 distance : 강의 자료 상 a 값 

      const num_oval_points =FACEMESH_FACE_OVAL.length;
      let positions = oval_point.geometry.attributes.position.array;  
      for (let i =0; i < num_oval_points; i++) {          
        const index = FACEMESH_FACE_OVAL[i][0];  
        const pos_ns = landmarks[index];                      
        const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)* 2, -(pos_ns.y - 0.5)* 2, pos_ns.z);
        let pos_ws = new THREE.Vector3(pos_ps.x, pos_ps.y , pos_ps.z).unproject(camera_ar);
        
        pos_ws = ProjScale(pos_ws, camera_ar.position, center_dist, 100.0); // 강의자료 상 b : 대략 100에 둔다 하자 
        // 이렇게 하면 line, points 가 안보이는데 이는 facemesh는 비례식을 적용해서 되게 앞에 있는 것이고 나머지는 뒤로 빼서 가려져서 안보이는 것임

        //oval_vertices[i] = pos_Ws;
        positions[3 * i + 0] = pos_ws.x;
        positions[3 * i + 1] = pos_ws.y;
        positions[3 * i + 2] = pos_ws.z;
      } 

      oval_line.geometry.attributes.position.array = positions;   // CPU 상으로만 update 되었으므로 아래와 같이 true로 해주면 rendering 시 check 하여 buffer의 resource를 GPU로 옮겨주는 작업을 함  
      oval_line.geometry.attributes.position.needsUpdate = true;  // buffer에 있는 resource를 GPU로 update해줌, update 내용이 없을 때 계속 ture upate 하면 성능최적화에 좋진 않을 것임
      oval_point.geometry.attributes.position.needsUpdate = true;

      /* Face Mesh */
      const num_points = landmarks.length;    // 이런식으로 for문에 직접 넣지 말라고 script 언어 tip에 나와 있음 
      for (let i =0; i < num_points; i++) {   // interpreter language는 내부적으로 매 타임마다 계산해야 하기 때문에... compile 언어는 이럴 필요 없음         
        const pos_ns = landmarks[i];          // normalized space point             
        const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)* 2, -(pos_ns.y - 0.5)* 2, pos_ns.z);
        let pos_ws = new THREE.Vector3(pos_ps.x, pos_ps.y , pos_ps.z).unproject(camera_ar);

        pos_ws = ProjScale(pos_ws, camera_ar.position, center_dist, 100.0); 
        // 이렇게 하면 같이 뒤로 같이 보내짐, 그런데 점의 사이즈가 작아짐 -> Why? 
        // 100 뒤로 보내졌기 때문에 같이 size를 같이 키워줘야 하기 때문임 -> point_mat(size:5)
        
        //oval_vertices[i] = pos_Ws;
        face_mesh.geometry.attributes.position.array[3 * i + 0] = pos_ws.x;
        face_mesh.geometry.attributes.position.array[3 * i + 1] = pos_ws.y;
        face_mesh.geometry.attributes.position.array[3 * i + 2] = pos_ws.z;
        face_mesh.geometry.attributes.uv.array[2 * i + 0 ] = pos_ns.x; // three.js 의 좌표(x,y)이 texture 좌표와 동일함, openGL의 texture coordinate의 원점은 왼쪽 상단임, z축 값은 ps 기준 값으로 넣어뒀음 
        face_mesh.geometry.attributes.uv.array[2 * i + 1 ] = 1.0 - pos_ns.y; // 그런데 뒤집어져서 나옴, mediapipe normalized space : 왼쪽 위 원점, openGL 의 원점 : 왼쪽 아래 = projection space u,v 값도 동일 -> texture coordinate의 v도 반전시켜줘야 함 
      } 
      face_mesh.geometry.attributes.position.needsUpdate = true;
      face_mesh.geometry.attributes.uv.needsUpdate = true; // 마찬가지로 uv 값이 계속해서 update 되기 때문에 true해줘야 함 
      // 즉, position 처럼 update 된 것을 GPU에 넘겨져야 함 
      face_mesh.geometry.computeVertexNormals(); // normal을 쉽게 계산돼서 들어감 -> normal을 만들어서 set 해줌 (needsupdate한다는 뜻)

      let texture_frame = new THREE.CanvasTexture(results.image); // just texture morping 우리가 원하는 것을 하려면 
      face_mesh.material.map = texture_frame; // .map 의 경우는 needsUpdate가 내부적으로 수행됨

      light.target = face_mesh;
    }
    canvasCtx.restore();
  
  renderer.render( scene, camera_ar );
  canvasCtx.restore();
}

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `./node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1,              
  refineLandmarks: true,        
  minDetectionConfidence: 0.5,  
  minTrackingConfidence: 0.5    
  }); 
faceMesh.onResults(onResults);

//const camera = new Camera(videoElement, {
//  onFrame: async () => {
//    await faceMesh.send({image: videoElement});
//  }, 
//  width: 640,  
//  height: 480   
//});  
//camera.start();

videoElement.play();
async function detectionFrame() {                           
    await faceMesh.send({image: videoElement});             
    videoElement.requestVideoFrameCallback(detectionFrame); 
} 
detectionFrame();
