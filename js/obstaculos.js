import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

let obstaculos = [];
let velocidadObstaculo = 0.1;
let tiempoUltimo = 0;
let intervaloGeneracion = 2;
let divContador;

export function inicializarHUD() {
    divContador = document.getElementById("contador");
    if (divContador) {
        divContador.textContent = `Esquivados: 0`;
    }
}


const geometria = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x00ffff,        // cian brillante
    emissiveIntensity: 2,
    metalness: 1,
    roughness: 0.2
});


export function generarObstaculos(escena, mundo, nivel = 1) {
    {
        for (let i = 0; i < 3; i++) {
            const obs = new THREE.Mesh(geometria, material);
            obs.position.set(posicionAleatoriaX(), 0.25, -mundo.position.z - 90 - i * 100);


            obstaculos.push(obs);
            mundo.add(obs);
        }
    }
}

export function actualizarObstaculos(delta, mundo, camara, moviendoMundo, velocidadJugador, obstaculoEsquivadoCallback) {
    {
        if (!moviendoMundo) return;

        tiempoUltimo += delta;

        if (tiempoUltimo > intervaloGeneracion) {
            tiempoUltimo = 0;
            const nuevo = new THREE.Mesh(geometria, material);
            nuevo.position.set(posicionAleatoriaX(), 0.25, -mundo.position.z - 35);

            mundo.add(nuevo);
            obstaculos.push(nuevo);

            if (intervaloGeneracion > 0.6) intervaloGeneracion -= 0.05;
            if (velocidadObstaculo < 0.5) velocidadObstaculo += 0.01;
        }

        for (let i = obstaculos.length - 1; i >= 0; i--) {
            const obs = obstaculos[i];
            const zRelativo = obs.position.z + mundo.position.z;

            if (zRelativo > 5) {
                mundo.remove(obs);
                obs.geometry.dispose();
                obs.material.dispose();
                obstaculos.splice(i, 1);

                if (typeof obstaculoEsquivadoCallback === "function") {
                    obstaculoEsquivadoCallback(); // ✅ Ahora esta función controla todo
                }

            }

        }

        const zJugador = camara.getWorldPosition(new THREE.Vector3()).z;

        obstaculos.forEach(obstaculo => {
            // Mueve el obstáculo (si no lo haces en otro lado)
            if (moviendoMundo) {
                obstaculo.position.z += velocidadJugador; // opcional si tu entorno se mueve
            }

            // Si ya pasó al jugador y no fue contado
            if (!obstaculo.contado && obstaculo.position.z > zJugador + 1) {
                obstaculo.contado = true; // no contar otra vez
                if (typeof obstaculoEsquivadoCallback === "function") {
                    obstaculoEsquivadoCallback(); // ✅ Subimos el contador real
                }
            }
        });



    }


}

export function verificarColisiones(personaje) {
    const pos = personaje.getWorldPosition(new THREE.Vector3());

    for (let obs of obstaculos) {
        const obsWorld = obs.getWorldPosition(new THREE.Vector3());
        const dx = Math.abs(obsWorld.x - pos.x);
        const dz = Math.abs(obsWorld.z - pos.z);
        if (dx < 0.4 && dz < 0.4) {
            return true;
        }
    }
    return false;
}

function posicionAleatoriaX() {
    const carriles = [-1.5, 0, 1.5];
    return carriles[Math.floor(Math.random() * carriles.length)];
}

