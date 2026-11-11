const W = 1080, H = 1920, DUR = 30;
const canvas = document.getElementById("reel");
const c = canvas.getContext("2d");

let lines = [];
let loaded = false;

const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
const smooth = v => {
  v = clamp(v);
  return v*v*(3-2*v);
};
const lerp = (a,b,t) => a+(b-a)*t;

function rounded(x,y,w,h,r,fill,stroke="#fff",lw=8) {
  c.beginPath();
  c.moveTo(x+r,y);
  c.arcTo(x+w,y,x+w,y+h,r);
  c.arcTo(x+w,y+h,x,y+h,r);
  c.arcTo(x,y+h,x,y,r);
  c.arcTo(x,y,x+w,y,r);
  c.closePath();
  if (fill) { c.fillStyle=fill; c.fill(); }
  if (stroke) { c.lineWidth=lw; c.strokeStyle=stroke; c.stroke(); }
}

function ellipse(x,y,rx,ry,fill,stroke="#fff",lw=7) {
  c.beginPath();
  c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  c.fillStyle=fill;
  c.fill();
  if (stroke) { c.lineWidth=lw; c.strokeStyle=stroke; c.stroke(); }
}

function poly(points,fill,stroke="#fff",lw=8) {
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();
  c.fillStyle=fill;
  c.fill();
  if (stroke) { c.lineWidth=lw; c.strokeStyle=stroke; c.stroke(); }
}

function text(str,x,y,size,color="#26334c",align="center",weight=700) {
  c.save();
  c.font = `${weight} ${size}px "Noto Sans Devanagari", "Noto Sans", sans-serif`;
  c.textAlign=align;
  c.textBaseline="middle";
  c.fillStyle=color;
  c.fillText(str,x,y);
  c.restore();
}

function wrapped(str,x,y,maxWidth,size,lineHeight,color="#26334c") {
  c.save();
  c.font=`700 ${size}px "Noto Sans Devanagari", "Noto Sans", sans-serif`;
  c.textAlign="center";
  c.textBaseline="middle";
  c.fillStyle=color;

  const words=str.split(/\s+/);
  const rows=[];
  let row="";

  for (const word of words) {
    const next=row ? row+" "+word : word;
    if (c.measureText(next).width>maxWidth && row) {
      rows.push(row);
      row=word;
    } else row=next;
  }
  if (row) rows.push(row);

  rows.forEach((r,i)=>c.fillText(r,x,y+(i-(rows.length-1)/2)*lineHeight));
  c.restore();
}

function sticker(fn) {
  c.save();
  c.shadowColor="rgba(66,45,45,.20)";
  c.shadowBlur=18;
  c.shadowOffsetX=5;
  c.shadowOffsetY=13;
  fn();
  c.restore();
}

function background(t) {
  const g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#fff1d8");
  g.addColorStop(.65,"#f8d9c7");
  g.addColorStop(1,"#e9bda9");
  c.fillStyle=g;
  c.fillRect(0,0,W,H);

  // Paper texture dots.
  for(let i=0;i<95;i++) {
    const x=(i*173+53)%W;
    const y=(i*317+81)%H;
    c.globalAlpha=.10;
    ellipse(x,y,3+(i%4),3+(i%4),"#9d765d",null);
  }
  c.globalAlpha=1;

  // Clinic window.
  sticker(()=>{
    rounded(65,570,950,540,35,"#b8e1e5","#fff",15);
    rounded(100,605,880,470,22,"#e5f5eb","#fff",8);
    c.strokeStyle="#fff";
    c.lineWidth=20;
    c.beginPath();
    c.moveTo(540,610);c.lineTo(540,1070);
    c.moveTo(105,840);c.lineTo(975,840);
    c.stroke();
  });

  // Clinic sign.
  sticker(()=>{
    rounded(185,135,710,145,30,"#fff9ed","#fff",12);
    rounded(225,168,65,65,14,"#ed6e69",null);
    c.fillStyle="#fff";
    c.fillRect(250,177,15,48);
    c.fillRect(233,194,49,15);
    text("FAMILY CLINIC",590,207,44,"#355a65");
  });

  // Floor and rug.
  c.fillStyle="#d99e91";
  c.fillRect(0,1660,W,260);
  ellipse(540,1710,430,95,"#e9b5a1",null);

  // Plant.
  sticker(()=>{
    rounded(75,1350,130,175,20,"#d9795c","#fff",10);
    for(let i=0;i<6;i++) {
      c.save();
      c.translate(140,1350);
      c.rotate((i-2.5)*.25);
      ellipse(0,-100-i*9,29,105,i%2?"#5f9d78":"#80ad73","#fff",6);
      c.restore();
    }
  });

  // Small wall decorations.
  sticker(()=>{
    rounded(800,390,170,125,20,"#f8c66b","#fff",9);
    text("SMILE!",885,450,28,"#654b43");
  });

  // Entrance motion accent.
  const pulse=.5+.5*Math.sin(t*4);
  c.globalAlpha=.12+.08*pulse;
  ellipse(970,1140,45,45,"#fff",null);
  c.globalAlpha=1;
}

