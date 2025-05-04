const btnInstrucciones = document.getElementById("btn-instrucciones");
const divInstrucciones = document.getElementById("instrucciones");
const btnIniciar = document.getElementById("btn-iniciar");

btnInstrucciones.addEventListener("click", () => {
    divInstrucciones.style.display = divInstrucciones.style.display === "none" ? "block" : "none";
});


import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
const reloj = new THREE.Clock(); // Para animación del personaje

import { cargarPersonaje, actualizarAnimacion, obtenerPersonaje } from './personaje.js';
import { generarObstaculos, actualizarObstaculos, verificarColisiones } from './obstaculos.js';

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
let moviendoMundo = false;
let seccionesPasillo = [];
const largoSeccion = 100; // el largo de cada sección
const cantidadSecciones = 3; // puedes usar 2 o 3 secciones reciclables
let luzPared, luzParedDer;
let t = 0;
let estaChocando = false; // variable global o dentro de iniciarPasillo
let tiempoDetenido = 0;
let mundo; // <== Agrega esto junto con las demás variables globales
let nieblaAsesina;
let velocidadNiebla = 0.004;
let velocidadJugador = 0.05;     // velocidad inicial
const velocidadMaxima = 1;    // velocidad máxima
const aceleracion = 0.012;       // aceleración gradual

let contadorChoques = 0;


