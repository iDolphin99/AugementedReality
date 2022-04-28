import * as THREE from "./node_modules/three/build/three.module.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";  
import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js';

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
document.body.appendChild( renderer.domElement );

/* camera */
const camera_ar = new THREE.PerspectiveCamera(45, render_w/render_h, 1, 500);
camera_ar.position.set(0, 0, 100);
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt(0, 0, 0);

/* scene */
const scene = new THREE.Scene();

/* video background */
const texture_bg = new THREE.VideoTexture( videoElement );
scene.background = texture_bg;

/* OrbitControls */
const controls = new OrbitControls( camera_ar, renderer.domElement); 

/* contour */
let oval_point_mesh = null;

/* FACEMESH_FACE_OVAL line */
let oval_line = null; 

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      console.log(FACEMESH_RIGHT_IRIS); 
      
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,  
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});     // red 
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});      // green
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});       
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});      
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});

      if (oval_line == null ) {
        let oval_line_geo = new THREE.BufferGeometry();          // oval instance의 point array 넣어 
        const num_oval_points =FACEMESH_FACE_OVAL.length;
        const oval_vertices = [];                                 // element 개수
        for (let i =0; i < num_oval_points; i++) {                // point 개수 만큼 가져올 수 있음, (start, end) 에서 start point만 필요 
          const index = FACEMESH_FACE_OVAL[i][0];  
          const pos_ns = landmarks[index];                        // x, y, z로 되어있는 3d position, NDC 상의 point -> WS 상의 position으로 보내보자 (unproject)
          const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)* 2, -(pos_ns.y - 0.5)* 2, pos_ns.z);
          let pos_ws = new THREE.Vector3(pos_ps.x, pos_ps.y , pos_ps.z).unproject(camera_ar);
          console.log(pos_ns); // FACEMESH 에서 NDC에 정의된 position, Noramlized space의 깊이를 계싼하는 logic에 의한 점 
          console.log(pos_ps);
          console.log(pos_ws); // 위의 점을 WS로 가져온 point, z -> 100에 가까움, camera의 parant scene인 World space에, np = (0,0,99)이므로 여기서 1~만큼 더 간 곳에 np에 굉장히 가까운 곳에 정의되어있음
          //oval_vertices[i] = pos_ws;
          oval_vertices.push(pos_ws.x, pos_ws.y, pos_ws.z);
        } 
        const line_mat = new LineMaterial({ color:0xFFFFFF, lineWidth: 5 });
        const point_mat = new THREE.LineBasicMaterial({ color:0xFF0000, lineWidth:5,  }); // color, size
        oval_line_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices, 3));
        oval_line = new THREE.PointsMaterial(oval_line_geo, line_mat); // geometry(point), material(point material) 들어가야 함, search "point Three.js drawing"  
        
        scene.add(oval_line);
      }
      const num_oval_points =FACEMESH_FACE_OVAL.length;
      let positions = oval_line.geometry.attributes.position.array;  
      for (let i =0; i < num_oval_points; i++) {                // point 개수 만큼 가져올 수 있음, (start, end) 에서 start point만 필요 
        const index = FACEMESH_FACE_OVAL[i][0];  
        const pos_ns = landmarks[index];                        // x, y, z로 되어있는 3d position, NDC 상의 point -> WS 상의 position으로 보내보자 (unproject)
        const pos_ps = new THREE.Vector3((pos_ns.x - 0.5)* 2, -(pos_ns.y - 0.5)* 2, pos_ns.z);
        let pos_ws = new THREE.Vector3(pos_ps.x, pos_ps.y , pos_ps.z).unproject(camera_ar);
        //oval_vertices[i] = pos_Ws;
        positions[3 * i + 0] = pos_ws.x;
        positions[3 * i + 1] = pos_ws.y;
        positions[3 * i + 2] = pos_ws.z;
      } 
      oval_line.computeLineDistances();
      oval_line.scale.set(1, 1, 1);
      oval_line.resolution.set( innerWidth, innerHeight); // resolution of the viewport 
      oval_line.geometry.attributes.position.needsUpdate = true;
    }
  }
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
