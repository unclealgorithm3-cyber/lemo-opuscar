import * as THREE from 'three';
import { makeCharacters } from './actors.js';
import { createBazaarSet } from './set.js';
import { DUR, shotAt } from './story.js';

const stage = document.getElementById('stage');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2b982);

const camera = new THREE.PerspectiveCamera(
  36,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 3.25, 12.4);
camera.lookAt(0, 2.15, -0.5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

// Warm bazaar lighting
scene.add(new THREE.HemisphereLight(0xffe9cf, 0x80516a, 1.7));

const keyLight = new THREE.DirectionalLight(0xffe0b3, 2.5);
keyLight.position.set(-4, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xc8dcff, 0.8);
fillLight.position.set(5, 4, 3);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffbd67, 45, 18);
rimLight.position.set(0, 5, -3);
scene.add(rimLight);

// Build the shop and its characters
const bazaar = createBazaarSet(scene);
const characters = makeCharacters();

const { aunty, shopkeeper, uncle } = characters;

aunty.root.scale.setScalar(0.94);
shopkeeper.root.scale.setScalar(0.88);
uncle.root.scale.setScalar(0.94);

scene.add(aunty.root);
scene.add(shopkeeper.root);
scene.add(uncle.root);

aunty.root.position.set(-1.28, 0, 0.15);
shopkeeper.root.position.set(0, 0, -2.35);
uncle.root.position.set(3.5, 0, 0.15);
uncle.root.visible = false;

// A small floating discount sign above Aunty
function makeLabel(text, background, width = 1.35, height = 0.38) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 180;

  const c = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = 30;
  sprite.userData.canvas = canvas;
  sprite.userData.context = c;
  sprite.userData.texture = texture;
  sprite.userData.lastText = '';
  sprite.userData.lastBackground = '';

  updateLabel(sprite, text, background);
  return sprite;
}

function updateLabel(sprite, text, background) {
  const data = sprite.userData;
  if (data.lastText === text && data.lastBackground === background) return;

  const c = data.context;
  c.clearRect(0, 0, 640, 180);

  c.fillStyle = background;
  c.beginPath();
  c.roundRect(8, 8, 624, 164, 38);
  c.fill();

  c.lineWidth = 8;
  c.strokeStyle = '#fff0c3';
  c.stroke();

  c.fillStyle = '#fff9e9';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = 'bold 54px Arial, sans-serif';
  c.fillText(text, 320, 90, 570);

  data.texture.needsUpdate = true;
  data.lastText = text;
  data.lastBackground = background;
}

const discountBadge = makeLabel('DISCOUNT ↓', '#a52c50', 1.45, 0.4);
discountBadge.position.set(0, 3.16, 0.42);
aunty.root.add(discountBadge);

// Price board floating over the right side of the counter
const priceBoard = makeLabel('PRICE  ₹5,000', '#244d65', 1.75, 0.48);
priceBoard.position.set(1.47, 1.85, -0.87);
scene.add(priceBoard);

// A separate discount message for the polite customer
const uncleBadge = makeLabel('SPECIAL DISCOUNT', '#24775d', 1.85, 0.43);
uncleBadge.position.set(1.15, 3.1, 0.48);
uncle.root.add(uncleBadge);
uncleBadge.visible = false;

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  overlay.width = w;
  overlay.height = h;
  overlay.style.width = `${w}px`;
  overlay.style.height = `${h}px`;
}

window.addEventListener('resize', resize);
resize();

function smooth(a, b, t) {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

function drawOverlay(t, shot) {
  const w = overlay.width;
  const h = overlay.height;

  ctx.clearRect(0, 0, w, h);

  // Top episode marker
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillStyle = 'rgba(75, 24, 49, 0.78)';
  ctx.fillRect(w * 0.18, h * 0.025, w * 0.64, 52);
  ctx.fillStyle = '#fff2d5';
  ctx.fillText('THE BARGAIN QUEEN OF RANGEELA BAZAAR', w / 2, h * 0.025 + 26);

  // Subtitle panel
  const panelH = Math.max(118, h * 0.105);
  const panelY = h - panelH - h * 0.065;

  ctx.fillStyle = 'rgba(25, 13, 27, 0.86)';
  ctx.beginPath();
  ctx.roundRect(w * 0.055, panelY, w * 0.89, panelH, 22);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 213, 125, 0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fff5df';
  ctx.font = `bold ${Math.max(30, w * 0.043)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shot.caption, w / 2, panelY + panelH / 2, w * 0.82);

  // Scene number
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillStyle = '#fff0ce';
  ctx.textAlign = 'right';
  ctx.fillText(`SCENE ${shot.scene}/22`, w * 0.94, h * 0.93);

  // End card
  if (t >= 87) {
    const fade = smooth(87, 88.1, t);
    ctx.fillStyle = `rgba(34, 13, 35, ${0.86 * fade})`;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe2a0';
    ctx.font = `bold ${Math.max(46, w * 0.085)}px Arial, sans-serif`;
    ctx.fillText('THE BARGAIN QUEEN', w / 2, h * 0.39);

    ctx.fillStyle = '#fff8e9';
    ctx.font = `bold ${Math.max(38, w * 0.07)}px Arial, sans-serif`;
    ctx.fillText('FOLLOW FOR PART 2', w / 2, h * 0.51);

    ctx.fillStyle = '#f7bf61';
    ctx.font = `bold ${Math.max(24, w * 0.04)}px Arial, sans-serif`;
    ctx.fillText('RANGEELA BAZAAR', w / 2, h * 0.59);
  }
}

function render(t) {
  t = THREE.MathUtils.clamp(t, 0, DUR - 0.001);

  const shot = shotAt(t);

  // Aunty remains in the foreground, reacting throughout the story
  aunty.root.position.x = -1.28 + Math.sin(t * 0.65) * 0.035;
  aunty.root.rotation.y = t >= 32 && t < 48 ? -0.12 : 0;
  aunty.update(t, shot.speaker === 'aunty', shot.aunty);

  // Shopkeeper stays behind the counter
  shopkeeper.root.position.x = 0.03;
  shopkeeper.update(t, shot.speaker === 'shop', shot.shop);

  // Uncle enters during scene 13
  const uncleProgress = smooth(48, 51.5, t);
  uncle.root.visible = t >= 48 && t < 87;
  uncle.root.position.x = THREE.MathUtils.lerp(3.5, 1.2, uncleProgress);
  uncle.root.rotation.y = t >= 52 ? -0.05 : -0.18;
  uncle.update(t, shot.speaker === 'uncle', 'normal');

  // Discount and price reveal
  if (t >= 76) {
    updateLabel(discountBadge, 'ONLY 5% OFF', '#a52c50');
  } else if (t >= 36) {
    updateLabel(discountBadge, 'DISCOUNT ↓', '#a52c50');
  } else {
    updateLabel(discountBadge, 'DISCOUNT?', '#a52c50');
  }

  uncleBadge.visible = t >= 56 && t < 68;
  priceBoard.visible = t < 87;

  if (t >= 80) {
    updateLabel(priceBoard, 'PRICE  ₹10,000', '#9c263d');
  } else {
    updateLabel(priceBoard, 'PRICE  ₹5,000', '#244d65');
  }

  drawOverlay(t, shot);
  renderer.render(scene, camera);
}

window.DUR = DUR;
window.render = render;
window.READY = true;

render(0);
