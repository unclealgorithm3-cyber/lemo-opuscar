import * as THREE from 'three';

function makeBox(scene, w, h, d, color, x, y, z, options = {}) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

function makeSign(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 300;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7b1745';
  ctx.fillRect(0, 0, 1200, 300);

  ctx.strokeStyle = '#ffd66b';
  ctx.lineWidth = 18;
  ctx.strokeRect(14, 14, 1172, 272);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff4d4';
  ctx.font = 'bold 112px Arial';
  ctx.fillText('RANGEELA BAZAAR', 600, 133);

  ctx.fillStyle = '#ffd66b';
  ctx.font = 'bold 38px Arial';
  ctx.fillText('SAREE  •  STYLE  •  SMILES', 600, 232);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 1.125),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.75
    })
  );

  sign.position.set(0, 4.45, -4.72);
  scene.add(sign);
  return sign;
}

function makeSaree(scene, x, y, z, color, index) {
  const geometry = new THREE.PlaneGeometry(0.56, 2.0, 8, 16);
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const px = positions.getX(i);
    const py = positions.getY(i);
    const wave = Math.sin(py * 7 + index) * 0.055;
    positions.setZ(i, wave + px * px * 0.18);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    side: THREE.DoubleSide
  });

  const cloth = new THREE.Mesh(geometry, material);
  cloth.position.set(x, y, z);
  cloth.rotation.y = -0.12 + index * 0.025;
  scene.add(cloth);

  // Decorative lower border
  const border = makeBox(
    scene, 0.56, 0.11, 0.035,
    0xf5ce69, x, y - 0.96, z + 0.025
  );

  return { cloth, border };
}

export function createBazaarSet(scene) {
  // Warm bazaar background
  scene.background = new THREE.Color(0xf2b982);

  makeBox(scene, 13, 8, 0.35, 0xe9a66f, 0, 3.8, -5.35);

  // Decorative wall panels
  const panelColors = [
    0xf5c17c, 0xf3aa78, 0xffd18a, 0xe99b72
  ];

  for (let i = 0; i < 4; i++) {
    makeBox(
      scene, 2.8, 4.3, 0.08,
      panelColors[i],
      -4.2 + i * 2.8, 3.3, -5.12
    );
  }

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({
      color: 0xc98157,
      roughness: 0.95
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.025;
  scene.add(floor);

  // Subtle floor tile lines
  const grid = new THREE.GridHelper(16, 16, 0xa76547, 0xb87651);
  grid.position.y = 0.005;
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  scene.add(grid);

  // Shop sign
  const sign = makeSign(scene);

  // Canopy support posts
  makeBox(scene, 0.18, 3.15, 0.18, 0x743b37, -2.45, 3.0, -2.45);
  makeBox(scene, 0.18, 3.15, 0.18, 0x743b37,  2.45, 3.0, -2.45);

  // Striped fabric canopy
  const canopyColors = [
    0xe94354, 0xffd56d, 0x398b83,
    0xf5eee0, 0xe94354, 0xffd56d,
    0x398b83, 0xf5eee0
  ];

  for (let i = 0; i < canopyColors.length; i++) {
    makeBox(
      scene, 0.62, 0.16, 2.6,
      canopyColors[i],
      -2.17 + i * 0.62, 4.75, -2.85
    );
  }

  // Canopy front valance
  makeBox(scene, 5.0, 0.38, 0.13, 0x9b2450, 0, 4.48, -1.55);

  // Decorative canopy scallops
  for (let i = 0; i < 9; i++) {
    const scallop = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd56d })
    );
    scallop.scale.set(1, 0.7, 0.45);
    scallop.position.set(-2.35 + i * 0.59, 4.28, -1.55);
    scene.add(scallop);
  }

  // Saree display rack
  makeBox(scene, 0.12, 2.8, 0.12, 0x70463b, -2.2, 2.65, -3.85);
  makeBox(scene, 0.12, 2.8, 0.12, 0x70463b,  2.2, 2.65, -3.85);
  makeBox(scene, 4.55, 0.12, 0.12, 0x70463b, 0, 3.95, -3.85);

  const sareeColors = [
    0xb91f52, 0x176b65, 0xe3a52e,
    0x633e9d, 0xd94b37, 0x2677a5,
    0x8b3159
  ];

  for (let i = 0; i < sareeColors.length; i++) {
    makeSaree(
      scene,
      -1.85 + i * 0.61,
      2.75,
      -3.72,
      sareeColors[i],
      i
    );
  }

  // Shop counter — characters stand in front of it
  makeBox(scene, 3.9, 0.92, 0.85, 0x8c3d3b, 0, 0.62, -1.55);
  makeBox(scene, 4.05, 0.16, 0.96, 0xf4c16c, 0, 1.16, -1.55);

  // Counter front decorative panels
  for (let i = 0; i < 5; i++) {
    makeBox(
      scene, 0.58, 0.52, 0.035,
      i % 2 === 0 ? 0xd85a4e : 0xe99a54,
      -1.55 + i * 0.77, 0.62, -1.105
    );
  }

  // Folded sarees on the counter
  const foldedColors = [0x4f4b9b, 0xd83e65, 0x168b7d];

  for (let i = 0; i < 3; i++) {
    makeBox(
      scene, 0.78, 0.12, 0.48,
      foldedColors[i],
      -1.1 + i * 1.1, 1.31, -1.48
    );
    makeBox(
      scene, 0.78, 0.035, 0.49,
      0xf6d477,
      -1.1 + i * 1.1, 1.39, -1.48
    );
  }

  // Decorative hanging lanterns
  for (let i = 0; i < 3; i++) {
    const x = -1.7 + i * 1.7;

    makeBox(scene, 0.035, 0.42, 0.035, 0x70463b, x, 4.05, -2.1);

    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 16),
      new THREE.MeshStandardMaterial({
        color: i === 1 ? 0xffd36b : 0xf0784f,
        emissive: 0x4a1808,
        roughness: 0.5
      })
    );

    lantern.scale.set(0.8, 1.2, 0.8);
    lantern.position.set(x, 3.78, -2.1);
    scene.add(lantern);
  }

  return {
    sign,
    floor,
    counterZ: -1.55,
    cameraTarget: new THREE.Vector3(0, 2.35, -0.5)
  };
}
