let scene, camera, renderer, controls;
let mesh;
let puntosMaximos = [], puntosMinimos = [];
let puntoMasAlto = null, puntoMasBajo = null;
let fondoOscuro = false;
let ejes;

const grafico3D = document.getElementById("grafico3d");
const funcionInput = document.getElementById("funcion");
const selectEjemplos = document.getElementById("ejemplos");
const listaExtremos = document.getElementById("lista-extremos");

selectEjemplos.addEventListener("change", () => {
  funcionInput.value = selectEjemplos.value;
});

function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, grafico3D.clientWidth / grafico3D.clientHeight, 0.1, 1000);
  camera.position.set(20, 20, 20);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(grafico3D.clientWidth, grafico3D.clientHeight);
  grafico3D.innerHTML = "";
  grafico3D.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  agregarEjes();
  animate();
}

function agregarEjes() {
  if (ejes) scene.remove(ejes);

  const size = 50;
  const materialX = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const materialY = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const materialZ = new THREE.LineBasicMaterial({ color: 0x0000ff });

  const puntosX = [new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0)];
  const puntosY = [new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0)];
  const puntosZ = [new THREE.Vector3(0, 0, -size), new THREE.Vector3(0, 0, size)];

  const ejeX = new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntosX), materialX);
  const ejeY = new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntosY), materialY);
  const ejeZ = new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntosZ), materialZ);

  ejes = new THREE.Group();
  ejes.add(ejeX, ejeY, ejeZ);
  scene.add(ejes);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function graficarFuncion() {
  const funcionStr = funcionInput.value;
  if (mesh) scene.remove(mesh);
  puntosMaximos.forEach(p => scene.remove(p));
  puntosMinimos.forEach(p => scene.remove(p));
  if (puntoMasAlto) scene.remove(puntoMasAlto);
  if (puntoMasBajo) scene.remove(puntoMasBajo);
  puntosMaximos = [];
  puntosMinimos = [];
  puntoMasAlto = null;
  puntoMasBajo = null;
  listaExtremos.innerHTML = "";

  try {
    const f = math.compile(funcionStr);
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    const step = 0.5;
    const size = 20;
    for (let x = -size / 2; x <= size / 2; x += step) {
      for (let y = -size / 2; y <= size / 2; y += step) {
        const z = f.evaluate({ x, y });
        vertices.push(x, y, z);
      }
    }

    const nx = Math.floor(size / step) + 1;
    const ny = nx;

    for (let i = 0; i < nx - 1; i++) {
      for (let j = 0; j < ny - 1; j++) {
        const a = i * ny + j;
        const b = a + 1;
        const c = a + ny;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x2196F3,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const df_dx = math.derivative(funcionStr, 'x').toString();
    const df_dy = math.derivative(funcionStr, 'y').toString();
    document.getElementById("derivada-x").innerText = `∂f/∂x = ${df_dx}`;
    document.getElementById("derivada-y").innerText = `∂f/∂y = ${df_dy}`;
  } catch (error) {
    alert("Error en la función. Verifica la sintaxis.");
    console.error(error);
  }
}

function buscarExtremos() {
  const funcionStr = funcionInput.value;
  const f = math.compile(funcionStr);
  const df_dx = math.compile(math.derivative(funcionStr, 'x').toString());
  const df_dy = math.compile(math.derivative(funcionStr, 'y').toString());

  let zMax = -Infinity, zMin = Infinity;
  let puntoMaximo = null, puntoMinimo = null;

  const size = 10;
  const step = 1;

  for (let x = -size; x <= size; x += step) {
    for (let y = -size; y <= size; y += step) {
      const dfx = df_dx.evaluate({ x, y });
      const dfy = df_dy.evaluate({ x, y });

      if (Math.abs(dfx) < 0.5 && Math.abs(dfy) < 0.5) {
        const z = f.evaluate({ x, y });

        const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const color = z > 0 ? 0xff0000 : 0x0000ff;
        const sphereMaterial = new THREE.MeshStandardMaterial({ color });
        const punto = new THREE.Mesh(sphereGeometry, sphereMaterial);
        punto.position.set(x, y, z);
        scene.add(punto);

        const tipo = z > 0 ? "Máximo" : "Mínimo";
        listaExtremos.innerHTML += `<li>${tipo} aproximado en (x=${x}, y=${y}, z=${z.toFixed(2)})</li>`;

        if (z > 0) puntosMaximos.push(punto);
        else puntosMinimos.push(punto);


        if (z > zMax) {
          zMax = z;
          puntoMaximo = { x, y, z };
        }
        if (z < zMin) {
          zMin = z;
          puntoMinimo = { x, y, z };
        }
      }
    }
  }


  if (puntoMaximo) {
    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); 
    puntoMasAlto = new THREE.Mesh(sphereGeometry, sphereMaterial);
    puntoMasAlto.position.set(puntoMaximo.x, puntoMaximo.y, puntoMaximo.z);
    scene.add(puntoMasAlto);
    listaExtremos.innerHTML += `<li><strong>Máximo global</strong> en (x=${puntoMaximo.x}, y=${puntoMaximo.y}, z=${puntoMaximo.z.toFixed(2)})</li>`;
  }


  if (puntoMinimo) {
    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); 
    puntoMasBajo = new THREE.Mesh(sphereGeometry, sphereMaterial);
    puntoMasBajo.position.set(puntoMinimo.x, puntoMinimo.y, puntoMinimo.z);
    scene.add(puntoMasBajo);
    listaExtremos.innerHTML += `<li><strong>Mínimo global</strong> en (x=${puntoMinimo.x}, y=${puntoMinimo.y}, z=${puntoMinimo.z.toFixed(2)})</li>`;
  }
}

function alternarTema() {
  fondoOscuro = !fondoOscuro;
  renderer.setClearColor(fondoOscuro ? 0x000000 : 0xffffff, 1);
}

document.getElementById("btnGraficar").addEventListener("click", graficarFuncion);
document.getElementById("btnExtremos").addEventListener("click", buscarExtremos);
document.getElementById("btnTema").addEventListener("click", alternarTema);

initScene();
graficarFuncion();
