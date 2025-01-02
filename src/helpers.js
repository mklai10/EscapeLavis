import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function loadAndPlaceGLB(file, place) {
    const manager = new THREE.LoadingManager();
    manager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };

    const loader = new GLTFLoader(manager);
    loader.load(file, function (gltf) {

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; 

            place(gltf);
        });
    return manager;
}



export {loadAndPlaceGLB};