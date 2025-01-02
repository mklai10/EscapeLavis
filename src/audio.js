import * as THREE from 'three';

function playerRunSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();
    const sound = new THREE.Audio( listener );

    audioLoader.load( 'resources/running.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume(3.0);
        sound.hasPlaybackControl = true;
        // sound.play();
    });

    return sound;
}

function loadAmbientSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();
    const sound = new THREE.Audio( listener );

    audioLoader.load( 'resources/ambience-night-field-cricket-01-7015.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume(1.0);
        sound.hasPlaybackControl = true;
        // sound.autoplay = true;
    });

    return sound;
}

function loadKillSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();
    const sound = new THREE.Audio( listener );

    audioLoader.load( 'resources/wooyeah.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( false );
        sound.setVolume(8.0);
        sound.hasPlaybackControl = true;
        // sound.autoplay = true;
    });

    return sound;
}

function loadHeartSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();
    const sound = new THREE.Audio( listener );

    audioLoader.load( 'resources/heart.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume(100.0);
        sound.hasPlaybackControl = true;
    });

    return sound;
}

function playSayingRunSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();
    const sound = new THREE.Audio( listener );

    audioLoader.load( 'resources/sayingRun (2).mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( false );
        sound.setVolume(3.0);
        sound.hasPlaybackControl = true;
        sound.play();
    });

    return sound;
}

function fadeSound(sound) {
    let originalVolume = sound.getVolume();
    let currVol = originalVolume;
    let increment = currVol / 100.0;
    let intervalOut = window.setInterval(function() {
        if (currVol <= 0) {
            clearInterval(intervalOut);
            // sound.setVolume(originalVolume);
            let intervalIn = window.setInterval(function() {
                if (currVol == originalVolume) {
                    clearInterval(intervalIn);
                } else {
                    sound.setVolume(currVol + increment);
                    currVol = sound.getVolume();
                }
            }, 100);
        } else {
            sound.setVolume(currVol - increment);
            currVol = sound.getVolume();
        }
        
    }, 100);
}

function fadeOutOnly(sound) {
    let originalVolume = sound.getVolume();
    let currVol = originalVolume;
    let increment = currVol / 100.0;
    let intervalOut = window.setInterval(function() {
        if (currVol <= 0) {
            clearInterval(intervalOut);
            sound.setVolume(originalVolume);
        } else {
            sound.setVolume(currVol - increment);
            currVol = sound.getVolume();
        }
        
    }, 100);
}

function fadeInCut(sound) {
    let originalVolume = sound.getVolume();
    // let originalVolume = 1.0
    let currVol = 0.0;
    sound.setVolume(currVol);
    sound.play();
    let increment = originalVolume / 50.0;
    let intervalIn = window.setInterval(function() {
        if (currVol >= originalVolume) {
            clearInterval(intervalIn);
            sound.stop();
        } else {
            sound.setVolume(currVol + increment);
            currVol = sound.getVolume();
        }
        
    }, 100);
}


export { playerRunSound, loadAmbientSound, loadKillSound, playSayingRunSound, fadeSound, fadeOutOnly, fadeInCut, loadHeartSound }