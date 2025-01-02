import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { loadAndPlaceGLB } from './helpers.js';
import { loadText, removeLavisText, loadNoButton, loadYesButton } from './startingPage.js';
import { playerRunSound, loadAmbientSound, loadKillSound, playSayingRunSound, fadeSound, fadeOutOnly, fadeInCut, loadHeartSound } from './audio.js';

// setup
let inputManaged = false;
let gamePlaying = false;
let renderer, scene, camera, controls;
const fov = 60;
const aspect = 1920 / 1080;
const near = 1.0;
const far = 1000.0;
let maxFogDistance = 500;
let fogDistance = maxFogDistance;
let gameStarted = false;

// movement
let leftVec;
let rightVec;
let backVec;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let sprint = false;
let space = false;
let ctrl = false;
let velocityx = 0;
let velocityz = 0;
let lavisSpeed = 0.02;
let lavisSpeedThreshold = 0.15;

// forest creation
let trunkMesh;
let leavesMesh;
let count = 4000;
let spread = 12;

// collision
const trees = [];
let onObjectW;
let onObjectA;
let onObjectS;
let onObjectD;
let raycasterW;
let raycasterS;
let raycasterA;
let raycasterD;

// stamina
const staminaMax = 3000;
let stamina = staminaMax;
let canRun = true;
const staminaClock = new THREE.Clock(false);

// animations
let runMixer;
let idleMixer;
let walkMixer;
const animationClock = new THREE.Clock();
let run;
let idle;
let walk;
let object;
let running = false;
let walking = false;

const clock = new THREE.Clock(false);

const teleportClock = new THREE.Clock(false);

// audio
let playSound = playerRunSound();
let ambientSound;
let killerMovementSound;
let killSound;
let heartSound;
let hasFaded = false;

init();

function init() {
  gamePlaying = true;
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth - 5, window.innerHeight - 5);

  document.getElementById("container").appendChild(renderer.domElement)

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, -5);

  scene = new THREE.Scene();

  let light = new THREE.DirectionalLight(0x101010, 1.0);
  // let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  light.position.set(0, 100, 0);
  light.target.position.set(0, 0, 0);
  light.position.multiplyScalar(30);

  light.castShadow = true;

  light.shadow.mapSize.width = 4096;
  light.shadow.mapSize.height = 4096;

  const d = 5000;

  // light.shadow.camera.near = 0.1;

  light.shadow.camera.left = d;
  light.shadow.camera.right = -d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;

  light.shadow.camera.far = 35000.0;
  light.shadow.bias = -0.0001;

  // light = new THREE.AmbientLight(0x101010);
  scene.add(light);

  scene.background = new THREE.Color(0x070e17);
  // scene.fog = new THREE.Fog(0x070e17, 5, maxFogDistance);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x0b3b1d,
    }));
  plane.castShadow = false;
  plane.receiveShadow = true;
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  let wallMesh = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  wallMesh.side = THREE.DoubleSide;

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(2000, 200, 10), wallMesh);
  backWall.position.set(0, 0, 1000);

  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(2000, 200, 10), wallMesh);
  frontWall.position.set(0, 0, -1000);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(10, 200, 2000), wallMesh);
  leftWall.position.set(-1000, 0, 0);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(10, 200, 2000), wallMesh);
  rightWall.position.set(1000, 0, 0);

  scene.add(backWall);
  scene.add(frontWall);
  scene.add(leftWall);
  scene.add(rightWall);

  trees.push(backWall);
  trees.push(frontWall);
  trees.push(leftWall);
  trees.push(rightWall);

  raycasterW = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 0, 2);
  raycasterS = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, 1), 0, 2);
  raycasterA = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1, 0, 0), 0, 2);
  raycasterD = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 2);

  window.addEventListener('resize', onWindowResize);

  controls = new PointerLockControls(camera, document.body);

  loadtree();
  loadDoor();
  let lavisManager = loadLavis();

  ambientSound = loadAmbientSound();
  killSound = loadKillSound();
  heartSound = loadHeartSound();

  loadNoButton();
  loadYesButton();

  document.getElementById("responseButton").addEventListener('click', function () {
    gameStarted = true;

    removeLavisText();
    document.getElementById("yesButton").style.visibility = 'hidden';
    document.getElementById("responseButton").style.visibility = "hidden";
    document.getElementById("stamina-bar").style.visibility = "visible";
    document.getElementById("stamina-back").style.visibility = "visible";

    controls.lock();
    ambientSound.play();
    // fadeSound(ambientSound);

    clock.start();
    playSayingRunSound();
  });

  lavisManager.onLoad = function() {
    let interval = loadText(document.getElementById("lavisText"), "Hey Friends, Wanna Play Warframe?");

    const listener = new THREE.AudioListener();
    camera.add(listener);
    const audioLoader = new THREE.AudioLoader();
    killerMovementSound = new THREE.PositionalAudio( listener );

    audioLoader.load( 'resources/killer.mp3', function( buffer ) {
      killerMovementSound.setBuffer( buffer );
      killerMovementSound.setLoop( true );
      killerMovementSound.setVolume(700.0);
    });

    object.add(killerMovementSound);
    animate();
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth - 5, window.innerHeight - 5);
}

