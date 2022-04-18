import * as THREE from "./node_modules/three/build/three.module.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";  

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

let point_mesh = null; 
function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      console.log(FACEMESH_RIGHT_IRIS); 
      // drawConnectors -> common JS style code, draw.utils 에 정의된 것들임 
      // mediapipe의 caemra.utils만 사용할 것임 -> draw 관련 utils은 사용하지 않고 Three.js를 사용할 것임 
      
      // canvasCtx = canvas에 연결되어 있는 2d context에 
      // landmarks 를 그리겠다 = array 
      
      // FACEMESH_RIGHT_IRIS : array 4개 반환 (3d 점의 array)
      // 앞에 있는 점의 의미는 대략적으로 landmarks point의 index라고 이해하면 됨 
      // 뒤에 있는 점은 line으로 연결되어 있기 때문에 다음 점을 의미함 (엥 근데 x 값만 나오네..? y값은 어데갔누)
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

      // FACEMESH_FACE_OVAL, landmarks 만 사용하면 됨 
      if (point_mesh == null ) {
        let oval_point_geo = new THREE.BufferGeometry();          // oval instance의 point array 넣어 
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
        const point_mat = new THREE.PointsMaterial({ color:0xFF0000, size:0.05 }); // color, size
        oval_point_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices, 3));
        point_mesh = new THREE.Points(oval_point_geo, point_mat); // geometry(point), material(point material) 들어가야 함, search "point Three.js drawing"  
        scene.add(point_mesh);
        // 위치 엉망, 뒤집힌거 엉망 -> why? 
        // landmarks의 점은 0~1 사이의 normalized space points 
        // unprojection 할 때 대상이 되는 점은 projection space 상에 정의되어 있는 점임 
        // 그러므로 Normalized space 점을 projection space로 옮겨줘야 함 

        // 해결! 그러나 왜 뒤집어져 있는가? 
        // Mediapipe의 x, y direction 과 projection space 상의 x, y direction이 다릐기 때문 
        // Mediapipe는 image 중심의 x, y direction을 정의하였고 (아래로 y, 오른쪽으로 x)
        // projection space는 위쪽 방향이 y임 
        // space 간의, library를 만든 사람이 만든 space, space-space 간의 좌표계를 맞춰주는 작업 = Transform 
        // 근거를 가지고, google은 image 중심의 space이므로 y축이 아래로구나.. 이런식으로 근본있는 코딩을 하시길 바랍니다 
      }
      // 매 frame 마다 point가 수정되어야 함 
      // Important : FACEMESH를 update 하는 방법들은 다양할 것임 
      // 1. 똑같은 logic으로 face 생성 -> scene.add -> MEsh 개많아짐 (이전 mesh를 지우던가) 
      // 2. 이미 정의된 point mesh 점에서 buffer attribute의 내용물을 바꾸는 방향으로 update -> 당연히 better than 
      // script 언어에서는 new, new ... 하는 것은 memory management에 의해서 졸라 혼남 (안쓰는 memory gabage collector에 의해 수거되지만... 그전엔 냅다 혼남)
      // javascript는 runtime 때 무엇인지 알기 때문에 intelligence가 작동 하지 않음
      // Typescript라면 이게 무슨 type이라고 명시되어 있을 것이기 때문에 찾고자 하는 function, attribute가 intelligence가 작동할 것임 
      // 입다물고 typescript 쓰자... 
      const num_oval_points =FACEMESH_FACE_OVAL.length;
      let positions = point_mesh.geometry.attributes.position.array;  
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
      point_mesh.geometry.attributes.position.needsUpdate = true;
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
