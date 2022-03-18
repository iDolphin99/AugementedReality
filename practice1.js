// js is runtime interpreter
// 그래서 위에서 부터 실행하다가 오류가 나면 거기서부터 실행 안함 
// How to import three.js library on javascript? -> node_modules... 이런식으로 
// How to drawing lines with three.js lib? 
import * as THREE from './node_modules/three/build/three.module.js';

// drawing lines 
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); // window 말고 document도 가능
renderer.setViewport(0,0,window.innerWidth, window.innerHeight); // 명시적인 viewport transform definition 
document.body.appendChild( renderer.domElement ); // renderer를 document의 element화, web prog의 canvas랑 같이 생각하면 됨 

// persepectiveCamera 를 통해 projection transform 정의 
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 ); // np, perspective ratio, fp... parameter 
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 ); // default value of up-vector : 0, 1, 0 
camera.up.set(0,1,0);     // 명시적으로 up vector를 setting 
// position, lookat, up 을 통해 view transform을 정의, 이또한 matrix로 setting 가능 

const scene = new THREE.Scene();

const points = [];
points.push( new THREE.Vector3( - 10, 0, 0 ) );
points.push( new THREE.Vector3( 0, 10, 0 ) );
points.push( new THREE.Vector3( 10, 0, 0 ) );

// point 세 개를 저장하는 array buffer로 생각하면 됨 
const geometry = new THREE.BufferGeometry().setFromPoints( points ); 
// define line
// ui에서 path를 여기서는 line strip이라고 하는데 무슨 소린지 몰?루
// material : line의 property, 빛을 반사하는 속성 
const material = new THREE.LineBasicMaterial({color : 0xFFFFff});
const line = new THREE.Line( geometry, material );  
// i.e, 모든 3d 객체는 material이 필요하다 

// geometry algbra가 익숙하지 않을 경우 three.js 의 helper를 지원하지만 쓰지 마시길 바랍니다 
// 직접 matrix로 setting 하길 강요함 
// 여기서는 viewport transform은 정의되어 있지 않음 -> default value로 돌아가고 있다는 뜻 
// 하지만 모든 코딩은 명시적으로 하셔야 합니다! (see upper code line)

// default model transform matrix : identity matrix, 즉 World space의 postion 그대로 들어감 
scene.add(line);
renderer.render(scene, camera); 

// Add simple mouse event ! 
// 1. put 300 x 300 component
// 2. getElementId -> addEventListener -> 300 x 300 영역에서만 event 발생 
// 하지만 전체 화면을 클릭할 때 글자가 바뀌도록 event 처리 
document.addEventListener("click", modifyText, false);

function modifyText() {
    const t2 = document.getElementById("mytest");
    t2.textContent = "^^";
}
