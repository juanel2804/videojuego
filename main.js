const btnInstrucciones = document.getElementById("btn-instrucciones");
const divInstrucciones = document.getElementById("instrucciones");
const btnIniciar = document.getElementById("btn-iniciar");

btnInstrucciones.addEventListener("click", () => {
    divInstrucciones.style.display = divInstrucciones.style.display === "none" ? "block" : "none";
});


// Esperamos a que el DOM cargue (por si se carga antes del script)
window.addEventListener("DOMContentLoaded", () => {
    const btnIniciar = document.getElementById("btn-iniciar");
    const pantallaBienvenida = document.getElementById("pantalla-bienvenida");
    const canvasJuego = document.getElementById("juego");

    btnIniciar.addEventListener("click", () => {
        // Transición rápida
        pantallaBienvenida.style.display = "none";
        canvasJuego.style.display = "block";


        // Luego aquí importamos Three.js, render, etc.
    });
});
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

let escena, camara, renderizador;

let diagonales = [];

const loader = new THREE.TextureLoader();
const texturaColor = loader.load('texturas/Metal059A_4K-JPG_Color.jpg');
const texturaNormal = loader.load('texturas/Metal059A_4K-JPG_NormalGL.jpg');
const texturaRough = loader.load('texturas/Metal059A_4K-JPG_Roughness.jpg');
const texturaMetal = loader.load('texturas/Metal059A_4K-JPG_Metalness.jpg');

const normalMapPared = loader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r158/examples/textures/normalmap.png');

let portales = []; // Añade esto arriba junto a diagonales
let lucesAnimadas = [];

