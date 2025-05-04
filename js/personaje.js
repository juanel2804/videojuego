import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { FBXLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/FBXLoader.js';

let mixer;
let personaje;
let accionCorrer;
let accionIdle;
let estaCorriendo = false;

export async function cargarPersonaje(escena) {
    const loader = new FBXLoader();
    loader.load('models/mi_personaje.fbx', (obj) => {
        obj.scale.set(0.01, 0.01, 0.01);
        obj.position.set(0, 0, 0);
        obj.rotation.y = Math.PI; // 🔁 Girarlo 180 grados

        // ✅ Aquí sí existe obj, por eso este bloque va aquí
        obj.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                    child.material.emissive = new THREE.Color(0x220022); // tono morado
                    child.material.emissiveIntensity = 0.5;
                }
            }
        });

        escena.add(obj);
        personaje = obj;

        mixer = new THREE.AnimationMixer(personaje);

        if (personaje.animations.length > 0) {
            accionCorrer = mixer.clipAction(personaje.animations[0]);
            accionCorrer.setLoop(THREE.LoopRepeat);  // 🔁 Repetir en bucle
            accionCorrer.clampWhenFinished = false;
            accionCorrer.enabled = true;

            accionIdle = mixer.clipAction(personaje.animations[0]); // misma animación por ahora
            accionIdle.paused = true;

        }

        activarTeclasParaCorrer();
    }, undefined, (error) => {
        console.error("Error al cargar el modelo:", error);
    });
}

let carrilActual = 0; // -1: izquierda, 0: centro, 1: derecha

function activarTeclasParaCorrer() {
    window.addEventListener("keydown", (e) => {
        if (!personaje) return;

        const tecla = e.key.toLowerCase();

        // ⬆️ Activar animación de correr con W
        if (tecla === 'w' && !estaCorriendo) {
            if (accionCorrer) {
                accionCorrer.reset();  // Solo la primera vez
                accionCorrer.play();
            }
            estaCorriendo = true;
        }


        // ⛔️ Detener animación con S
        if (tecla === 's' && estaCorriendo) {
            if (accionCorrer) {
                accionCorrer.stop();
                accionCorrer.reset();
            }
            estaCorriendo = false;
        }

        // 👈 Mover a la izquierda
        if (tecla === 'a' && carrilActual > -1) {
            carrilActual--;
            personaje.position.x = carrilActual * 1.5;
        }

        // 👉 Mover a la derecha
        if (tecla === 'd' && carrilActual < 1) {
            carrilActual++;
            personaje.position.x = carrilActual * 1.5;
        }

        // ⬆️ Saltar con espacio
        if (e.code === 'Space' && !personaje.saltando) {
            personaje.saltando = true;
            const alturaBase = personaje.position.y;
            let t = 0;

            const subir = () => {
                t += 0.05;
                personaje.position.y = alturaBase + Math.sin(t * Math.PI) * 1.5;

                if (t < 1) {
                    requestAnimationFrame(subir);
                } else {
                    personaje.position.y = alturaBase;
                    personaje.saltando = false;
                }
            };

            subir();
        }
    });
}


export function actualizarAnimacion(delta) {
    if (mixer) mixer.update(delta);
}
export function obtenerPersonaje() {
    return personaje;
}
