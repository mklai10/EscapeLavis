function loadText(element, text) {
    let place = 1;
    let interval = window.setInterval(function () {
        element.innerHTML = text.substring(0, place);
        place++
        // if (place == text.length) {
        //     clearInterval(interval+1);
        // }
    }, 100);
    return interval;
}

function loadNoButton() {
    let button = document.getElementById("responseButton");
    window.setTimeout(function () {
        loadText(button, "No");
        clearInterval();
    }, 5500);

    button.addEventListener('mouseover', function() {
        button.style.color = 'red';
        button.style.fontSize = '100px';
        button.style.top = '78%'
        button.style.left = '47%'
    })

    button.addEventListener('mouseleave', function() {
        button.style.color = 'white';
        button.style.fontSize = '50px';
        button.style.top = '80%'
        button.style.left = '48%'
    })
}

function loadYesButton() {
    let button = document.getElementById("yesButton");
    window.setTimeout(function () {
        loadText(button, "Yes");
        clearInterval();
    }, 5500);

    button.addEventListener('mouseover', function() {
        button.style.top = Math.floor(Math.random()*80) + '%'
        button.style.left = Math.floor(Math.random()*80) + '%'
    })
}

function removeLavisText() {
    document.getElementById("lavisText").style.visibility = "hidden";
}

export { loadText, removeLavisText, loadNoButton, loadYesButton };