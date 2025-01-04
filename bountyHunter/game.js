var isTrainingMode = false
var coins =9999999
var pistolCount = 0
var ak47Count = 0
var rlCount = 0
var armyCount = 0
var tankCount = 0
var jetCount = 0
var nukeCount = 0
var myHealth = 100
var fullHealth = 100
var isSuperMode = false
var currentCriminalHealth
var currentDMG = 1
var currentLevel = 1
var currentSelection = "knife"
var incHealthPrice = 1000
var scrollCount = 0
var clickedCount = 0
var isSlot1Empty = true

const egg1Price = 10000
const egg2Price = 50000
const knifeDamage = 1
const pistolDamage = 10
const ak47Damage = 50
const rlDamage = 100
const armyDamage = 200
const tankDamage = 500
const jetDamage = 1000
const nukeDamage = 100000
const criminal1Health = 500
const criminal2Health = 1000
const criminal3Health = 1500
const criminal4Health = 5000
const criminal5Health = 10000

window.addEventListener('wheel', (event) => {
        console.log('Scroll detected:', event);
        scrollCount++
        if (scrollCount >= 15) {
            
        }
    }
);

function g(id) {
    return document.getElementById(id)
}

function train() {
    if (isTrainingMode == true) {
        document.body.style.backgroundImage = "url('./images/forest.webp')"; 
        document.getElementById("training").innerHTML="training"    
        isTrainingMode = false 
        document.getElementById("ragdoll").style.display = "none"
        document.getElementById("bigCircle").style.display = "none"
        document.getElementById("midCircle").style.display = "none"
        document.getElementById("smallCircle").style.display = "none"
        document.getElementById("tinyCircle").style.display = "none"
    }else{
        document.body.style.backgroundImage = "url('./images/trainingBackground.jpg')"; 
        document.getElementById("training").innerHTML="back"    
        isTrainingMode = true
        document.getElementById("ragdoll").style.display = "block"
        document.getElementById("bigCircle").style.display = "block"
        document.getElementById("midCircle").style.display = "block"
        document.getElementById("smallCircle").style.display = "block"
        document.getElementById("tinyCircle").style.display = "block"
    }

}
function hitBigCircle(params) {
    coins++
    document.getElementById("coinCount").innerHTML=coins
}
function hitMidCircle(params) {
    coins+=5
    document.getElementById("coinCount").innerHTML=coins

}
function hitSmallCircle(params) {
    coins+=10
    document.getElementById("coinCount").innerHTML=coins

}
function hitTinyCircle(params) {
    coins+=15
    document.getElementById("coinCount").innerHTML=coins

}