function drawMother(t, speaking=false) {
  const bob=Math.sin(t*3.4)*5;
  c.save();
  c.translate(255,1000+bob);

  // Feet and sari.
  ellipse(-55,675,55,22,"#513c42");
  ellipse(55,675,55,22,"#513c42");

  sticker(()=>{
    poly([[-120,145],[120,145],[155,655],[-155,655]],"#a94477");
    poly([[-125,210],[70,170],[155,655],[-150,655]],"#ed6c8c");
    poly([[-95,155],[-25,185],[105,650],[5,650]],"#ffcf72");
    poly([[-112,175],[12,190],[145,625],[65,650]],"#b74f83");
  });

  // Blouse and arms.
  poly([[-105,95],[105,95],[125,290],[-125,290]],"#7b386e");
  c.lineWidth=33;
  c.strokeStyle="#d98e61";
  c.lineCap="round";
  c.beginPath();
  c.moveTo(-100,175);c.lineTo(-145,355);
  c.stroke();
  c.beginPath();
  c.moveTo(100,175);c.lineTo(150,speaking?260:350);
  c.stroke();

  ellipse(-145,365,25,25,"#e6a273");
  ellipse(150,speaking?265:360,27,27,"#e6a273");

  // Head and hair.
  sticker(()=>{
    ellipse(0,0,91,105,"#e8ac7c");
    ellipse(-7,-78,100,60,"#28242d");
    ellipse(-93,-10,32,87,"#28242d");
    ellipse(65,-8,42,83,"#28242d");
    ellipse(-90,-74,23,23,"#28242d");
    ellipse(-70,-105,24,19,"#28242d");
  });

  // Sari pallu over head.
  poly([[-92,-78],[-55,-120],[55,-100],[104,40],[70,105],[-80,35]],"#e9a34f");
  c.strokeStyle="#fff0c2";
  c.lineWidth=8;
  c.beginPath();c.moveTo(-60,-106);c.lineTo(69,82);c.stroke();

  // Face.
  ellipse(-32,5,8,10,"#29242b",null);
  ellipse(33,5,8,10,"#29242b",null);
  c.strokeStyle="#9b514d";c.lineWidth=7;
  c.beginPath();
  c.arc(0,46,23,0,speaking?Math.PI:.9*Math.PI);
  c.stroke();
  ellipse(0,22,7,5,"#b94b53",null);
  c.restore();
}

function drawDoctor(t,speaking=false) {
  const bob=Math.sin(t*3.1+1)*5;
  c.save();
  c.translate(815,995+bob);

  ellipse(-45,675,52,20,"#35445b");
  ellipse(45,675,52,20,"#35445b");

  // Trousers.
  poly([[-105,315],[105,315],[95,675],[12,675],[0,440],[-18,675],[-110,675]],"#426889");

  // White coat.
  sticker(()=>{
    poly([[-115,105],[115,105],[165,625],[-165,625]],"#fffdf6");
    poly([[-33,110],[45,110],[12,380],[-12,380]],"#64a6ac");
    poly([[-45,120],[-105,145],[-55,380],[0,290]],"#e8e5d9");
    poly([[45,120],[105,145],[55,380],[0,290]],"#e8e5d9");
  });

  // Stethoscope.
  c.strokeStyle="#31545b";c.lineWidth=12;
  c.beginPath();
  c.moveTo(-37,130);c.lineTo(-37,245);
  c.quadraticCurveTo(-35,315,15,315);
  c.lineTo(20,360);
  c.stroke();
  ellipse(20,370,18,18,"#d2a84f","#fff",5);

  // Arms.
  c.lineCap="round";
  c.strokeStyle="#fffdf6";c.lineWidth=40;
  c.beginPath();c.moveTo(-110,165);c.lineTo(-165,340);c.stroke();
  c.beginPath();c.moveTo(110,165);c.lineTo(165,speaking?275:340);c.stroke();
  ellipse(165,speaking?275:340,25,25,"#e1a173");

  // Head.
  sticker(()=>{
    ellipse(0,0,88,100,"#e5a779");
    ellipse(0,-75,92,47,"#302a2b");
    ellipse(-86,-5,27,72,"#302a2b");
    ellipse(86,-5,27,72,"#302a2b");
  });
  ellipse(-31,5,8,10,"#29242b",null);
  ellipse(31,5,8,10,"#29242b",null);
  c.strokeStyle="#8b4d42";c.lineWidth=7;
  c.beginPath();c.arc(0,43,20,0,speaking?Math.PI:.95*Math.PI);c.stroke();
  c.restore();
}

