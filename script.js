// Variables globales
let scene, camera, renderer, surface, arrow, controls;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(75, 800 / 400, 0.1, 1000);
    camera.position.set(0, -15, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(800, 400);
    document.getElementById('grafico3d').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const light = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 10);
    scene.add(light, directionalLight);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function calcularDerivadas(funcStr) {
    try {
        const node = math.parse(funcStr);
        const x = math.parse('x');
        const y = math.parse('y');

        const dfdx = math.derivative(node, x).toString();
        const dfdy = math.derivative(node, y).toString();

        document.getElementById('derivada-x').textContent = `∂f/∂x = ${dfdx}`;
        document.getElementById('derivada-y').textContent = `∂f/∂y = ${dfdy}`;

        return { dfdx, dfdy };
    } catch (error) {
        alert("Error en la función. Usa sintaxis válida como: sin(x) * cos(y)");
        console.error(error);
        return null;
    }
}

function graficar() {
    const funcion = document.getElementById('funcion').value;

    const derivadas = calcularDerivadas(funcion);
    if (!derivadas) return;

    if (surface) scene.remove(surface);
    if (arrow) scene.remove(arrow);

    const geometry = new THREE.ParametricBufferGeometry((u, v, target) => {
        const x = (u - 0.5) * 10;
        const y = (v - 0.5) * 10;
        let z = 0;
        try {
            z = math.evaluate(funcion, { x, y });
        } catch (e) {
            z = 0;
        }
        target.set(x, y, z);
    }, 100, 100);

    const material = new THREE.MeshPhongMaterial({
        color: 0x156289,
        wireframe: false,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });

    surface = new THREE.Mesh(geometry, material);
    scene.add(surface);

    // Vector gradiente en (0,0)
    try {
        const dfdx_val = math.evaluate(derivadas.dfdx, { x: 0, y: 0 });
        const dfdy_val = math.evaluate(derivadas.dfdy, { x: 0, y: 0 });
        const z_val = math.evaluate(funcion, { x: 0, y: 0 });

        const origin = new THREE.Vector3(0, 0, z_val);
        const direction = new THREE.Vector3(dfdx_val, dfdy_val, 0).normalize();
        const length = Math.sqrt(dfdx_val ** 2 + dfdy_val ** 2);

        arrow = new THREE.ArrowHelper(direction, origin, length, 0xff0000, 0.3, 0.2);
        scene.add(arrow);
    } catch (e) {
        console.warn("No se pudo evaluar el gradiente en (0,0):", e);
    }
}

window.onload = () => {
    init();

    // Botón para graficar
    document.getElementById('btnGraficar').addEventListener('click', graficar);

    // Cambiar input al seleccionar una opción preestablecida
    document.getElementById('ejemplos').addEventListener('change', (e) => {
        document.getElementById('funcion').value = e.target.value;
        graficar(); // Auto-graficar la nueva función
    });

    graficar(); // Graficar función inicial al cargar
};