function buyPistol(params) {
    if (coins >= 500 ) {
        coins-=500
        pistolCount++
        document.getElementById("coinCount").innerHTML=coins
        document.getElementById("pistolCount").innerHTML=pistolCount
    }
}
function buyAk47(params) {
    if (coins >= 1000 ) {
        coins-=1000
        ak47Count++
        document.getElementById("coinCount").innerHTML=coins
        document.getElementById("ak47Count").innerHTML=ak47Count
    }
}
function buyRL(params) {
    if (coins >= 10000 ) {
        coins-=10000
        rlCount++
        document.getElementById("coinCount").innerHTML=coins
        document.getElementById("rlCount").innerHTML=rlCount
    }
}
function buyArmy(params) {
    if (coins >= 100000 ) {
        coins-=100000
        armyCount++
        document.getElementById("coinCount").innerHTML=coins
        document.getElementById("armyCount").innerHTML=armyCount
    }
}
function buyTank(params) {
    if (coins >= 1000000 ) {
        coins-=1000000
        tankCount++
        document.getElementById("coinCount").innerHTML=coins
        document.getElementById("tankCount").innerHTML=tankCount
    }
}
function buyJet(params) {
    if (coins >= 5000000 ) {
        coins-=5000000
        jetCount++
        document.getElementById("coinCount").innerHTML=coins
        document.getElementById("jetCount").innerHTML=jetCount
    }
}
function buyNuke(params) {
    if (coins >= 10000000 ) {
        coins-=10000000
        nukeCount++
        document.getElementById("coinCount").innerHTML=coins
        document.getElementById("nukeCount").innerHTML=nukeCount
    }
}
function resetSelection(params) {
    document.getElementById("knifeOption").classList.remove("selectedWeapon")
    document.getElementById("pistolOption").classList.remove("selectedWeapon")
    document.getElementById("ak47Option").classList.remove("selectedWeapon")
    document.getElementById("rlOption").classList.remove("selectedWeapon")
    document.getElementById("armyOption").classList.remove("selectedWeapon")
    document.getElementById("tankOption").classList.remove("selectedWeapon")
    document.getElementById("jetOption").classList.remove("selectedWeapon")
    document.getElementById("nukeOption").classList.remove("selectedWeapon")
}
function useKnife(params) {
    currentDMG = knifeDamage
    currentSelection = "knife"
    resetSelection()
    document.getElementById("knifeOption").classList.toggle("selectedWeapon")
}
function usePistol(params) {
    currentDMG = pistolDamage
    currentSelection = "pistol"
    resetSelection()
    document.getElementById("pistolOption").classList.toggle("selectedWeapon")
}
function useAk47(params) {
    currentDMG = ak47Damage
    currentSelection = "ak47"
    resetSelection()
    document.getElementById("ak47Option").classList.toggle("selectedWeapon")

}
function useRL(params) {
    currentDMG = rlDamage
    currentSelection = "rl"
    resetSelection()
    document.getElementById("rlOption").classList.toggle("selectedWeapon")
}
function useArmy(params) {
    currentDMG = armyDamage
    currentSelection = "army"
    resetSelection()
    document.getElementById("armyOption").classList.toggle("selectedWeapon")
}
function useTank(params) {
    currentDMG = tankDamage
    currentSelection = "tank"
    resetSelection()
    document.getElementById("tankOption").classList.toggle("selectedWeapon")
}
function useJet(params) {
    currentDMG = jetDamage
    currentSelection = "jet"
    resetSelection()
    document.getElementById("jetOption").classList.toggle("selectedWeapon")
}
function useNuke(params) {
    currentDMG = nukeDamage
    currentSelection = "nuke"
    resetSelection()
    document.getElementById("nukeOption").classList.toggle("selectedWeapon")
}

function saveGame(params) {
    localStorage.setItem('coins', coins);
    localStorage.setItem('pistolCount', pistolCount);
    localStorage.setItem('ak47Count', ak47Count);
    localStorage.setItem('rlCount', rlCount);
    localStorage.setItem('armyCount', armyCount);
    localStorage.setItem('tankCount', tankCount);
    localStorage.setItem('jetCount', jetCount);
    localStorage.setItem('nukeCount', nukeCount);
}

function initGame(params) {
    coins = +localStorage.getItem('coins');
    document.getElementById("coinCount").innerHTML=coins

    pistolCount = localStorage.getItem('pistolCount');
    document.getElementById("pistolCount").innerHTML=pistolCount 

    ak47Count = localStorage.getItem('ak47Count');
    document.getElementById("ak47Count").innerHTML=ak47Count  

    rlCount = localStorage.getItem('rlCount');
    document.getElementById("rlCount").innerHTML=rlCount  

    armyCount = localStorage.getItem('armyCount');
    document.getElementById("armyCount").innerHTML=armyCount  
     
    tankCount = localStorage.getItem('tankCount');
    document.getElementById("tankCount").innerHTML=tankCount  

    jetCount = localStorage.getItem('jetCount');
    document.getElementById("jetCount").innerHTML=jetCount

    nukeCount = localStorage.getItem('nukeCount');
    document.getElementById("nukeCount").innerHTML=nukeCount
}

    function genInt(max) {
        return Math.floor(Math.random() * max);
      }
      
