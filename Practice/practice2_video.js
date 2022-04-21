/* MediaPipe */
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

// 상대경로가 아닌 package name 바로 적었음, 이를 해결해야 import가 됨 
// 이를 해결하는 것이 Importmap
import * as THREE from "./node_modules/three/build/three.module.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js"; // jsm : js module version 

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
// camera 가 OrbitControl 안에 들어가므로 OrbitControl이 알아서 내부적으로 setting 해주므로 이제 camera 관련 작업ㅇ르 할 필요 없음 
// (three package 상대 경로 수정) -> OrbitControl 생성 -> camera 연결 -> upate 
const controls = new OrbitControls( camera_ar, renderer.domElement); // render, camera 

// processing이 끝나고 매 frame마다 호출되는 function 
function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      console.log(FACEMESH_FACE_OVAL); 
      // pair로 저장된 array, 35개의 array로 되어 있음, index 값이 두 개씩 나옴 (index로 추정)
      // array가 line의 시작점, 끝점일 확률이 높음 (contour하게 그려지기 때문에, 대략적으로 그려지기 때문에)
      // 얼굴 외곽을 그리고 있기 때문에 array가 순차적으로 그려지고 있음 10, 388 -> 388, 297 -> 297...
      // 만약 LineStrip 자료구조를 사용한다면 앞에 숫자들만 순차적으로 저장되어 있어도 line을 그릴 수 있을 것임!  
      
      // landmarks is element of results.multiFaceLandmarks 
      // faceMesh 자료구조는 reulsts.multiFaceLandMarks가 됨 = NormalizedLandmarkListList -> list 첫 번째는 얼굴들, 두 번째는 얼굴 안의 landmarks list 
      // 즉, landmarks is NormalizedLandmark[] 
      // console.log(landmarks); 
      // console.log(landmarks[300])
      // 위 console을 확인하면 478개의 landmark가 있다고 나옴, 300번째 것을 찍어보니 3D coordinate 좌표(x,y,z)가 나옴
      // 3차원 좌표가 normalizedLandmark[]임 
      // Why? -> 3d 좌표는 NDC space 상의 값을 저장해서 보여준다는 것을 알 수 있음 
      // 왜 3D world 가 아닌가? 어디가 3d world 인지 알 수 없고 
      // caemra parameter를 알아야지 projection matrix가 계산됨, camera마다 다르고 parameter도 알 수 없기 때문에 
      // 그저 image로 부터 3D 점을 추론하기 때문에 camera parameter는 알 수 없지만 
      // 가상의 projection matrix는 만들 수 있음 (편의로 만든 것, 저장한 것, 엄밀한 camera parameter로부터 온 것이 아니라)
      // 가상의 space를 projection matrix를 거치면 NDC 공간에 저장되기 때문에(어디서든 똑같이 정의되는 Normalized 공간) 공통의 space 라고 봐도 됨
      // notion 필기 참고 

      // openGL 에서의 NDC 는 x,y,z 각각이 -1~1로 normalized 되어 있으므로 이를 알 수 있음
      // 해당 점들은 Normalized space에 있는 것이고, 그럴듯하게 World space의 scale에 맞게끔 back-projection 해야 함
      // back-projection : Three.unproject()를 썼어야 함 
      // SS 10 px -> NDC, viewport -> CS, WS 옮기는 과정에서 unproject() 함수가 필요하기 때문
      // 3d landmarks points를 unprojection 합쉬다~~ 
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,  
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});     // 하나하나 주석처리 하면서 뭐가 그려지는지 확인하세요 
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});     // 얼굴 외형 잡는것, common JS에서 옴, LandmarkConnectionArray = javascript array와 같다! 
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
      // drawConnector : drawing_utils에서 옴, WebGL 내부적으로 구현됨 
      // mediapipe가 제공하는 function을 사용하면 제한적인 기능만 이용하여 service를 제작하게 됨 (For customized)
      // drawing utils Interface를 잘 이해해야 하기도 함
      // 내부적으로 구현된 코드를 수정해서 쓸 바에는 CG, CV 기본지식을 가지고 원하는 application을 만들기 바람 
    }
  }
  // scene에 아무것도 등록되어 있지 않음 -> background : black 
  // camera rendering을 했으므로 frame이 black으로 나오며, document.domelement 아래에 붙게 됨 
  // 해당 space에 video를 붙일 것임 
  // landmarks = 3D points 라는 것을 명심하자
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
// start 해야지 내부적으로 동작하도록 되어 있음 -> start를 하지 않으면 source video output 


videoElement.play();
async function detectionFrame() {                           // 매 frame 마다 선언된 해당 function을 호출해주어야 함 
    await faceMesh.send({image: videoElement});             // processing
    videoElement.requestVideoFrameCallback(detectionFrame); // 얘 때문에 매 frame 마다 호출되는 중 -> 그때마다 onResults 호출
} 
detectionFrame();
// Three.js 매 frame Rendering 할 때, reaquest(animation~) 이런식으로 작성한 것과 문법이 비슷함 