// js is runtime interpreter
// 그래서 위에서 부터 실행하다가 오류가 나면 거기서부터 실행 안함 
// How to import three.js library on javascript? -> node_modules... 이런식으로 
// How to drawing lines with three.js lib?
import * as THREE from '../node_modules/three/build/three.module.js';

// drawing lines 
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); // window 말고 document도 가능
renderer.setViewport(0,0,window.innerWidth, window.innerHeight); // 명시적인 viewport transform definition 
document.body.appendChild( renderer.domElement ); // renderer를 document의 element화, web prog의 canvas랑 같이 생각하면 됨 

// persepectiveCamera 를 통해 projection transform 정의 
// rendering 시 다음의 camera를 쓰겠다
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
// line, camera 둘 다 object 3d임 -> object 개념, object가 scene에 어떻게 배치되는지에 대한 개념을 이해해야 함 
// transform, space에 대해서 배울 때 object가 space에 배치되는 것을 정의하기 위해서는 
// object가 어떤 point에 위치하고 어떤 orientation을 갖느냐에 따라 배치됨 
// orientation과 po

// line object 의 default value = Identity matrix를 의미 
// 즉 그래서 정리하자면 line.position, line.lookat은 line object의 OS 자체의 보는 방향, 위치를 바꿔주는 것임 
// line object가 OS상에서 보는 방향이 어디인가? = line.lookat
line.position.set(0, 5, 0);
line.up.set(0, 1, 0);
line.lookAt(0, 0, -1);
// World 중심의 y축 방향으로 5만큼 이동한다면? 하지만 변화가 없음 
// 이때 변화를 주기 위해서는 matrixAutoUpdate 를 false로 설정해줘야 함 
// 아 시발 위에서 왜 찌그러졌냐면 line.lookat(0,0,-1)은 이 object 자체가 바라보는 방향이 -z방향이라는 것임 
// 그니가 지딴에는 postion 돌아간다고 해도 제자리에서 빙글 돈거임
// 근데 이제 Translation matrix로 위치 자체를 옮기면 이런 일이 안생김 염병 맞냐? 
// x축 방향으로 -70도 돌리고 postion 자체를 올렷을 때 위에서 line.position(0,5,0)과 같은 output이 나옴 
// 그리고 line.position.set(0,5,0)로 옮기고 싶으면 lookat도 같이 옮겨줘야 함 line.lookat(0, 5, -1)
line.matrixAutoUpdate = false;
let mat_rr = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-40));
line.matrix = new THREE.Matrix4().makeTranslation(0, 0, 80);
//line.matrix = new THREE.Matrix4().makeTranslation(0, 0, 0).multiply(mat_r);

// geometry algbra가 익숙하지 않을 경우 three.js 의 helper를 지원하지만 쓰지 마시길 바랍니다 
// 직접 matrix로 setting 하길 강요함 
// 여기서는 viewport transform은 정의되어 있지 않음 -> default value로 돌아가고 있다는 뜻 
// 하지만 모든 코딩은 명시적으로 하셔야 합니다! (see upper code line)

/* box example */  
//const texture = new THREE.TextureLoader('./test.png').load();
const geo_box = new THREE.BoxGeometry(5, 5, 5);
const material_box = new THREE.MeshPhongMaterial({ color : 0xFFFFFF, emissive : 0x101000, specular : 0xFF0000, shininess : 1000}); // 선이 아니면 mesh를 사용한다! 
const boxObj = new THREE.Mesh(geo_box, material_box);

boxObj.matrixAutoUpdate = false;
// rotation에 의해서 box가 돌아간 것을 인지할 수 있음 
let mat_r = new THREE.Matrix4.makeRotationX(three.MathUtils.degToRad(-40));
boxObj.matrix = new THREE.Matrix4().makeTranslation(0, 0, 80);//.multiply(mat_r);

const light = new THREE.DirectionalLight(0xffffff, 0.5);  // light, intenserty, 1이면 full 흰색 

scene.add(light); // light을 반영하기 위해서는 scene에 넣어야죵 
scene.add(boxObj); 
// default model transform matrix : identity matrix, 즉 World space의 postion 그대로 들어감 
scene.add(line);
renderer.render(scene, camera); 
// rendere 부분에서 내부 matrix를 정의해 줌 -> 확인하는 방법 .matrix 
// .matrix를 set하면 자동으로 .matrixWorld도 set 됨 -> 부모-자식 관계에 의하여 


function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
}

// Add simple mouse event ! 
// 1. put 300 x 300 component
// 2. getElementId -> addEventListener -> 300 x 300 영역에서만 event 발생 
// 하지만 전체 화면을 클릭할 때 글자가 바뀌도록 event 처리 
document.addEventListener("click", modifyText, false);

function modifyText() {
    const t2 = document.getElementById("mytest");
    t2.textContent = "^^";
}

// e.g.,
// cube matrix에 sphere matrix 값을 똑같이 넣어주고 싶음 
//Sphere.matrix = ... 
//cube.matrix = sphere.matrix;
// 이 경우 call-by-reference 특징 때문에 sphere.matrix의 property가 바뀌는 경우 cube.matrix의 값도 바뀜
// 그래서 일반적인 C코드 상의 call-by-value적으로 작성하기 위해서는 
//cube.matrix = sphere.matrix.copy(); 
// 위와 같이 작성하여 독립적인 property를 갖게 해야 함 