function findCriminal(params) {
    if (genInt(2) == 0) {
        document.getElementById("criminalMessage").style.display = "block"
        setTimeout(() => {
            document.getElementById("criminalMessage").style.display = "none"
        }, 6000);
    }else{
        document.getElementById("foundTrack").style.display = "block"
        document.getElementById("found_bar").style.display = "block"
        document.getElementById("pointer").style.display = "block"
        document.getElementById("stopButton").style.display = "block"
        const element = document.getElementById('pointer');
        element.style.animationPlayState = 'running';
    }
}
function stopPointer() {
        const element = document.getElementById('pointer');
        element.style.animationPlayState = 'paused';

        let pointerRight = document.getElementById("pointer").getBoundingClientRect().right
        let pointerLeft = document.getElementById("pointer").getBoundingClientRect().left
        let pointerCenter = (pointerLeft + pointerRight)  / 2
        let foundLeft = document.getElementById("found").getBoundingClientRect().left
        let foundRight = document.getElementById("found").getBoundingClientRect().right

        if (pointerCenter < foundLeft) {
            // bad
            
        } else if (pointerCenter > foundRight) {
            // bad
        } else {
            // good
            // Create the image element
            const imgCriminal = document.createElement('img');
            document.getElementById("cHealthBar").style.display = "block"
            // Set the source (URL) of the image
            if (currentLevel == 1) {
                imgCriminal.src = './images/criminal.png'; 
                currentCriminalHealth = criminal1Health
            }else if (currentLevel == 2) {
                imgCriminal.src = './images/criminal2.png'; 
                currentCriminalHealth = criminal2Health
            }else if (currentLevel == 3) {
                imgCriminal.src = './images/criminal3.png'; 
                currentCriminalHealth = criminal3Health
            }else if (currentLevel == 4) {
                imgCriminal.src = './images/criminal4.png'
                currentCriminalHealth = criminal4Health
            }else if (currentLevel == 5) {
                imgCriminal.src = './images/criminal5.png'
                currentCriminalHealth = criminal5Health
            }
            document.getElementById("cHealth").innerHTML = currentCriminalHealth
            document.getElementById("cHealthBar").style.backgroundColor = "rgb(86, 255, 86)"
            imgCriminal.style.position = 'absolute';
            imgCriminal.style.top = '100px'; // Adjust as needed
            imgCriminal.style.left = '200px'; // Adjust as needed
            // imgCriminal.style.height = '250px';
            imgCriminal.style.width = '150px';
            imgCriminal.onclick = function() {
                currentCriminalHealth -= currentDMG

                if (currentSelection == "pistol" && pistolCount > 0) {
                    pistolCount--
                    document.getElementById("pistolCount").innerHTML = pistolCount
                }else if (currentSelection == "ak47" && ak47Count > 0) {
                    ak47Count--
                    document.getElementById("ak47Count" ).innerHTML = ak47Count
                }else if (currentSelection == "rl" && rlCount > 0) {
                    rlCount--
                    document.getElementById("rlCount").innerHTML = rlCount
                }else if (currentSelection == "army" && armyCount > 0) {
                    armyCount--
                    document.getElementById("armyCount").innerHTML = armyCount
                }else if (currentSelection == "tank" && tankCount > 0) {
                    tankCount--
                    document.getElementById("tankCount").innerHTML = tankCount
                }else if (currentSelection == "jet" && jetCount > 0) {
                    jetCount--
                    document.getElementById("jetCount").innerHTML = jetCount
                }else if (currentSelection == "nuke" && nukeCount > 0) {
                    nukeCount--
                    document.getElementById("nukeCount").innerHTML = nukeCount
                }else{
                    currentSelection = "knife"
                    currentDMG = 1
                    resetSelection()
                    document.getElementById("knifeOption").classList.add("selectedWeapon")
                }

                if (currentCriminalHealth <= 0) {
                    currentCriminalHealth = 0
                    currentLevel++
                    imgCriminal.remove()
                    clearInterval(shoot)
                    document.getElementById("cHealthBar").style.display = "none"
                }
                document.getElementById("cHealth").innerHTML = currentCriminalHealth
                if (currentCriminalHealth <= 150*currentLevel ) {
                    document.getElementById("cHealthBar").style.backgroundColor = "red"
                } else if (currentCriminalHealth <= 350*currentLevel) {
                    document.getElementById("cHealthBar").style.backgroundColor = "orange"

                }
            };

            imgCriminal.style.transition = "all 1s"

            // Add the image to the DOM
            document.body.appendChild(imgCriminal);
            let shoot = setInterval(() => {
                if (isSuperMode == true) {
                    myHealth-=5
                }else {
                    myHealth-=5*currentLevel
                }
                imgCriminal.style.left=Math.random()*900+"px";
                imgCriminal.style.top=Math.random()*600+"px";
                if (myHealth <= 30 ) {
                    document.getElementById("myHealthBar").style.backgroundColor = "red"
                } else if (myHealth <= 60) {
                    document.getElementById("myHealthBar").style.backgroundColor = "orange"

                }

                if (myHealth < 0) {
                    document.getElementById("gameOverBoard").style.display = "block"
                    clearInterval(shoot)
                    imgCriminal.style.display = "none"
                } else {
                    const audio = new Audio("./sounds/gunShot.mp3");
                    audio.play();
                    document.getElementById("myHealth").innerHTML = myHealth + " / " + fullHealth
                }
            },1000); 
        }

        setTimeout(() => {
            document.getElementById("pointer").style.display = "none"
            document.getElementById("stopButton").style.display = "none"
            document.getElementById("found_bar").style.display = "none"
            document.getElementById("foundTrack").style.display = "none"
        }, 300);

        

}
function superCharge(params) {
    if (isSuperMode == false) {
        const audio = new Audio("./sounds/superMode.mp3");
        audio.play();
        isSuperMode = true
        currentDMG*=2
        document.getElementById("superChargeBlocker").style.display = "block"
        setTimeout(() => {
            document.getElementById("superChargeBlocker").style.display = "none"
        }, 60000);
        const element = document.getElementById("myHealthBar"); 

        // Set the background image
        element.style.backgroundImage = "url('./images/rainbow.gif')"; 
        setTimeout(() => {
            isSuperMode = false
            // health bar become normal
            const element = document.getElementById("myHealthBar"); 
            currentDMG/=2
            // Set the background image
            element.style.backgroundImage = ""; 
        }, 12000);
    }
    
}
function heal() {
    if (coins >= 500) {
        myHealth = fullHealth
        document.getElementById("myHealth").innerHTML = myHealth + " / " + fullHealth
        document.getElementById("myHealthBar").style.backgroundColor = "rgb(86, 255, 86)"
        coins-=500
        document.getElementById("coinCount").innerHTML = coins
    }
}
function incHealth(params) {
    if (coins >= incHealthPrice) {
        coins-= incHealthPrice
        document.getElementById("coinCount").innerHTML = coins
        fullHealth+=50
        document.getElementById("myHealth").innerHTML = myHealth + " / " + fullHealth
        incHealthPrice+=1000
        document.getElementById("mrHPPrice").innerHTML = incHealthPrice
    }
}
// function showStats1(params) {
    
