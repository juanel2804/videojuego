import * as THREE from '../libs/three.module.js';
import { FBXLoader } from '../libs/FBXLoader.js';

let mixer; // Para animaciones

export async function cargarPersonaje(escena) {
    const loader = new FBXLoader();

    loader.load('../models/mi_personaje.fbx', (obj) => {
        obj.scale.set(0.01, 0.01, 0.01); // Ajusta el tamaño según Mixamo
        obj.position.set(0, 0, 0);       // Posición inicial
        escena.add(obj);

        // Buscar y activar animación (si tiene)
        mixer = new THREE.AnimationMixer(obj);
        if (obj.animations.length > 0) {
            const accion = mixer.clipAction(obj.animations[0]);
            accion.play();
        }
    }, undefined, (error) => {
        console.error("Error al cargar el modelo:", error);
    });
}

export function actualizarAnimacion(delta) {
    if (mixer) mixer.update(delta);
}