function drawChild(t) {
  const bob=Math.sin(t*2.7)*4;
  c.save();
  c.translate(540,1300+bob);

  sticker(()=>{
    ellipse(0,0,70,76,"#eab17e");
    ellipse(0,-58,74,36,"#302b2b");
    ellipse(-18,2,7,9,"#29242b",null);
    ellipse(18,2,7,9,"#29242b",null);
    c.strokeStyle="#9c5049";c.lineWidth=6;
    c.beginPath();c.arc(0,32,14,0,Math.PI);c.stroke();

    poly([[-85,92],[85,92],[120,365],[-120,365]],"#5c9cc0");
    c.lineWidth=30;c.strokeStyle="#eab17e";c.lineCap="round";
    c.beginPath();c.moveTo(-72,145);c.lineTo(-100,265);c.stroke();
    c.beginPath();c.moveTo(72,145);c.lineTo(100,265);c.stroke();
    poly([[-80,365],[-10,365],[-5,490],[-80,490]],"#40566c");
    poly([[10,365],[80,365],[85,490],[10,490]],"#40566c");
    ellipse(-45,490,42,17,"#36404d");
    ellipse(45,490,42,17,"#36404d");
  });
  c.restore();
}

function drawThermometer(t) {
  sticker(()=>{
    c.save();
    c.translate(690,1440+Math.sin(t*4)*7);
    c.rotate(-.28);
    rounded(-26,-115,52,210,25,"#fff","#fff",10);
    rounded(-8,-70,16,150,8,"#f36d62",null);
    ellipse(0,88,30,30,"#f36d62","#fff",7);
    text("°",0,-145,42,"#d65f59");
    c.restore();
  });
}

function drawPhone(t) {
  sticker(()=>{
    c.save();
    c.translate(400,1320+Math.sin(t*5)*12);
    c.rotate(-.14);
    rounded(-57,-105,114,205,22,"#26334c","#fff",9);
    rounded(-43,-82,86,160,12,"#8ed3dc",null);
    ellipse(0,77,7,7,"#fff",null);
    text("📱",0,-8,44);
    c.restore();
  });
}

function drawPrescription(t) {
  sticker(()=>{
    c.save();
    c.translate(400,1290);
    c.rotate(-.12);
    rounded(-125,-100,250,215,8,"#fffdf3","#fff",9);
    text("Rx",0,-61,38,"#d96859");
    c.strokeStyle="#67808b";
    c.lineWidth=6;
    for(let i=0;i<3;i++) {
      c.beginPath();
      c.moveTo(-85,-15+i*48);
      c.lineTo(85,-15+i*48);
      c.stroke();
    }
    c.restore();
  });
}

function drawBubble(str,who,t) {
  sticker(()=>{
    rounded(75,300,930,315,48,"#fffdf7","#fff",14);
    // Tail points to the active speaker.
    poly(
      who==="DOCTOR"
        ? [[740,600],[850,600],[825,685]]
        : [[220,600],[340,600],[290,685]],
      "#fffdf7","#fff",10
    );
    const color=who==="MUMMY"?"#b34a77":who==="DOCTOR"?"#357e89":"#bd8740";
    rounded(110,325,220,62,22,color,null);
    text(who,220,356,25,"#fff");
    wrapped(str,540,475,810,47,67,"#303b4b");
  });
}

function drawPhoneIdea(t) {
  c.save();
  c.globalAlpha=.9;
  ellipse(540,1190,94,94,"#fff2a7","#fff",10);
  text("MOBILE",540,1190,25,"#5b5861");
  c.restore();
}

function drawEndCard(t) {
  const a=smooth((t-27.6)/.45);
  c.save();
  c.globalAlpha=a;
  sticker(()=>{
    rounded(65,560,950,720,55,"#fff8e9","#fff",18);
    rounded(160,635,760,115,30,"#e96e72",null);
    text("THE FINAL RESULT",540,690,38,"#fff");
    text("मम्मी : 1",540,880,94,"#ae4b78");
    text("डॉक्टर : 0",540,1045,94,"#327c87");
    text("😂",540,1190,95);
  });
  c.restore();
}

function render(t) {
  t=clamp(t,0,DUR);
  c.clearRect(0,0,W,H);
  background(t);

  // Title.
  text("मम्मी vs डॉक्टर",540,365,65,"#354b58");
  text("एक मज़ेदार क्लिनिक मुलाक़ात",540,430,31,"#98716a", "center",500);

  const active=lines.filter(l=>t>=Number(l.t)).slice(-1)[0];
  const id=active?.id || "";
  const who=id.startsWith("m")?"MUMMY":id.startsWith("d")?"DOCTOR":"STORY";

  const enter=smooth(t/1.1);
  c.save();
  c.globalAlpha=enter;
  drawMother(t,id.startsWith("m"));
  drawDoctor(t,id.startsWith("d"));
  drawChild(t);
  c.restore();

  if(id==="d1" || id==="d2") drawThermometer(t);
  if(id==="m2") {
    drawPhone(t);
    drawPhoneIdea(t);
  }
  if(id==="m3") drawPrescription(t);

  if(active && t<27.65) {
    drawBubble(active.text,who,t);
  }

  if(t>=27.6) drawEndCard(t);

  // Subtle stop-motion frame accent.
  c.save();
  c.globalAlpha=.07;
  text("PAPER CUT • STOP MOTION",540,1830,22,"#533d43");
  c.restore();
}

window.DUR = DUR;
window.render = render;
window.READY = false;

const response = await fetch("lines.json");
if(!response.ok) throw new Error("Could not load reel/lines.json");
lines = await response.json();
await document.fonts.ready;
loaded = true;
window.READY = true;
render(0);