function iniciarPasillo() {
    // Crear escena
    escena = new THREE.Scene();
    escena.background = new THREE.Color(0x070016); // más oscuro tipo antro
    escena.fog = new THREE.Fog(0x000000, 10, 100); // niebla negra

    // Cámara
    camara = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camara.position.set(0, 1.6, 5); // altura del personaje y ligera distancia

    // Renderizador
    renderizador = new THREE.WebGLRenderer({ canvas: document.getElementById("juego") });
    renderizador.setSize(window.innerWidth, window.innerHeight);
    renderizador.setClearColor(0x000000);
    renderizador.shadowMap.enabled = true;
    renderizador.shadowMap.type = THREE.PCFSoftShadowMap;


    // Luces tipo neón
    const luzSuperior = new THREE.PointLight(0x00ffff, 1.5, 20);
    luzSuperior.position.set(0, 5, 0);
    escena.add(luzSuperior);

    const luzFrontal = new THREE.PointLight(0xff00ff, 1, 20);
    luzFrontal.position.set(0, 2, 5);
    escena.add(luzFrontal);

    luzSuperior.castShadow = true;
    luzFrontal.castShadow = true;

    // Barras de luz horizontales en el techo
    for (let i = -40; i <= 40; i += 8) {
        const luzTecho = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.07, 0.1),
            new THREE.MeshStandardMaterial({
                emissive: 0x00ccff,
                color: 0x000000,
                emissiveIntensity: 3,
                metalness: 1
            })
        );
        luzTecho.position.set(0, 4, i);
        escena.add(luzTecho);
    }


    // Piso largo tipo pasillo
    const geometriaPiso = new THREE.BoxGeometry(6, 0.1, 100); // era 4

    const materialPiso = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x002244,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.1
    });




    const piso = new THREE.Mesh(geometriaPiso, materialPiso);
    piso.position.y = 0;
    escena.add(piso);
    const lineaMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x00ffff,
        metalness: 1,
        roughness: 0.1,
        emissiveIntensity: 2
    });

    const linea1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 100), lineaMaterial);

    linea1.position.set(-1, 0.06, 0); // izquierda

    const linea2 = linea1.clone();
    linea2.position.x = 1; // derecha

    escena.add(linea1);
    escena.add(linea2);
    const bordeIzq = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.01, 100),
        new THREE.MeshStandardMaterial({
            emissive: 0xff00ff,
            color: 0x250025,
            emissiveIntensity: 0.8
        })
    );
    bordeIzq.position.set(-3, 0.06, 0); // extremo izq
    escena.add(bordeIzq);

    const bordeDer = bordeIzq.clone();
    bordeDer.position.x = 3;
    escena.add(bordeDer);

    // Paredes laterales
    const geoPared = new THREE.BoxGeometry(0.1, 4, 100);
    const matPared = new THREE.MeshStandardMaterial({
        map: texturaColor,
        normalMap: texturaNormal,
        roughnessMap: texturaRough,
        metalnessMap: texturaMetal,
        metalness: 1,
        roughness: 0.4,
    });
    





    const paredIzq = new THREE.Mesh(geoPared, matPared);
    paredIzq.position.set(-2, 2, 0);
    escena.add(paredIzq);

    const paredDer = paredIzq.clone();
    paredDer.position.x = 2;
    escena.add(paredDer);

    function agregarDiagonales(pared, lado = 1) {
        for (let z = -40; z <= 40; z += 6) {
            const grupo = new THREE.Group();

            // Diagonal neón
            const barra = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 1.2, 0.1),
                new THREE.MeshStandardMaterial({
                    emissive: 0xff00ff,
                    emissiveIntensity: 2.5,
                    color: 0x000000,
                    metalness: 1,
                    roughness: 0.1
                })
            );
            barra.rotation.z = Math.PI / 3 * lado;
            grupo.add(barra);

            // Marco base detrás (le da volumen)
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 1.4, 0.05),
                new THREE.MeshStandardMaterial({
                    color: 0x1a001a,
                    metalness: 0.3,
                    roughness: 0.6
                })
            );
            grupo.add(panel);

            grupo.position.set(pared.position.x + (lado * 0.06), 2, z);

            escena.add(grupo);
            diagonales.push(barra); // guardamos la barra neón

        }
    }
    // === PORTALES SCI-FI ===
    for (let z = -40; z <= 40; z += 15) {
        const portal = new THREE.Group();

        const ancho = 5.8;
        const alto = 3.5;
        const grosor = 0.1;

        const materialPortal = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x00ffff,
            emissiveIntensity: 2,
            metalness: 1,
            roughness: 0.2
        });

        // Parte superior
        const barraSuperior = new THREE.Mesh(
            new THREE.BoxGeometry(ancho, grosor, grosor),
            materialPortal
        );
        barraSuperior.position.y = alto;
        portal.add(barraSuperior);

        // Laterales
        const lateralIzq = new THREE.Mesh(
            new THREE.BoxGeometry(grosor, alto, grosor),
            materialPortal
        );
        lateralIzq.position.set(-ancho / 2, alto / 2, 0);
        portal.add(lateralIzq);

        const lateralDer = lateralIzq.clone();
        lateralDer.position.x = ancho / 2;
        portal.add(lateralDer);

        portal.position.set(0, 0.5, z); // sube el grupo completo


        escena.add(portal);
        portales.push([barraSuperior, lateralIzq, lateralDer]); // Guardamos para animación
    }



    for (let z = -40; z <= 40; z += 10) {
        const rejillaIzq = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 4, 0.05),
            new THREE.MeshStandardMaterial({
                color: 0x110011,
                metalness: 0.7,
                roughness: 0.3
            })
        );
        rejillaIzq.position.set(-2.4, 2, z); // ✅ MÁS CERCA DE LA PARED
        escena.add(rejillaIzq);

        const rejillaDer = rejillaIzq.clone();
        rejillaDer.position.x = 2.4; // ✅ MÁS CERCA DE LA PARED
        escena.add(rejillaDer);
    }




    agregarDiagonales(paredIzq, 1);
    agregarDiagonales(paredDer, -1);


    piso.receiveShadow = true;
    paredIzq.castShadow = true;
    paredDer.castShadow = true;

    // Animación básica
    function animar() {
        requestAnimationFrame(animar);
        renderizador.render(escena, camara);
    }
    const luzFlash = new THREE.PointLight(0xff00ff, 1, 10);
    luzFlash.position.set(0, 2, 2);
    escena.add(luzFlash);

    setInterval(() => {
        luzFlash.intensity = Math.random() * 1.5;
    }, 100);

    const luzAmbiente = new THREE.AmbientLight(0x220033, 0.3);
    escena.add(luzAmbiente);

    for (let z = -40; z <= 40; z += 10) {
        const tubo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 3, 16),
            new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0x00ffff,
                emissiveIntensity: 3
            })
        );
        tubo.rotation.z = Math.PI / 2;
        tubo.position.set(-2.9, 2, z);
        escena.add(tubo);

        const tubo2 = tubo.clone();
        tubo2.position.x = 2.9;
        escena.add(tubo2);
    }
    const luzPared = new THREE.RectAreaLight(0xff00ff, 2, 4, 4);
    luzPared.position.set(-1.9, 2, 0);
    luzPared.lookAt(0, 2, 0);
    escena.add(luzPared);

    const luzParedDer = luzPared.clone();
    luzParedDer.position.x = 1.9;
    luzParedDer.lookAt(0, 2, 0);
    escena.add(luzParedDer);
    let t = 0;
    for (let z = -40; z <= 40; z += 10) {
        const esfera = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshStandardMaterial({
                emissive: 0xff00ff,
                emissiveIntensity: 3,
                color: 0x000000
            })
        );
    
        esfera.position.set(2.5, 2.5, z);
        escena.add(esfera);
        lucesAnimadas.push(esfera);
    
        const esfera2 = esfera.clone();
        esfera2.position.x = -2.5;
        escena.add(esfera2);
        lucesAnimadas.push(esfera2);
    }
    

    function animar() {
        requestAnimationFrame(animar);
        t += 0.05;

        // Animación de pulsación para portales
        const intensidad = 1.5 + Math.sin(t * 2) * 0.8;
        portales.forEach(([sup, izq, der]) => {
            sup.material.emissiveIntensity = intensidad;
            izq.material.emissiveIntensity = intensidad;
            der.material.emissiveIntensity = intensidad;
        });

        // Luz pulsante en diagonales
        diagonales.forEach(barra => {
            if (barra.material) {
                barra.material.emissiveIntensity = 1.5 + Math.sin(t * 2) * 1.5;
            }
        });

        // Luces de pared respirando
        luzPared.intensity = 1.5 + Math.sin(t) * 0.5;
        luzParedDer.intensity = 1.5 + Math.sin(t) * 0.5;

        lucesAnimadas.forEach((esfera, i) => {
            // Movimiento flotante vertical
            esfera.position.y = 2.5 + Math.sin(t + i) * 0.2;
        
            // Cambio dinámico de color
            const hue = (t * 0.1 + i * 0.05) % 1;
            const color = new THREE.Color();
            color.setHSL(hue, 1, 0.5); // saturación y luminosidad fijas
        
            esfera.material.emissive = color;
        });
        

        renderizador.render(escena, camara);
    }


    animar();
}

window.addEventListener("DOMContentLoaded", () => {
    const btnIniciar = document.getElementById("btn-iniciar");
    const pantallaBienvenida = document.getElementById("pantalla-bienvenida");
    const canvasJuego = document.getElementById("juego");

    btnIniciar.addEventListener("click", () => {
        pantallaBienvenida.style.display = "none";
        canvasJuego.style.display = "block";
        iniciarPasillo();
    });
});