function loadtree() {
  const treeManager = loadAndPlaceGLB('./resources/tree_pineDefaultA.glb', function (tree) {
    tree.scene.position.set(0, 0, -40);
    tree.scene.rotation.y = Math.PI;
    tree.scene.scale.set(100, 100, 100);

    const trunkMesh_ = tree.scene.getObjectByName('Mesh_tree_pineDefaultA_1');
    const leavesMesh_ = tree.scene.getObjectByName('Mesh_tree_pineDefaultA');

    let trunkGeometry = trunkMesh_.geometry.clone();
    let leavesGeometry = leavesMesh_.geometry.clone();
    let trunkMaterial = trunkMesh_.material;
    let leavesMaterial = leavesMesh_.material;

    trunkMesh = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
    trunkMesh.scale.set(100, 100, 100);

    leavesMesh = new THREE.InstancedMesh(leavesGeometry, leavesMaterial, count);
    leavesMesh.scale.set(100, 100, 100);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      let directionx = 1;
      let directionz = 1;
      let randomx = Math.floor(Math.random() * 2);
      let randomz = Math.floor(Math.random() * 2);
      if (randomx == 0) {
        directionx = -1;
      } else {
        directionx = 1;
      }

      if (randomz == 0) {
        directionz = -1;
      } else {
        directionz = 1;
      }

      dummy.position.x = Math.random() * spread * directionx;
      dummy.position.z = Math.random() * spread * directionz;

      // dummy.position.x = 0.3;
      // dummy.position.z = 0.3;

      dummy.updateMatrix();

      if (dummy.position.x <= 0.3 && dummy.position.x >= -0.3 && dummy.position.z <= 0.3 && dummy.position.z >= -0.3) {
        dummy.position.x *= 2;
        dummy.position.z *= 2;
        dummy.updateMatrix();
      }

      leavesMesh.setMatrixAt(i, dummy.matrix);
      trunkMesh.setMatrixAt(i, dummy.matrix);
    }

    leavesMesh.castShadow = true;
    trunkMesh.castShadow = true;
    tree.castShadow = true;

    trees.push(trunkMesh);
    trees.push(tree.scene);

    scene.add(leavesMesh);
    scene.add(trunkMesh);
    scene.add(tree.scene);
  })
}

function loadDoor() {
  loadAndPlaceGLB('resources/door_-wooden_-old_-_8mb.glb', function(door) {
    door.scene.position.set(0, 0, -10);
    door.scene.rotation.y = Math.PI;
    door.scene.scale.set(6.5, 6, 10);

    door.scene.traverse((o) => {
      if (o.isMesh) {
        o.material.emissive = new THREE.Color( 0x000000 );
        o.material.emssiveIntensity = 5.0;
      }
    });

    scene.add(door.scene);
  }); 
}

function rayCasterManager() {
  onObjectW = false;
  onObjectA = false;
  onObjectS = false;
  onObjectD = false;

  let vec = new THREE.Vector3();
  camera.getWorldDirection(vec);
  // console.log(vec);

  leftVec = new THREE.Vector3(0, 1, 0);
  leftVec.cross(vec);
  // console.log("a", upVec);

  rightVec = new THREE.Vector3();
  rightVec.copy(leftVec);
  rightVec.x = (rightVec.x * -1);
  rightVec.z = (rightVec.z * -1);
  // console.log("d", rightVec);

  backVec = new THREE.Vector3();
  backVec.copy(vec);
  backVec.x = (backVec.x * -1);
  backVec.z = (backVec.z * -1);

  raycasterW.ray.direction.copy(vec);
  raycasterA.ray.direction.copy(leftVec);
  raycasterS.ray.direction.copy(backVec);
  raycasterD.ray.direction.copy(rightVec);

  raycasterW.ray.origin.copy(controls.getObject().position);
  raycasterS.ray.origin.copy(controls.getObject().position);
  raycasterA.ray.origin.copy(controls.getObject().position);
  raycasterD.ray.origin.copy(controls.getObject().position);

  let intersections = raycasterW.intersectObjects(trees, true);
  if (intersections.length != 0) {
    onObjectW = true;
  }

  intersections = raycasterS.intersectObjects(trees, true);
  if (intersections.length != 0) {
    onObjectS = true;
  }

  intersections = raycasterA.intersectObjects(trees, true);
  if (intersections.length != 0) {
    onObjectA = true;
  }

  intersections = raycasterD.intersectObjects(trees, true);
  if (intersections.length != 0) {
    onObjectD = true;
  }
}

