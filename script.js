const MAX = 4;
let bottles = [];
let selected = null;
let stage = 1;
let animating = false;

const startBtn = document.getElementById("startBtn");
const homeBtn = document.getElementById("homeBtn");
const startScreen = document.getElementById("startScreen");
const gameContainer = document.getElementById("gameContainer");
const stageText = document.getElementById("stageText");
const clearText = document.getElementById("clearText");
const overlay = document.getElementById("overlay");

const colors = [
  "#ef4444","#3b82f6","#22c55e","#eab308",
  "#a855f7","#ec4899","#14b8a6","#f97316"
];

// 난이도 테이블
const levelConfig = [
  { bottles: 5, colors: 3 },
  { bottles: 6, colors: 4 },
  { bottles: 7, colors: 5 },
  { bottles: 8, colors: 6 },
  { bottles: 9, colors: 7 },
  { bottles: 10, colors: 7 },
  { bottles: 11, colors: 8 },
];

// 시작
startBtn.onclick = () => {
  startScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  stage = 1;
  generate(stage);
  render();
};

// 홈
homeBtn.onclick = () => {
  gameContainer.classList.add("hidden");
  startScreen.classList.remove("hidden");
  stage = 1;
};

// 스테이지 생성
function generate(level){
  let config;

  if(level <= levelConfig.length){
    config = levelConfig[level - 1];
  } else {
    config = {
      bottles: 11 + Math.floor((level - levelConfig.length)/2),
      colors: 8
    };
  }

  let bottleCount = config.bottles;
  let colorCount = config.colors;

  let valid = false;

  while(!valid){
    let pool = [];

    for(let i=0;i<colorCount;i++){
      for(let j=0;j<MAX;j++){
        pool.push(colors[i]);
      }
    }

    shuffle(pool);

    bottles = [];

    for(let i=0;i<colorCount;i++){
      bottles.push(pool.splice(0, MAX));
    }

    while(bottles.length < bottleCount){
      bottles.push([]);
    }

    valid = isSolvableState();
  }
}

// 셔플
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    let j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

// 최소 이동 가능 체크
function isSolvableState(){
  for(let i=0;i<bottles.length;i++){
    for(let j=0;j<bottles.length;j++){
      if(i===j) continue;

      let src = bottles[i];
      let dst = bottles[j];

      if(src.length===0) continue;

      let color = src[src.length-1];

      if(dst.length===0 || dst[dst.length-1]===color){
        if(dst.length < MAX){
          return true;
        }
      }
    }
  }
  return false;
}

// 렌더
function render(){
  const topRow = document.getElementById("topRow");
  const bottomRow = document.getElementById("bottomRow");

  topRow.innerHTML = "";
  bottomRow.innerHTML = "";

  stageText.innerText = `Stage ${stage}`;

  const half = Math.ceil(bottles.length / 2);

  bottles.forEach((b,i)=>{
    const el = createBottle(b,i);
    if(i < half) topRow.appendChild(el);
    else bottomRow.appendChild(el);
  });
}

// 병 생성
function createBottle(b,i){
  const div=document.createElement("div");
  div.className="bottle";
  if(i===selected) div.classList.add("selected");

  b.forEach(c=>{
    const layer=document.createElement("div");
    layer.className="layer";
    layer.style.background=c;
    div.appendChild(layer);
  });

  div.onclick=()=>clickBottle(i);
  return div;
}

// 클릭
function clickBottle(i){
  if(animating) return;

  if(selected===null){
    selected=i;
  } else {
    if(selected===i){
      selected=null;
    } else {
      pour(selected,i);
      selected=null;
    }
  }
  render();
}

// ⭐ 진짜 물 애니메이션
function drawLiquid(fromEl,toEl,color){
  const svg=document.getElementById("liquidSvg");
  svg.innerHTML="";

  const f=fromEl.getBoundingClientRect();
  const t=toEl.getBoundingClientRect();

  const path=document.createElementNS("http://www.w3.org/2000/svg","path");

  const d=`
    M ${f.left+30} ${f.top+20}
    C ${f.left+30} ${f.top-120},
      ${t.left+30} ${t.top-120},
      ${t.left+30} ${t.top+20}
  `;

  path.setAttribute("d",d);
  path.setAttribute("stroke",color);
  path.setAttribute("stroke-width","35");
  path.setAttribute("fill","none");
  path.setAttribute("stroke-linecap","round");
  path.setAttribute("stroke-linejoin","round");
  path.setAttribute("opacity","0.85");

  path.style.strokeDasharray="400";
  path.style.strokeDashoffset="400";
  path.style.transition="0.4s linear";

  svg.appendChild(path);

  requestAnimationFrame(()=>{
    path.style.strokeDashoffset="0";
  });

  // 물 흔들림 효과
  let offset = 0;
  const wave = setInterval(()=>{
    offset += 2;
    path.style.transform = `translateX(${Math.sin(offset/5)*2}px)`;
  },30);

  setTimeout(()=>{
    clearInterval(wave);
    svg.innerHTML="";
  },500);
}

// 이동
function pour(from,to){
  let src=bottles[from];
  let dst=bottles[to];
  if(src.length===0) return;

  let color=src[src.length-1];

  let count=1;
  for(let i=src.length-2;i>=0;i--){
    if(src[i]===color) count++;
    else break;
  }

  if(dst.length!==0 && dst[dst.length-1]!==color) return;

  let space=MAX-dst.length;
  let move=Math.min(space,count);
  if(move<=0) return;

  const els=document.querySelectorAll(".bottle");
  const fromEl=els[from];
  const toEl=els[to];

  animating=true;
  fromEl.classList.add("pouring");

  drawLiquid(fromEl,toEl,color);

  setTimeout(()=>{
    for(let i=0;i<move;i++){
      dst.push(src.pop());
    }

    fromEl.classList.remove("pouring");

    animating=false;
    render();
    checkClear();
  },500);
}

// 완료 체크
function isComplete(b){
  return b.length===MAX && b.every(v=>v===b[0]);
}

// 클리어 처리
function checkClear(){
  let win=bottles.every(b=>b.length===0||isComplete(b));

  if(win){
    animating = true;

    overlay.classList.remove("hidden");
    clearText.classList.remove("hidden");

    setTimeout(()=>{
      overlay.classList.add("show");
      clearText.classList.add("show");
    },10);

    setTimeout(()=>{
      overlay.classList.remove("show");
      clearText.classList.remove("show");

      setTimeout(()=>{
        overlay.classList.add("hidden");
        clearText.classList.add("hidden");

        stage++;
        generate(stage);
        render();

        animating = false;
      },300);
    },2000);
  }
}