function crearSeccionPasillo(posZ) {
    const grupo = new THREE.Group();

    grupo.position.z = posZ;


    // // Barras de luz horizontales en el techo
    // for (let i = -40; i <= 40; i += 8) {
    //     const luzTecho = new THREE.Mesh(
    //         new THREE.BoxGeometry(3, 0.07, 0.1),
    //         new THREE.MeshStandardMaterial({
    //             emissive: 0x00ccff,
    //             color: 0x000000,
    //             emissiveIntensity: 3,
    //             metalness: 1
    //         })
    //     );
    //     luzTecho.position.set(0, 4, i);
    //     grupo.add(luzTecho);
    // }


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
    grupo.add(piso);
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

    grupo.add(linea1);
    grupo.add(linea2);
    const bordeIzq = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.01, 100),
        new THREE.MeshStandardMaterial({
            emissive: 0xff00ff,
            color: 0x250025,
            emissiveIntensity: 0.8
        })
    );
    bordeIzq.position.set(-3, 0.06, 0); // extremo izq
    grupo.add(bordeIzq);

    const bordeDer = bordeIzq.clone();
    bordeDer.position.x = 3;
    grupo.add(bordeDer);

    // Paredes laterales
    const geoPared = new THREE.BoxGeometry(0.5, 4, 100);

    const matPared = new THREE.MeshStandardMaterial({
        map: texturaColor,
        normalMap: texturaNormal,
        roughnessMap: texturaRough,
        metalnessMap: texturaMetal,
        metalness: 1,
        roughness: 0.4,
    });


    const paredIzq = new THREE.Mesh(geoPared, matPared);
    paredIzq.position.set(-3.25, 2, 0); // más hacia la izquierda
    grupo.add(paredIzq);

    const paredDer = paredIzq.clone();
    paredDer.position.x = 3.25;        // más hacia la derecha
    grupo.add(paredDer);

    function agregarDiagonales(pared, lado = 1) {
        for (let z = -40; z <= 40; z += 6) {
            const grupoInterno = new THREE.Group();

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
            grupoInterno.add(barra);

            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 1.4, 0.05),
                new THREE.MeshStandardMaterial({
                    color: 0x1a001a,
                    metalness: 0.3,
                    roughness: 0.6
                })
            );
            grupoInterno.add(panel);

            grupoInterno.position.set(pared.position.x + (lado * 0.06), 2, z);

            grupo.add(grupoInterno); // ✅ Aquí
            diagonales.push(barra);
        }
    }

    // // === PORTALES SCI-FI ===
    // for (let z = -40; z <= 40; z += 15) {
    //     const portal = new THREE.Group();

    //     const ancho = 5.8;
    //     const alto = 3.5;
    //     const grosor = 0.1;

    //     const materialPortal = new THREE.MeshStandardMaterial({
    //         color: 0x000000,
    //         emissive: 0x00ffff,
    //         emissiveIntensity: 2,
    //         metalness: 1,
    //         roughness: 0.2
    //     });

    //     // Parte superior
    //     const barraSuperior = new THREE.Mesh(
    //         new THREE.BoxGeometry(ancho, grosor, grosor),
    //         materialPortal
    //     );
    //     barraSuperior.position.y = alto;
    //     portal.add(barraSuperior);

    //     // Laterales
    //     const lateralIzq = new THREE.Mesh(
    //         new THREE.BoxGeometry(grosor, alto, grosor),
    //         materialPortal
    //     );
    //     lateralIzq.position.set(-ancho / 2, alto / 2, 0);
    //     portal.add(lateralIzq);

    //     const lateralDer = lateralIzq.clone();
    //     lateralDer.position.x = ancho / 2;
    //     portal.add(lateralDer);

    //     portal.position.set(0, 0.5, z); // sube el grupo completo


    //     grupo.add(portal);
    //     portales.push([barraSuperior, lateralIzq, lateralDer]); // Guardamos para animación
    // }



    // for (let z = -40; z <= 40; z += 10) {
    //     const rejillaIzq = new THREE.Mesh(
    //         new THREE.BoxGeometry(0.03, 4, 0.05),
    //         new THREE.MeshStandardMaterial({
    //             color: 0x110011,
    //             metalness: 0.7,
    //             roughness: 0.3
    //         })
    //     );
    //     rejillaIzq.position.set(-2.4, 2, z); // ✅ MÁS CERCA DE LA PARED
    //     grupo.add(rejillaIzq);

    //     const rejillaDer = rejillaIzq.clone();
    //     rejillaDer.position.x = 2.4; // ✅ MÁS CERCA DE LA PARED
    //     grupo.add(rejillaDer);
    // }




    // agregarDiagonales(paredIzq, 1);
    // agregarDiagonales(paredDer, -1);


    piso.receiveShadow = true;
    paredIzq.castShadow = true;
    paredDer.castShadow = true;

    // Animación básica
    function animar() {
        requestAnimationFrame(animar);
        renderizador.render(escena, camara);
    }
    // const luzFlash = new THREE.PointLight(0xff00ff, 1, 10);
    // luzFlash.position.set(0, 2, 2);
    // grupo.add(luzFlash);

    // setInterval(() => {
    //     luzFlash.intensity = Math.random() * 1.5;
    // }, 100);

    // const luzAmbiente = new THREE.AmbientLight(0x220033, 0.3);
    // grupo.add(luzAmbiente);

    // for (let z = -40; z <= 40; z += 10) {
    //     const tubo = new THREE.Mesh(
    //         new THREE.CylinderGeometry(0.05, 0.05, 3, 16),
    //         new THREE.MeshStandardMaterial({
    //             color: 0x000000,
    //             emissive: 0x00ffff,
    //             emissiveIntensity: 3
    //         })
    //     );
    //     tubo.rotation.z = Math.PI / 2;
    //     tubo.position.set(-2.9, 2, z);
    //     grupo.add(tubo);

    //     const tubo2 = tubo.clone();
    //     tubo2.position.x = 2.9;
    //     grupo.add(tubo2);
    // }
    // luzPared = new THREE.RectAreaLight(0xff00ff, 2, 4, 4);
    // luzPared.position.set(-1.9, 2, 0);
    // luzPared.lookAt(0, 2, 0);
    // grupo.add(luzPared);

    // luzParedDer = luzPared.clone();
    // luzParedDer.position.x = 1.9;
    // luzParedDer.lookAt(0, 2, 0);
    // grupo.add(luzParedDer);


    //         for (let z = -40; z <= 40; z += 10) {
    //             const esfera = new THREE.Mesh(
    //                 new THREE.SphereGeometry(0.15, 16, 16),
    //                 new THREE.MeshStandardMaterial({
    //                     emissive: 0xff00ff,
    //                     emissiveIntensity: 3,
    //                     color: 0x000000
    //                 })
    //             );

    //             esfera.position.set(2.5, 2.5, z);
    //             grupo.add(esfera);
    //             lucesAnimadas.push(esfera);

    //             const esfera2 = esfera.clone();
    //             esfera2.position.x = -2.5;
    //             grupo.add(esfera2);
    //             lucesAnimadas.push(esfera2);

    // // 
    //         }



    return grupo;

}
import { inicializarHUD } from './obstaculos.js';