function inputManager() {
  const onKeyDown = function (event) {
    if (!gamePlaying) {
      return;
    } 
    
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        if (!playSound.isPlaying) {
          playSound.play();
        }
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        if (!playSound.isPlaying) {
          playSound.play();
        }
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        if (!playSound.isPlaying) {
          playSound.play();
        }
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        if (!playSound.isPlaying) {
          playSound.play();
        }
        break;

      case 'ShiftLeft':
        sprint = true;
        playSound.setPlaybackRate(1.5);
        break;

      case 'Space':
        space = true;
        break;

      case 'ControlLeft':
        ctrl = true;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        if (!(moveForward || moveLeft || moveRight || moveBackward)) {
          playSound.pause();
        }
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        if (!(moveForward || moveLeft || moveRight || moveBackward)) {
          playSound.pause();
        }
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        if (!(moveForward || moveLeft || moveRight || moveBackward)) {
          playSound.pause();
        }
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        if (!(moveForward || moveLeft || moveRight || moveBackward)) {
          playSound.pause();
        }
        break;

      case 'ShiftLeft':
        sprint = false;
        playSound.setPlaybackRate(1.0);
        break;

      case 'Space':
        space = false;
        break;

      case 'ControlLeft':
        ctrl = false;
        break;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function moveCamera() {
  let stepSize = 0.125;
  let sprintMultiplier = 2;
  let velocityy = 0;

  rayCasterManager();

  if (moveForward && moveBackward) {
    velocityz = 0;
  } else if (moveForward) {
    if (onObjectW) {
      velocityz = 0;
    } else {
      velocityz = 1;
    }
  } else if (moveBackward) {
    if (onObjectS) {
      velocityz = 0;
    } else {
      velocityz = -1;
    }
  }

  if (moveLeft && moveRight) {
    velocityx = 0;
  } else if (moveLeft) {
    if (onObjectA) {
      velocityx = 0;
    } else {
      velocityx = -1;
    }
  } else if (moveRight) {
    if (onObjectD) {
      velocityx = 0;
    } else {
      velocityx = 1;
    }
  }

  if (sprint && canRun) {
    stamina = Math.max(stamina - 1, 0);
    sprintMultiplier = 2;
    staminaClock.start();
  } else if (!sprint || !canRun) {
    sprintMultiplier = 1;
  }

  if (stamina == 0) {
    canRun = false;
    playSound.setPlaybackRate(1.0);
  }

  if (staminaClock.getElapsedTime() > 1) {
    canRun = true;
    stamina = Math.min(stamina + 1, staminaMax);
  }

  if (space && ctrl) {
    velocityy = 0;
  } else if (ctrl) {
    velocityy = -1;
  } else if (space) {
    velocityy = 1;
  }

  controls.moveForward(velocityz * stepSize * sprintMultiplier);
  controls.moveRight(velocityx * stepSize * sprintMultiplier);
  camera.position.y += velocityy;

  velocityx = 0;
  velocityz = 0;
  velocityy = 0;
}

function loadLavis() {
  let manager = new THREE.LoadingManager();
  let loader = new FBXLoader(manager);
  loader.load('./resources/Fast Run.fbx', function (group) {
    group.traverse(function (child) {
      child.castShadow = true;
    });

    object = group;
    if (object.animations && object.animations.length) {
      runMixer = new THREE.AnimationMixer(object);
      run = runMixer.clipAction(object.animations[0]);
      // run.play();
    } else {
      runMixer = null;
    }

    let loaderanim = new FBXLoader();
    loaderanim.load('./resources/idle.fbx', function (animation) {
      idleMixer = new THREE.AnimationMixer(object);
      idle = idleMixer.clipAction(animation.animations[0]);
      idle.play();
    });

    let loaderWalk = new FBXLoader();
    loaderWalk.load('./resources/Walking.fbx', function (animation) {
      walkMixer = new THREE.AnimationMixer(object);
      walk = walkMixer.clipAction(animation.animations[0]);
      // walk.play();
    });

    const texture = new THREE.TextureLoader().load("./resources/IMG_5216.jpg");

    const lavisMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const box = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), [0, 0, 0, 0, lavisMaterial]);
    box.position.set(0, -15, -7);

    object.scale.set(0.065, 0.065, 0.065);
    object.position.set(0, 0, -10);

    const helper = new THREE.SkeletonHelper(object);
    helper.bones[11].add(box);

    object.updateProjectionMatrix
    object.lookAt(new THREE.Vector3(0, 1, 0));
    scene.add(object);
  });
  
  return manager;
}

