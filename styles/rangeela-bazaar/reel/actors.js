import * as THREE from 'three';

const mat = (color, roughness = 0.72) =>
  new THREE.MeshStandardMaterial({ color, roughness });

const sphere = (parent, material, position, scale) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 24),
    material
  );
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

function makeCharacter(config) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = mat(config.body);
  const white = mat('#fffaf0');
  const black = mat('#201522');
  const mouthMat = mat('#42151b');
  const outfit = mat(config.outfit);
  const gold = mat('#f4c64c');
  const leafMat = mat('#319b50');

  // Fruit-shaped body
  const fruit = sphere(body, skin, [0, 1.65, 0], config.shape);
  fruit.scale.y *= 1.08;

  // Outfit
  sphere(body, outfit, [0, 0.83, 0], [0.57, 0.65, 0.48]);

  // Eyes
  const eyes = [];
  for (const x of [-0.25, 0.25]) {
    sphere(body, white, [x, 1.92, 0.405], [0.145, 0.19, 0.09]);
    const pupil = sphere(
      body, black, [x + 0.015, 1.91, 0.485],
      [0.066, 0.105, 0.045]
    );
    eyes.push(pupil);
  }

  // Eyebrows
  const brows = [];
  for (const x of [-0.25, 0.25]) {
    const brow = sphere(
      body, black, [x, 2.16, 0.42], [0.17, 0.045, 0.045]
    );
    brows.push(brow);
  }

  // Animated mouth
  const mouth = sphere(
    body, mouthMat, [0, 1.55, 0.49], [0.13, 0.035, 0.045]
  );

  // Cheeks
  const cheekMat = mat('#f58d87');
  for (const x of [-0.43, 0.43]) {
    sphere(body, cheekMat, [x, 1.65, 0.39], [0.09, 0.055, 0.035]);
  }

  // Arms
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.48, 1.12, 0);
    body.add(pivot);

    const arm = sphere(
      pivot, skin, [side * 0.18, -0.25, 0],
      [0.14, 0.38, 0.14]
    );
    arm.rotation.z = side * -0.35;

    sphere(
      pivot, skin, [side * 0.2, -0.5, 0.02],
      [0.17, 0.16, 0.16]
    );
    arms.push(pivot);
  }

  // Legs and shoes
  for (const x of [-0.23, 0.23]) {
    sphere(body, outfit, [x, 0.28, 0], [0.16, 0.3, 0.17]);
    sphere(body, black, [x, 0.09, 0.09], [0.2, 0.1, 0.28]);
  }

  // Character-specific decoration
  if (config.kind === 'apple') {
    const stem = sphere(body, mat('#654322'), [0, 2.63, 0], [0.055, 0.19, 0.055]);
    stem.rotation.z = -0.2;
    const leaf = sphere(body, leafMat, [0.2, 2.68, 0], [0.23, 0.09, 0.12]);
    leaf.rotation.z = 0.4;

    // Saree border
    sphere(body, gold, [0, 0.83, 0.43], [0.58, 0.055, 0.055]);
  }

  if (config.kind === 'mango') {
    sphere(body, gold, [0, 1.42, 0.49], [0.24, 0.055, 0.025]);
    sphere(body, mat('#56301e'), [0, 1.7, 0.51], [0.22, 0.035, 0.035]);
  }

  if (config.kind === 'strawberry') {
    const seedMat = mat('#d8eaff');
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      const x = Math.sin(a) * 0.43;
      const y = 1.2 + (i % 3) * 0.3;
      sphere(body, seedMat, [x, y, 0.36], [0.025, 0.04, 0.025]);
    }
    const leaf = sphere(body, leafMat, [0, 2.62, 0], [0.35, 0.08, 0.22]);
  }

  root.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  function update(t, speaking = false, emotion = 'normal') {
    const bob = Math.sin(t * 4) * 0.035;
    body.position.y = bob;

    mouth.scale.y = speaking
      ? 0.035 + Math.abs(Math.sin(t * 13)) * 0.11
      : 0.035;

    const blink = Math.sin(t * 2.7 + config.offset);
    eyes.forEach(e => {
      e.scale.y = blink > 0.985 ? 0.015 : 0.105;
    });

    arms[0].rotation.z = -0.12 + Math.sin(t * 3) * 0.08;
    arms[1].rotation.z = 0.12 - Math.sin(t * 3) * 0.08;

    if (emotion === 'angry') {
      brows[0].rotation.z = -0.3;
      brows[1].rotation.z = 0.3;
    } else if (emotion === 'surprised') {
      brows.forEach(b => b.position.y = 2.23);
    } else {
      brows.forEach(b => {
        b.rotation.z = 0;
        b.position.y = 2.16;
      });
    }
  }

  return { root, body, arms, eyes, mouth, update };
}

export function makeCharacters() {
  const aunty = makeCharacter({
    kind: 'apple', body: '#e9ad24',
    outfit: '#d74777', shape: [0.67, 0.82, 0.58],
    offset: 0
  });

  const shopkeeper = makeCharacter({
    kind: 'mango', body: '#8739b5',
    outfit: '#f0d5a0', shape: [0.58, 0.92, 0.55],
    offset: 1.5
  });

  const uncle = makeCharacter({
    kind: 'strawberry', body: '#287bc9',
    outfit: '#e8edf5', shape: [0.62, 0.85, 0.56],
    offset: 3
  });

  return { aunty, shopkeeper, uncle };
}
