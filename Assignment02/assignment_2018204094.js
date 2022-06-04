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
const renderer_ar = new THREE.WebGLRenderer();
const renderer_world = new THREE.WebGLRenderer();
const render_w = 640;
const render_h = 480;

/* camera */
const camera_ar = new THREE.PerspectiveCamera(45, render_w/render_h, 20, 500);
const camera_world = new THREE.PerspectiveCamera(45, render_w/render_h, 1, 1000);

/* scene */
const scene = new THREE.Scene();

/* light */ 
const light = new THREE.DirectionalLight(0xFFFFFF, 1.0); // color, intensity
const amb_light = new THREE.AmbientLight(0xFFFFFF, 1.0);

/* video background */ 
const texture_bg = new THREE.VideoTexture( videoElement );

/* far-plane background */
const plane_geo = new THREE.PlaneGeometry(render_w, render_h);
const plane_mat = new THREE.MeshBasicMaterial({map:texture_bg});
const plane_bg = new THREE.Mesh( plane_geo, plane_mat );

/* OrbitControls */
const controls = new OrbitControls( camera_world, renderer_world.domElement );

/* helper */
let camera_helper = new THREE.CameraHelper( camera_ar );
let light_helper = new THREE.DirectionalLightHelper(light, 0.3);

/* Custom Mesh */
let oval_point, oval_line, face_mesh = null; 
let point_geo = new THREE.BufferGeometry(); 
let point_mat = new THREE.PointsMaterial({ color: 0xFF0000, size: 3 });    
let line_geo = new LineGeometry();
let line_mat = new LineMaterial({color: 0xFF0000, linewidth:5});
let face_geo = new THREE.BufferGeometry();
let face_mat = new THREE.MeshPhongMaterial({color:0xFFFFFF, specular: new THREE.Color(0, 0, 0), shininess:1000});    

/* mouse event */
let x_prev = render_w / 2;
let y_prev = render_h / 2; 
let mouse_flag = false;

init(); 

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

videoElement.play();
async function detectionFrame() {                           
    await faceMesh.send({image: videoElement});             
    videoElement.requestVideoFrameCallback(detectionFrame); 
} 
detectionFrame();

animate();

function init() { 
  /* renderer setting */
  renderer_ar.setSize( render_w, render_h ); 
  renderer_world.setSize( render_w, render_h ); 
  document.body.appendChild( renderer_ar.domElement );
  document.body.appendChild( renderer_world.domElement );
  
  /* camera setting */
  camera_ar.position.set(0, 0, 90);
  camera_ar.up.set(0, 1, 0);
  camera_ar.lookAt(0, 0, 0);
  camera_world.position.set(130, 70, 200);
  camera_world.up.set(0, 1, 0);
  camera_ar.lookAt(0, 0, 0);

  /* light setting */
  light.position.set(0, 0, 70); 
  
  /* plane mesh -> far plane setting */
  plane_bg.position.set(0, 0, -camera_ar.far);
  
  scene.add(light);
  scene.add(amb_light);
  scene.add( camera_helper );
  scene.add( light_helper );
  scene.add(plane_bg);
  
  renderer_ar.domElement.addEventListener("mousewheel", mouseWheelHandler); 
  renderer_ar.domElement.addEventListener("mousedown", mouseDownHandler);
  renderer_ar.domElement.addEventListener("mousemove", mouseMoveHandler);
  renderer_ar.domElement.addEventListener("mouseup", mouseUpHandler);
}

function projScale(p_ms, cam_pos, src_d, dst_d) {
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
}

function update_light(pos) {
  light.position.set(pos.x, pos.y, pos.z);
  light_helper.update();
}

function compute_pos_ss2ws(x, y, cam) {
  let pos_ps = new THREE.Vector3((x/render_w) * 2 - 1, -(y/render_h) * 2 + 1, -1);
  return pos_ps.unproject(cam);
}

function compute_pos_ns2ws(x, y, z, cam) {
  let pos_ps = new THREE.Vector3((x - 0.5)* 2, -(y - 0.5)* 2, z);
  return pos_ps.unproject(cam);
}

function mouseWheelHandler(e) { 
  e.preventDefault();
  e.stopPropagation();
  camera_ar.near += e.deltaY * - 0.01;
  camera_ar.updateProjectionMatrix();
  let pos_light = compute_pos_ss2ws(x_prev, y_prev, camera_ar);
  //let pos_light = new THREE.Vector3((x_prev/render_w) * 2 - 1, -(y_prev / render_h) * 2 + 1 , -1).unproject(camera_ar);
  update_light(pos_light);
}

function mouseDownHandler(e) {
  mouse_flag = true;
}

function mouseMoveHandler(e) {
  if (mouse_flag) {
    let pos_light = compute_pos_ss2ws(e.clientX, e.clientY, camera_ar);
    update_light(pos_light);
    x_prev = e.clientX;
    y_prev = e.clientY;
  }
}