function iniciarPasillo() {

  

    // Crear escena
    escena = new THREE.Scene();
    escena.background = new THREE.Color(0x070016); // más oscuro tipo antro
    escena.fog = new THREE.Fog(0x000000, 10, 100); // niebla negra


    mundo = new THREE.Group(); // ✅ En lugar de usar `const mundo`


    escena.add(mundo);

    const geometriaNiebla = new THREE.PlaneGeometry(6, 4);
const materialNiebla = new THREE.MeshStandardMaterial({
    color: 0x550055,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    emissive: 0x770077,
    emissiveIntensity: 0.8
});
nieblaAsesina = new THREE.Mesh(geometriaNiebla, materialNiebla);
nieblaAsesina.rotation.x = -Math.PI / 2;
nieblaAsesina.position.set(0, 1.5, 3); // empieza detrás del jugador
escena.add(nieblaAsesina);


    for (let i = 0; i < cantidadSecciones; i++) {
        const seccion = crearSeccionPasillo(i * -largoSeccion); // secciones atrás
        mundo.add(seccion);
        seccionesPasillo.push(seccion);
    }


    // Cámara
    camara = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camara.position.set(0, 2, 2.5);
    camara.lookAt(0, 1.5, 0);


    cargarPersonaje(escena);
    inicializarHUD(); // ✅ Esto conecta el HUD al div #contador
    generarObstaculos(escena);


    // // Luz direccional para iluminar al personaje
    // const luzDireccional = new THREE.DirectionalLight(0xffffff, 2);
    // luzDireccional.position.set(0, 4, 5);
    // luzDireccional.castShadow = true;
    // mundo.add(luzDireccional);

    // // Luz puntual cerca del personaje para reforzar color
    // const luzPersonaje = new THREE.PointLight(0xff00ff, 2, 10);
    // luzPersonaje.position.set(0, 2, 5);
    // mundo.add(luzPersonaje);


    // Renderizador
    renderizador = new THREE.WebGLRenderer({
        canvas: document.getElementById("juego"),
        antialias: false
    });
    renderizador.setPixelRatio(window.devicePixelRatio * 0.6); // menor resolución

    renderizador.setSize(window.innerWidth, window.innerHeight);
    renderizador.setClearColor(0x000000);
    //renderizador.shadowMap.enabled = true;
    //renderizador.shadowMap.type = THREE.PCFSoftShadowMap;


    // Luces tipo neón
    // const luzSuperior = new THREE.PointLight(0x00ffff, 1.5, 20);
    // luzSuperior.position.set(0, 5, 0);
    // mundo.add(luzSuperior);

    // const luzFrontal = new THREE.PointLight(0xff00ff, 1, 20);
    // luzFrontal.position.set(0, 2, 5);
    // mundo.add(luzFrontal);

    // luzSuperior.castShadow = true;
    // luzFrontal.castShadow = true;
    let contadorEsquivados = 0;
    const divContador = document.getElementById("contador");
    const divMensaje = document.getElementById("mensaje");



    function animar() {



        requestAnimationFrame(animar);
        t += 0.05;

        const delta = reloj.getDelta();
        actualizarAnimacion(delta);
        actualizarObstaculos(delta, mundo, camara, moviendoMundo);


        const personaje = obtenerPersonaje();
        if (personaje) {
            if (verificarColisiones(personaje)) {
                if (!estaChocando) contadorChoques++; // 👈 Solo cuenta nuevos choques
                estaChocando = true;
                tiempoDetenido += delta;
            
                if (tiempoDetenido > 0.5) {
                    estaChocando = false;
                    tiempoDetenido = 0;
                }
            } else {
                estaChocando = false;
                tiempoDetenido = 0;
            }
            
        }
        


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

        // // Luces de pared respirando
        // luzPared.intensity = 1.5 + Math.sin(t) * 0.5;
        // luzParedDer.intensity = 1.5 + Math.sin(t) * 0.5;

        lucesAnimadas.forEach((esfera, i) => {
            // Movimiento flotante vertical
            esfera.position.y = 2.5 + Math.sin(t + i) * 0.2;

            // Cambio dinámico de color
            const hue = (t * 0.1 + i * 0.05) % 1;
            const color = new THREE.Color();
            color.setHSL(hue, 1, 0.5); // saturación y luminosidad fijas

            esfera.material.emissive = color;
        });

        if (moviendoMundo && !estaChocando) {
            velocidadJugador = Math.min(velocidadJugador + aceleracion, velocidadMaxima);
            mundo.position.z += velocidadJugador;
        } else {
            velocidadJugador = 0.05; // Reinicia si no se mueve o si está chocando
        }
        
        
        // // Reciclado de secciones para pasillo infinito
        // for (let i = 0; i < cantidadSecciones; i++) {
        //     const seccion = crearSeccionPasillo(i * -largoSeccion + 2.5); // 🟢 compensar el z inicial
        //     mundo.add(seccion);
        //     seccionesPasillo.push(seccion);
        // }
        // ♻️ Reciclado de secciones cuando están muy atrás



        // Ordenar las secciones por su posición Z
        seccionesPasillo.sort((a, b) => a.position.z - b.position.z);

        const zPersonaje = personaje?.getWorldPosition(new THREE.Vector3()).z ?? camara.getWorldPosition(new THREE.Vector3()).z;

        for (let i = 0; i < seccionesPasillo.length; i++) {
            const seccion = seccionesPasillo[i];
            const zSeccion = seccion.getWorldPosition(new THREE.Vector3()).z;

            // Si la sección ya está detrás de la cámara
            if (zSeccion > zPersonaje + largoSeccion) {
                // Buscar la sección más alejada en Z
                const masLejana = Math.min(...seccionesPasillo.map(s => s.position.z));
                seccion.position.z = masLejana - largoSeccion;

                // Opcional: volver a ordenar el arreglo
                seccionesPasillo.sort((a, b) => a.position.z - b.position.z);
            }
        }

       // La niebla avanza siempre que se esté moviendo el mundo
       if (personaje) {
        const zJugador = personaje.getWorldPosition(new THREE.Vector3()).z;
        const zNiebla = nieblaAsesina.position.z;
        const distancia = zJugador - zNiebla;
    
        // Si te estás moviendo y no estás chocando, la niebla avanza pero más lento
        if (estaChocando) {
            // velocidad base + incremento por cada choque
            const velocidadNiebla = 0.02 + contadorChoques * 0.005; // Ajusta el 0.002 si quieres que acelere más o menos
            nieblaAsesina.position.z -= velocidadNiebla;
        }else if (moviendoMundo && distancia > 3) {
            nieblaAsesina.position.z -= 0.001; // avanza lentamente si estás corriendo bien
        }
        
        
    

    }
    
    
        
        // Verifica si alcanzó al jugador
        if (personaje) {
            const zJugador = personaje.getWorldPosition(new THREE.Vector3()).z;
            const zNiebla = nieblaAsesina.position.z;
        
            if (zNiebla < zJugador + 0.5) {
                alert("🌫️ ¡La niebla te atrapó!");
                location.reload();
                return;
            }
        }
        


        renderizador.render(escena, camara);
    }
    const lineaDebug = new THREE.GridHelper(6, 1, 0xff00ff, 0xff00ff);
    lineaDebug.position.z = 20;
    escena.add(lineaDebug);

    const personaje = obtenerPersonaje();

if (personaje) {
    if (verificarColisiones(personaje)) {
        estaChocando = true;
        tiempoDetenido += delta;

        if (tiempoDetenido > 0.5) { // medio segundo de castigo
            estaChocando = false;
            tiempoDetenido = 0;
        }
    } else {
        estaChocando = false;
        tiempoDetenido = 0;
    }
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

        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === 'w') moviendoMundo = true;
            if (e.key.toLowerCase() === 's') moviendoMundo = false;
        });

        iniciarPasillo();
    });
});


