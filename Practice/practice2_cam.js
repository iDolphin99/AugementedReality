const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

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

// create faceMesh 
const faceMesh = new FaceMesh({locateFile: (file) => {
  return `./node_modules/@mediapipe/face_mesh/${file}`; // 직접 설치했기 때문에 cdn에서 가져올 필요 없음, local 에서 load Mesh files 
}});
faceMesh.setOptions({           // faceMesh에 들어가는 내용 -> face detection한 것으로부터 3D mesh 생성함
  maxNumFaces: 1,               // 몇 명 까지 detection 할 지 
  refineLandmarks: true,        // Irish Tracking : true 
  minDetectionConfidence: 0.5,  
  // 내부적으로 각 feature point 를 randmark로 정하게 됨 -> face mesh의 vertex들이 randmark라고 보면 됨 
  // randmark points 300~400개 -> 내부적인 ML알고리즘에 의해서 probability 값이 계산되고 특정 conffidence 값 이하는 제외, 제외 한 것 나머지들에 대해서 순차적으로 할당함(=Threshold)
  // 0.5 보다 높이면 더 잘 세밀하게 detection 함 -> 그러나 0.99까지 올리면 tracking이 안될 수 있음 
  // randmarks point들이 0.99 이상이 안될 수 있기 때문 (99% 이상의 confidence를 갖지 않으면 tracking하지 않겠다) -> 굉장히 신뢰도 높은 tracking 결과를 보여줘야 할 때 사용하는 option
  minTrackingConfidence: 0.5    
  // mask 안에 있는 요소들(입)은 confiddence가 굉장히 낮게(부정확하게) tracking 될 것임
  // 기본적으로 DL이 probability 값을 출력하기에 더 높은 confidence의 randmark 위주로 잡히게 됨 (얼굴 일부를 가려도)
}); 
faceMesh.onResults(onResults);
// onResults : call-back function
// faceMesh가 내부적으로 영상을 받아들여서 processing 후 randmark를 생성함
// 만든 후 onResults(위에 줄)이라는 등록된 function을 call-back 함 ->위에 함수를 바꾸면 괄호안에 있는 것을 바꿔야 함!!!! 

// camera : video를 매 frame 마다 proessing 하는 다양한 방법들이 존재함 
// 여기 code에서는 html에서 camera_utils.js에서 오는 것
// 본인들이 만든 mediapipe solution과 잘 연동되도록 wrapping 한 것 = camera_utils 
const camera = new Camera(videoElement, { // {} -> 생성자 function
  onFrame: async () => {                        // 내부적으로 onFrame property : 매 frame마다 호출되는 call-back function에 등록해라~ 이런식일듯 
    await faceMesh.send({image: videoElement}); // video image를 input으로 받아서 facemesh의 input으로 넣고, 처리될 때 까지 await
  },            // 매 frame마다 수행하는 function(생성자)부분
  width: 1280,  // property map, video strim의 크기  
  height: 720   // property map 
});  
camera.start(); // 돌아가기 시작 -> 매 frame 마다 수행, 내부적으로 faceMesh로부터 randmark가 다 계산되면 위에서 나온 onResults call-back function이 수행될 것임 