function moveLavis() {
  // console.log(lavisSpeed);  
  lavisSpeed += 0.00001;

  if (object && clock.getElapsedTime() > 5) {
    if (!walking) {
      killerMovementSound.play();
      idle.stop();
      walking = true;
      walk.play();
      killerMovementSound.setPlaybackRate(0.5);
    }

    if (lavisSpeed > lavisSpeedThreshold && !running) {
      walk.stop();
      running = true;
      run.play();
      killerMovementSound.setPlaybackRate(2.0);
    }


    let vec = new THREE.Vector3();
    object.getWorldDirection(vec);

    object.position.set(object.position.x + vec.x * lavisSpeed, 0, object.position.z + vec.z * lavisSpeed);

    if (object.position.distanceTo(camera.position) > fogDistance + 10) {
      let origin = new THREE.Vector3()
      origin.copy(camera.position);
      origin.y = 0;

      let vec = new THREE.Vector3();
      let left = new THREE.Vector3;
      let right = new THREE.Vector3;
      let back = new THREE.Vector3;

      camera.getWorldDirection(vec)
      left.copy(leftVec);
      right.copy(rightVec);
      back.copy(backVec);

      vec.y = 0;
      left.y = 0;
      right.y = 0;
      back.y = 0;

      let random = Math.floor(Math.random() * 4);

      if (random == 0) {
        object.position.copy(origin.add(vec.multiplyScalar(fogDistance)));
      } else if (random == 1) {
        object.position.copy(origin.add(left.multiplyScalar(fogDistance)));
      } else if (random == 2) {
        object.position.copy(origin.add(right.multiplyScalar(fogDistance)));
      } else if (random == 3) {
        object.position.copy(origin.add(back.multiplyScalar(fogDistance)));
      }
    }
  }
}

function checkFadeIn() {
  if (lavisSpeed >= lavisSpeedThreshold - 0.01 && !hasFaded) {
    console.log("fading");
    fadeSound(ambientSound);
    fadeOutOnly(killerMovementSound);
    fadeInCut(heartSound);
    hasFaded = true;
  }
}

function updateFog() {
  fogDistance = Math.max(100, (maxFogDistance - (clock.getElapsedTime() * 3)));
  scene.fog = new THREE.Fog(0x070e17, 5, fogDistance);
}

function updateStaminaBar() {
  let percentage = Math.floor(100 * stamina / staminaMax) / 100;
  document.getElementById("stamina-bar").style.width = percentage * 25 + "%";
}

function endGame() {
  ambientSound.stop();
  playSound.stop();
  killerMovementSound.stop();

  document.getElementById("container").style.visibility = 'hidden';
  document.getElementById("imageContainer").style.visibility = 'visible';
  killSound.play();
}

function checkEnd() {
  if (object.position.distanceTo(camera.position) < 10.3) {
    // gamePlaying = false;
    // endGame();
  }
}

function proximitySound() {
  let distance = object.position.distanceTo(camera.position);
  let percentage = 10.3 / (distance*2);
  console.log(percentage);
  // annoyingSound.setVolume(percentage);
}

function animate() {
  

  if (gamePlaying) {
    requestAnimationFrame(() => {
      const delta = animationClock.getDelta();

      if (gameStarted && clock.elapsedTime < 0.5) {
        camera.position.lerp(new THREE.Vector3(0,10,0), 0.05);
      }

      if (clock.elapsedTime > 0.5 && !inputManaged) {
        inputManager();
        inputManaged = true;
      }
      

      checkEnd();
      moveCamera();
      updateFog();
      updateStaminaBar();
      checkFadeIn();

      if (runMixer) runMixer.update(delta);
      if (idleMixer) idleMixer.update(delta);
      if (walkMixer) walkMixer.update(delta);
      let tempVec = new THREE.Vector3;
      tempVec.copy(camera.position);
      tempVec.y = 0;
      if (object) object.lookAt(tempVec);

      if (gameStarted) {
        window.addEventListener('click', function () {
          controls.lock();
        })
      }

      moveLavis();
      renderer.render(scene, camera);
      animate();
    });
  }
}