// }
function selectRandomPet(params) {
    let n = genInt(13)
    switch (n) {
        case 0:
        case 1:
        case 2:
            return "./images/pet_Dog.webp"
            break;
        case 3:
        case 4:
        case 5:
            return "./images/pet_Cat.png"
            break;
        case 6:
        case 7:
            return "./images/pet_Neon_Cat.webp"
            break;
        case 8:
        case 9:
            return "./images/pet_Neon_Dog.webp"
            break;
        case 10:
            return "./images/pet_Diamond_Cat.webp"
            break;
        case 11:
            return "./images/pet_Diamond_Dog.webp"
            break;
        case 12:
            return "./images/pet_Crystal_Deer.webp"
            break;        
        default:
            break;
    }
}
function buyEgg1(params) {
    if (coins>=egg1Price) {
        coins-=egg1Price
        document.getElementById("coinCount").innerHTML = coins   
        g("centerEgg").style.display = "block"
        openEgg()
    }
}
function buyEgg2(params) {
    
}
function buyEgg3(params) {
    
}
function openEgg(params) {
    clickedCount++
    if (clickedCount == 3) {
        let petImage = selectRandomPet()
        document.getElementById("centerEgg").src = petImage 
        setTimeout(() => {
            document.getElementById("centerEgg").style.display = "none"
            if (isSlot1Empty == true) {
                g("slot1").style.backgroundImage = `url(${petImage})`
            }else{
                
            }
        }, 5000);

    }
    zoomIn()
    setTimeout(() => {
        zoomOut()
    }, 100);
}
let zoomLevel = 1;

function zoomIn() {
  zoomLevel += 0.1;
  document.getElementById("centerEgg").style.transform = ` translate(-50%, -50%) scale(${zoomLevel}) `;
}

function zoomOut() {
  if (zoomLevel > 1) {
    zoomLevel -= 0.1;
    document.getElementById("centerEgg").style.transform = ` translate(-50%, -50%) scale(${zoomLevel})`;
  }
}