function mouseUpHandler(e) {
  mouse_flag = false;
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height); 
  
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      /* Oval point */
      if (oval_point == null ) {
        const num_oval_points = FACEMESH_FACE_OVAL.length;      
        const oval_vertices = [];                                 
        for (let i =0; i < num_oval_points; i++) {               
          const index = FACEMESH_FACE_OVAL[i][0];  
          const pos_ns = landmarks[index];                      
          let pos_ws = compute_pos_ns2ws(pos_ns.x, pos_ns.y, pos_ns.z, camera_ar);
          oval_vertices.push(pos_ws.x, pos_ws.y, pos_ws.z);
        } 
       
        /* Oval point */
        point_geo.setAttribute('position', new THREE.Float32BufferAttribute(oval_vertices, 3));
        oval_point = new THREE.Points(point_geo, point_mat);  
        
        /* Oval line */
        oval_line = new Line2(line_geo, line_mat);
        
        /* Face Mesh */
        face_geo.setAttribute('position', new THREE.Float32BufferAttribute(landmarks.length*3, 3));
        face_geo.setAttribute('normal', new THREE.Float32BufferAttribute(landmarks.length*3, 3));   
        face_geo.setAttribute('uv',new THREE.Float32BufferAttribute(landmarks.length*2, 2));       
        face_mesh = new THREE.Mesh(face_geo, face_mat);
        face_mesh.geometry.setIndex(TRIANGULATION); 
      }
      oval_point.geometry.attributes.position.needsUpdate = true;
      
      /* Oval line */
      const p_c = new THREE.Vector3(0, 0, 0).unproject(camera_ar);
      const vec_acam2center = new THREE.Vector3().subVectors(p_c, camera_ar.position); 
      const center_dist = vec_acam2center.length();                                     
      const num_oval_points = FACEMESH_FACE_OVAL.length; // 36
      let positions = oval_point.geometry.attributes.position.array;  
      for (let i =0; i < num_oval_points; i++) {          
        const index = FACEMESH_FACE_OVAL[i][0];  
        const pos_ns = landmarks[index];                      
        let pos_ws = compute_pos_ns2ws(pos_ns.x, pos_ns.y, pos_ns.z, camera_ar);
        pos_ws = projScale(pos_ws, camera_ar.position, center_dist, 100.0); 
        positions[3 * i + 0] = pos_ws.x;
        positions[3 * i + 1] = pos_ws.y;
        positions[3 * i + 2] = pos_ws.z;
      } 
      let line_positions = new Float32Array(positions.length+3);
      line_positions.set(positions, 0);
      line_positions.set([positions[0],positions[1],positions[2]], 108);
      
      line_geo.setPositions(line_positions);
      line_mat.resolution.set( render_w, render_h );
      line_mat.needsUpdate = true;
      oval_line.scale.set( 1, 1, 1 );
      oval_line.geometry.attributes.position.needsUpdate = true;  

      /* Face Mesh */
      const num_points = landmarks.length;    
      for (let i =0; i < num_points; i++) {   
        const pos_ns = landmarks[i];                     
        let pos_ws = compute_pos_ns2ws(pos_ns.x, pos_ns.y, pos_ns.z, camera_ar);
        pos_ws = projScale(pos_ws, camera_ar.position, center_dist, 100.0); 
        face_mesh.geometry.attributes.position.array[3 * i + 0] = pos_ws.x;
        face_mesh.geometry.attributes.position.array[3 * i + 1] = pos_ws.y;
        face_mesh.geometry.attributes.position.array[3 * i + 2] = pos_ws.z;
        face_mesh.geometry.attributes.uv.array[2 * i + 0 ] = pos_ns.x; 
        face_mesh.geometry.attributes.uv.array[2 * i + 1 ] = 1.0 - pos_ns.y; 
      }
      face_mesh.geometry.attributes.position.needsUpdate = true;
      face_mesh.geometry.attributes.uv.needsUpdate = true; 
      face_mesh.geometry.computeVertexNormals(); 

      let texture_frame = new THREE.CanvasTexture(results.image); 
      face_mesh.material.map = texture_frame;       

      scene.add(oval_point);
      scene.add(oval_line);
      scene.add(face_mesh);

      light.target = face_mesh;
      scene.add(light.target);
    }
  }
  canvasCtx.restore();
}

function animate() {
  requestAnimationFrame( animate );

  camera_helper.visible = false;
  light_helper.visible = false;

  // first scene
  scene.background = texture_bg;
  renderer_ar.setViewport( 0, 0, render_w, render_h );
  renderer_ar.render( scene, camera_ar );

  camera_helper.visible = true;
  light_helper.visible = true;

  camera_helper.update();
  light_helper.update();
  controls.update();

  // second scene
  scene.background = new THREE.Color('black');
  texture_bg.needsUpdate = true;
  renderer_world.setViewport( 0, 0, render_w, render_h );
  renderer_world.render( scene, camera_world );
}

