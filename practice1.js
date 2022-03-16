// Add simple mouse event ! 
// 1. put 300 x 300 component
// 2. getElementId -> addEventListener -> 300 x 300 영역에서만 event 발생 
document.addEventListener("click", modifyText, false);

function modifyText() {
    const t2 = document.getElementById("mytest");
    t2.textContent = "^^";
}