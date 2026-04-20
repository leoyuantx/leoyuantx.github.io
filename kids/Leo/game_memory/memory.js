var result = [1,3,2,4];
var gamersAnswer = [];
var numberOfRounds = 0;

const STATES = {
    PLAYING: "PLAYING",
    ANSWERING: "ANSWERING",
    END:"END"
}
var gameState = STATES.PLAYING

function clog(msg) {
    console.log(msg)
}

function setGameState(state) {
    if (state == STATES.PLAYING) {
        gameState = STATES.PLAYING

        setTimeout(() => {
            g("instruction").innerHTML = `Round ${numberOfRounds}:  Playing the sequence...`
            toggleInstruction(true)
        }, 300);
        
        g("board_cover").style.display = "block"
    } else if(state == STATES.ANSWERING) {
        gameState = STATES.ANSWERING
        g("board_cover").style.display = "none"
        toggleInstruction(false)
        setTimeout(() => {
            g("instruction").innerHTML = "Now it's your turn"
            toggleInstruction(true)
        }, 500);

    }
}

function addRandomOne() {
    var randomInt = Math.floor(Math.random() * 4) + 1;
    result.push(randomInt)
    numberOfRounds++;
    clog(result)
}

function g(id) {
    return document.getElementById(id)
}

function toggleInstruction(shouldShow) {
    if (shouldShow) {
        document.getElementById("instruction").style.opacity = 1
    } else {
        document.getElementById("instruction").style.opacity = 0
    }
}

function playSeq() {
    setGameState(STATES.PLAYING)
    g("board_cover").style.display = "block"

    let counter = 0;
    const intervalId = setInterval(() => {

        lightupBlock("b"+result[counter])
        counter++;
        if (counter >= result.length) {
            clearInterval(intervalId)
            
            setTimeout(() => {
                setGameState(STATES.ANSWERING)
                
            }, 1000);
            
        }
    }, 1000);
}

function compareSeq() {
    if (gamersAnswer.length > result.length) 
        return false;

    var res = gamersAnswer.every((element, index) => result[index] === element)
    if(res == false) {
        var audioEnd
        if (numberOfRounds < 2) {
            audioEnd = new Audio('./audios/end_1.wav');
        } else if (numberOfRounds < 3) {
            audioEnd = new Audio('./audios/end_2.wav');
        } else if(numberOfRounds < 4) {
            audioEnd = new Audio('./audios/end_4.wav');
        } else if(numberOfRounds < 6) {
            audioEnd = new Audio('./audios/end_6.wav');
        } else {
            audioEnd = new Audio('./audios/end_8.wav');
        }
        audioEnd.play()
        
        setTimeout(() => {
            alert("You've completed " + numberOfRounds + " rounds.")    
            location.reload()
        }, 200);
        
    }

    if (res == true && gamersAnswer.length == result.length) {
        addRandomOne()
        gamersAnswer = []
        var audioPass
        if (numberOfRounds < 3) {
            audioPass = new Audio('./audios/success_meow.wav');
        } else if (numberOfRounds < 5) {
            audioPass = new Audio('./audios/success_sparkle.wav');
        } else if(numberOfRounds < 7) {
            audioPass = new Audio('./audios/success_dingdong.wav');
        } else {
            audioPass = new Audio('./audios/success_horn.wav');
        }
        audioPass.play()
        setTimeout(() => {
            playSeq()    
        }, 1000);
        
    }

    return res;
}

function lightupBlock(id) {
    var lightColor
    var originalColor
    var audio
    switch (id) {
        case "b1":
            audio = new Audio('./audios/n1.mov');
            lightColor = "red"
            originalColor = "darkred"
            break;
        case "b2":
            audio = new Audio('./audios/n2.mov');
            lightColor = "greenyellow"
            originalColor = "green"
            break;
        case "b3":
            audio = new Audio('./audios/n3.mov');
            lightColor = "blue"
            originalColor = "darkblue"
            break;
        case "b4":
            audio = new Audio('./audios/n4.mov');
            lightColor = "yellow"
            originalColor = "orange"
            break;
        default:
            break;
    }
    audio.play()
    g(id).style.backgroundColor = lightColor;
    setTimeout(() => {
        g(id).style.backgroundColor = originalColor;
    }, 500);
}

function startGame() {
    clog("start")
    playSeq()
    g("onboarding").style.display = "none"
    g("board").style.display = "flex"
    g("board_cover").style.display = "block"
}

function init() {
    clog("init")
    g("b1").onmousedown = () => {
        toggleInstruction(false)
        g("b1").style.backgroundColor = "red";
        var audio = new Audio('./audios/n1.mov');
        audio.play()
    };

    
    g("b1").onmouseup = () => {
        g("b1").style.backgroundColor = "darkred";
        gamersAnswer.push(1);
        clog(compareSeq())
    };

    g("b1").ontouchstart = () => {
        g("b1").style.backgroundColor = "red";
    };

    g("b1").ontouchend = () => {
        g("b1").style.backgroundColor = "darkred";
        gamersAnswer.push(1);
        clog(compareSeq())
    };

    g("b2").onmousedown = () => {
        g("b2").style.backgroundColor = "greenyellow";
        var audio = new Audio('./audios/n2.mov');
        audio.play()
    };
    
    g("b2").onmouseup = () => {
        g("b2").style.backgroundColor = "green";
        gamersAnswer.push(2);
        clog(compareSeq())
    };

    g("b2").ontouchstart = () => {
        g("b2").style.backgroundColor = "greenyellow";
    };

    g("b2").ontouchend = () => {
        g("b2").style.backgroundColor = "green";
        gamersAnswer.push(2);
        clog(compareSeq())
    };

    g("b3").onmousedown = () => {
        g("b3").style.backgroundColor = "blue";
        var audio = new Audio('./audios/n3.mov');
        audio.play()
    };
    
    g("b3").onmouseup = () => {
        g("b3").style.backgroundColor = "darkblue";
        gamersAnswer.push(3);
        clog(compareSeq())
    };

    g("b3").ontouchstart = () => {
        g("b3").style.backgroundColor = "blue";
    };

    g("b3").ontouchend = () => {
        g("b3").style.backgroundColor = "darkblue";
        gamersAnswer.push(3);
        clog(compareSeq())
    };

    g("b4").onmousedown = () => {
        g("b4").style.backgroundColor = "yellow";
        var audio = new Audio('./audios/n4.mov');
        audio.play()
    };
    
    g("b4").onmouseup = () => {
        g("b4").style.backgroundColor = "orange";
        gamersAnswer.push(4);
        clog(compareSeq())
    };

    g("b4").ontouchstart = () => {
        g("b4").style.backgroundColor = "yellow";
    };

    g("b4").ontouchend = () => {
        g("b4").style.backgroundColor = "orange";
        gamersAnswer.push(4);
        clog(compareSeq())
    };
  
}

