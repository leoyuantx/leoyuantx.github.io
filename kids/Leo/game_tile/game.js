const boxLength = 200;

var numberOfSteps = 0;

let p1 = {
    left: "0px",
    top:"0px",
    isOccupied: false
}

let p2 = {
    left: "200px",
    top:"0px",
    isOccupied: false
}

let p3 = {
    left: "400px",
    top:"0px",
    isOccupied: false
}

let p4 = {
    left: "0px",
    top:"200px",
    isOccupied: false
}

let p5 = {
    left: "200px",
    top:"200px",
    isOccupied: false
}

let p6 = {
    left: "400px",
    top:"200px",
    isOccupied: false
}

let p7 = {
    left: "0px",
    top:"400px",
    isOccupied: false
}

let p8 = {
    left: "200px",
    top:"400px",
    isOccupied: false
}

let p9 = {
    left: "400px",
    top:"400px",
    isOccupied: false
}

let positions = [p1,p2,p3,p4,p5,p6,p7,p8,p9];

function clog(msg) {
    console.log(msg)
}
function g(id) {
    return document.getElementById(id)
}

function putBoxInPosition(boxId, position) {
    g(boxId).style.left = position.left;
    g(boxId).style.top = position.top;
    if(g(boxId).currentPosition) {
        g(boxId).currentPosition.isOccupied = false;
    }
    g(boxId).currentPosition = position;
    position.isOccupied = true;
    numberOfSteps++;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initAlBoxes() {
    var arr = [1,2,3,4,5,6,7,8];

    putBoxInPosition("b1", p6)
    putBoxInPosition("b2", p7)
    putBoxInPosition("b3", p4)
    putBoxInPosition("b4", p5)
    putBoxInPosition("b5", p3)
    putBoxInPosition("b6", p1)
    putBoxInPosition("b7", p2)
    putBoxInPosition("b8", p9)

    // const randomArray = shuffleArray(arr);
    // clog(randomArray)
    // for (let index = 0; index < arr.length; index++) {
    //     const element = randomArray[index];
    //     clog(`${element} - ${positions[index]}`)
    //     putBoxInPosition("b"+element, positions[index])
    // }
    
    numberOfSteps = 0;

    showLeadersBoard()
}

function isPositionAvailable(p) {
    return !p.isOccupied
}

function checkSuccess() {
    if(g("b1").currentPosition == p1
        && g("b2").currentPosition == p2
        && g("b3").currentPosition == p3
        && g("b4").currentPosition == p4
        && g("b5").currentPosition == p5
        && g("b6").currentPosition == p6
        && g("b7").currentPosition == p7
        && g("b8").currentPosition == p8
    ) {
        setTimeout(() => {
            alert("You did it in " + numberOfSteps + " steps");
            var name = prompt("Enter your name to be saved in the leaders board")
            saveRecord(name)
        }, 300);
    }
}

function onBoxClick(boxId) {
    if (g(boxId).currentPosition == p1) {
        if (isPositionAvailable(p2)) {
            putBoxInPosition(boxId, p2)
        } else if(isPositionAvailable(p4)){
            putBoxInPosition(boxId, p4)
        }
    } else if (g(boxId).currentPosition == p2) {
        if (isPositionAvailable(p1)) {
            putBoxInPosition(boxId, p1)
        } else if(isPositionAvailable(p3)){
            putBoxInPosition(boxId, p3)
        } else if(isPositionAvailable(p5)){
            putBoxInPosition(boxId, p5)
        }
    } else if(g(boxId).currentPosition == p3) {
        if (isPositionAvailable(p2)) {
            putBoxInPosition(boxId, p2)
        } else if(isPositionAvailable(p6)){
            putBoxInPosition(boxId, p6)
        }
    } else if (g(boxId).currentPosition == p4) {
        if (isPositionAvailable(p1)) {
            putBoxInPosition(boxId, p1)
        } else if(isPositionAvailable(p5)){
            putBoxInPosition(boxId, p5)
        } else if(isPositionAvailable(p7)){
            putBoxInPosition(boxId, p7)
        }
    } else if (g(boxId).currentPosition == p5) {
        if (isPositionAvailable(p2)) {
            putBoxInPosition(boxId, p2)
        } else if(isPositionAvailable(p4)){
            putBoxInPosition(boxId, p4)
        } else if(isPositionAvailable(p6)){
            putBoxInPosition(boxId, p6)
        } else if(isPositionAvailable(p8)){
            putBoxInPosition(boxId, p8)
        }
    } else if (g(boxId).currentPosition == p6) {
        clog(true)
        if (isPositionAvailable(p3)) {
            putBoxInPosition(boxId, p3)
        } else if(isPositionAvailable(p5)){
            putBoxInPosition(boxId, p5)
        } else if(isPositionAvailable(p9)){
            putBoxInPosition(boxId, p9)
        }
    } else if (g(boxId).currentPosition == p7) {
        if (isPositionAvailable(p4)) {
            putBoxInPosition(boxId, p4)
        } else if(isPositionAvailable(p8)){
            putBoxInPosition(boxId, p8)
        }
    } else if (g(boxId).currentPosition == p8) {
        if (isPositionAvailable(p5)) {
            putBoxInPosition(boxId, p5)
        } else if(isPositionAvailable(p7)){
            putBoxInPosition(boxId, p7)
        } else if(isPositionAvailable(p9)){
            putBoxInPosition(boxId, p9)
        }
    } else if (g(boxId).currentPosition == p9) {
        if (isPositionAvailable(p6)) {
            putBoxInPosition(boxId, p6)
        } else if(isPositionAvailable(p8)){
            putBoxInPosition(boxId, p8)
        }
    }

    checkSuccess()
    
}

function saveRecord(name) {
    let gamer = {
        name: name,
        numberOfSteps: numberOfSteps
    }

    let retrievedPeople = JSON.parse(localStorage.getItem("leaders"));
    if (retrievedPeople == null) {
        retrievedPeople = []
    } 
    retrievedPeople.push(gamer)
    retrievedPeople.sort((a, b) => a.numberOfSteps - b.numberOfSteps);

    console.log(retrievedPeople);
    
    localStorage.setItem("leaders", JSON.stringify(retrievedPeople));
}

function showLeadersBoard() {
    let retrievedPeople = JSON.parse(localStorage.getItem("leaders"));
    if (retrievedPeople == null) {
        return
    } 

    const lengthToIterate = Math.min(retrievedPeople.length, 5);

    // Iterate over the first 5 elements
    for (let i = 0; i < lengthToIterate; i++) {
        clog(retrievedPeople[i].name)
        g(`l${i+1}`).innerHTML = `${retrievedPeople[i].name}: ${retrievedPeople[i].numberOfSteps} steps`
    }
}