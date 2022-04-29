import * as THREE from "./node_modules/three/build/three.module.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";  
import { TRIANGULATION } from "./triangulation.js";
import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js';

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

/* light */ 
// normal, uv coordinate, emissive, diffuse, specular setting -> material : MeshPhongMaterial -> face_mat에서 바꿔줬음~ 
// 기본적으로 좀 어두움 -> 이럴 때 넣어줄 것이 ambient light = 주변광, constant하게 빛을 받게 하는 것 
const light = new THREE.DirectionalLight(0xFFFFFF, 1.0); // color, intensity
const amb_light = new THREE.AmbientLight(0xFFFFFF, 0.5);
light.position.set(0, 0, 100); // camera 위치 
scene.add(light);
scene.add(amb_light);

/* video background */ 
const texture_bg = new THREE.VideoTexture( videoElement );
scene.background = texture_bg;

/* OrbitControls */
const controls = new OrbitControls( camera_ar, renderer.domElement); 

/* Custom Mesh */
let oval_point = null; 
let oval_line = new THREE.Line();   // 여러분은 Line2 를 import 해서 사용하세요 
let face_mesh = null;               // this is not mediapipe facemesh

function ProjScale(p_ms, cam_pos, src_d, dst_d) {
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
}

// variable 이름을 수정 + 다른 file에 있는 것도 추적해서 바꿔줌 = refactoring 
// f2 : 해당 문서에 있는 이름만 바꿔줌

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);  // image 로 부터 texture를 가져오는 방법 -> search Three.js 
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      /* 
      console.log(FACEMESH_RIGHT_IRIS); 
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});     // red 
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});      // green
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});       
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});      
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
      */ 

      if (oval_point == null ) {
        let oval_point_geo = new THREE.BufferGeometry();          
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
       
        /* Oval point */
        const point_mat = new THREE.PointsMaterial({ color:0xFF0000, size:3 }); // 그래서 size를 키웠습니다 
        //oval_point_geo.setFromPoints(oval_vertices); 
        oval_point_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices, 3));
        
        /* Oval line */
        let oval_line_geo = new THREE.BufferGeometry();
        //oval_line_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices, 3)); // notion 기록 참고 
        oval_line_geo = new THREE.BufferGeometry();
        oval_line_geo.setAttribute('position', new THREE.BufferAttribute( new Float32Array(num_oval_points*3), 3));
        // oval_line이 array는 new THREE.BufferAttribute( new Float32Array(num_oval_points*3) 되는 것 
        // 괄호 밖 3은 attribute에 쓰이는 array에서 하나의 vertex에 몇 개의 array element를 할당할 것인가 -> x,y,z(3d position)가 들어가야 함 
        // 그러면 3개 단위로 끊어서 들어갈 것임 
        // num_oval_point : 점의 개수 
        // position -> 3d coordinate, (x,y,z) (x,y,z)~ -> 즉 점의 개수 x (x,y,z) 이런식의 array가 담겨 있을 것 
        // 그렇기 때문에 num_oval_point로만 넣으면 (x,y,z)하다가 중간에 끊길 것임 -> 그렇기 때문에 실제 line 보다 1/3 해당하는 buffer만큼만 GPU 에 upload 되니까 x3해줘야 함 
        // first point ~ end point 잇는 것은 알아서 하세요 

        /* Face Mesh */
        // 이번에는 다르게 코딩해볼게요
        // 478 개의 vertex가 들어오는 중 
        // 당연히도 vertex * 3 만큼 저장해야 하지만 당연히 IndexBuffer를 set 안해주면 1,2,3  4,5,6  7,8,9 ...  
        // VertextBuffer가 3배만큼 잡혀야 함 (index를 고려해야 해서)
        // 이렇게 하지 않고 VertexBuffer를 따로 두고 Mediapipe가 제공하는 triangle Index list를 사용할 것임 -> triangulation.js
        let face_geo = new THREE.BufferGeometry();
        face_geo.setAttribute('position', new THREE.Float32BufferAttribute(landmarks.length*3, 3)); // 기니까 정석대로 안하고 wrapper 쓰겠음 
        face_geo.setAttribute('normal', new THREE.Float32BufferAttribute(landmarks.length*3, 3));   // landmarks : triangle vertex array, (x,y,z) 3개 단위로 할당
        face_geo.setAttribute('uv',new THREE.Float32BufferAttribute(landmarks.length*2, 2));        // uv 값만 들어가니까 2개
        // 그런데 Vertex만 들어가면 (Index X) 다 그리는 것도 아니고 일부만 그려지게 됨 
        // topology에 대한 Index Buffer를 줍시다 -> setIndex(TRIANGULATION)
        // CPU Buffer, Array가 미리 지정됨 -> 매 frame마다 update 
        let face_mat = new THREE.MeshPhongMaterial({color:0xFFFFFF,
          specular: new THREE.Color(0, 0, 0), shininess:1000}); // parameter : diffuse color, yellow, set 안하면 그냥 default 
        face_mesh = new THREE.Mesh(face_geo, face_mat);
        face_mesh.geometry.setIndex(TRIANGULATION); // integer array 
        // TRIANGULATION 넣었으니 이제 lighting 넣을 차례 

        oval_line = new THREE.Line(oval_line_geo, new THREE.LineBasicMaterial({color:0x00FF00}));
        oval_point = new THREE.Points(oval_point_geo, point_mat);  
        
        scene.add(oval_point);
        scene.add(oval_line);
        scene.add(face_mesh);
      }

      // Projection space의 원점, depth = 0 중심으로 landmark geometry가 생성되고 있기 때문에 
      // projection space 원점에서 unprojection 한 점 -> p_c : WS 상의 점 
      
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
