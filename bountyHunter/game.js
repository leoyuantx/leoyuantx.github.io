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
var incHealthPrice = 1000
var scrollCount = 0
var clickedCount = 0
var currentDMG = 1
var currentLevel = 1

var isSuperMode = false
var isScreenPetMoving = false
var isSlot1Empty = true
var hasPet1 = false
var isTrainingMode = false
var currentCriminalHealth
var petImage

var currentSelection = "knife"


const egg1Price = 10000
const egg2Price = 50000
const knifeDamage = 1
const pistolDamage = 10
const ak47Damage = 50
const rlDamage = 100
const armyDamage = 200
const tankDamage = 500
const jetDamage = 1000
const amongUsDamage = 1000
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
    coins+=10
    document.getElementById("coinCount").innerHTML=coins
}
function hitMidCircle(params) {
    coins+=50
    document.getElementById("coinCount").innerHTML=coins

}
function hitSmallCircle(params) {
    coins+=100
    document.getElementById("coinCount").innerHTML=coins

}
function hitTinyCircle(params) {
    coins+=250
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
    document.getElementById("knifeOption").classList.remove("selectedWeapon")   //0.1 ms
    document.getElementById("pistolOption").classList.remove("selectedWeapon")
    document.getElementById("ak47Option").classList.remove("selectedWeapon")
    document.getElementById("rlOption").classList.remove("selectedWeapon")
    document.getElementById("armyOption").classList.remove("selectedWeapon")
    document.getElementById("tankOption").classList.remove("selectedWeapon")
    document.getElementById("jetOption").classList.remove("selectedWeapon")
    document.getElementById("nukeOption").classList.remove("selectedWeapon")
}
function useKnife(params) {
    if (g("knifeOption").innerHTML.includes("knife")) {
        currentDMG = knifeDamage
    } else {
        currentDMG = amongUsDamage
    }
    
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
    if (localStorage.getItem('coins') != null) {
        coins = +localStorage.getItem('coins');
        document.getElementById("coinCount").innerHTML=coins    
    } else {
        document.getElementById("coinCount").innerHTML=coins  
    }
    
    if (localStorage.getItem('pistolCount') == null) {
        // this block means pistolCount was not saved before
    } else {
        pistolCount = localStorage.getItem('pistolCount');
        document.getElementById("pistolCount").innerHTML=pistolCount     
    }
    
    if (localStorage.getItem("ak47Count") != null) {
        ak47Count = localStorage.getItem('ak47Count');
        document.getElementById("ak47Count").innerHTML=ak47Count  
    }

    if (localStorage.getItem("rlCount") != null) {
        rlCount = localStorage.getItem('rlCount');
        document.getElementById("rlCount").innerHTML=rlCount  
    }

    if (localStorage.getItem("armyCount") != null) {
        armyCount = localStorage.getItem('armyCount');
        document.getElementById("armyCount").innerHTML=armyCount  
    }

     if (localStorage.getItem("tankCount") != null) {
        tankCount = localStorage.getItem('tankCount');
        document.getElementById("tankCount").innerHTML=tankCount  
    
     }

     if (localStorage.getItem("tankCount") != null) {
        jetCount = localStorage.getItem('jetCount');
        document.getElementById("jetCount").innerHTML=jetCount
     }

     if (localStorage.getItem("nukeCount") != null) {
        nukeCount = localStorage.getItem('nukeCount');
        document.getElementById("nukeCount").innerHTML=nukeCount
     }

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
                    if (g("knifeOption").innerHTML.includes("knife")) {
                        currentDMG = knifeDamage                        
                    } else {
                        currentDMG = amongUsDamage
                    }
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

            imgCriminal.style.transition = "all 2s"

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
            },3000); 
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
    let n = genInt(19)
    console.log(`n is ${n}`);
    
    switch (n) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
            return "./images/pet_Dog.webp"
            break;
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            return "./images/pet_Cat.png"
            break;
        case 10:
        case 11:
        case 12:
            return "./images/pet_Neon_Cat.webp"
            break;
        case 13:
        case 14:
        case 15:
            return "./images/pet_Neon_Dog.webp"
            break;
        case 16:
            return "./images/pet_Diamond_Cat.webp"
            break;
        case 17:
            return "./images/pet_Diamond_Dog.webp"
            break;
        case 18:
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
        g("centerEgg").src = "./images/eggNormal.png" 
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
    if (clickedCount == 4) {
        petImage = selectRandomPet()
        if (hasPet1 == false) {
            hasPet1 = true
            document.getElementById("centerEgg").src = petImage 
            setTimeout(() => {
                document.getElementById("centerEgg").style.display = "none"
                clickedCount = 0
                g("slot1").style.backgroundImage = `url(${petImage})`
                g("screenPet").style.display = "block"
                g("screenPet").src=petImage
                if(isScreenPetMoving == false) {
                    moveScreenPet()
                }
                
            }, 2000);
        } else {
            // show compare board
            g("comparePetBoard").style.display = "block"
            //old pet
            console.log(g("slot1").style.backgroundImage);
            let oldDesc = ""
            if (g("slot1").style.backgroundImage.includes("pet_Cat")) {
                oldDesc = "attack: 5 <br> attack speed: 4s <br> ability: none"
            } else if (g("slot1").style.backgroundImage.includes("pet_Dog")) {
                oldDesc = "attack: 4 <br> attack speed: 3.8s <br> ability: none"
            } else if (g("slot1").style.backgroundImage.includes("pet_Neon_Cat")) {
                oldDesc = "attack: 7 <br> attack speed: 3s <br> ability: none"
            } else if (g("slot1").style.backgroundImage.includes("pet_Neon_Dog")) {
                oldDesc = "attack: 6 <br> attack speed: 3s <br> ability: none"
            } else if (g("slot1").style.backgroundImage.includes("pet_Diamond_Dog")) {
                oldDesc = "attack: 15 <br> attack speed: 2s <br> ability: diamond shards <br> 20 damage <br> ability happens every 10 hits"
            } else if (g("slot1").style.backgroundImage.includes("pet_Diamond_Cat")) {
                oldDesc = "attack: 10 <br> attack speed: 1s <br> ability: diamond shards <br> 20 damage <br> ability happens every 10 hits"
            } else if (g("slot1").style.backgroundImage.includes("pet_Crystal_Deer")) {
                oldDesc = "attack: 10 <br> attack speed: 2s <br> ability: diamond shards <br> 15 damage <br> ability happens every 7 hits"
            } else if (g("slot1").style.backgroundImage.includes("pet_Angel_Cat")) {
                oldDesc = "This is description for pet_Angel_Cat"
            } else if (g("slot1").style.backgroundImage.includes("pet_Angel_Dog")) {
                oldDesc = "This is description for pet_Angel_Dog"
            } else if (g("slot1").style.backgroundImage.includes("pet_King_Cat")) {
                oldDesc = "This is description for pet_King_Cat"
            } else if (g("slot1").style.backgroundImage.includes("pet_Atomic_Corgi")) {
                oldDesc = "This is description for pet_Atomic_Corgi"
            } else if (g("slot1").style.backgroundImage.includes("pet_Doge")) {
                oldDesc = "This is description for pet_Doge"
            } 
                
            g("oldPetDesc").innerHTML = oldDesc
            //new pet
            console.log(petImage);
            let newDesc = ""
            if (petImage.includes("pet_Cat")) {
                newDesc = "attack: 5 <br> attack speed: 4s <br> ability: none"
            } else if (petImage.includes("pet_Dog")) {
                newDesc = "attack: 4 <br> attack speed: 3.8s <br> ability: none"
            } else if (petImage.includes("pet_Neon_Cat")) {
                newDesc = "attack: 7 <br> attack speed: 3s <br> ability: none"
            } else if (petImage.includes("pet_Neon_Dog")) {
                newDesc = "attack: 6 <br> attack speed: 3s <br> ability: none"
            } else if (petImage.includes("pet_Diamond_Dog")) {
                newDesc = "attack: 15 <br> attack speed: 2s <br> ability: diamond shards <br> 20 damage <br> happens every 10 hits"
            } else if (petImage.includes("pet_Diamond_Cat")) {
                newDesc = "attack: 10 <br> attack speed: 1s <br> ability: diamond shards <br> 20 damage <br> ability happens every 10 hits"
            } else if (petImage.includes("pet_Crystal_Deer")) {
                newDesc = "attack: 10 <br> attack speed: 2s <br> ability: diamond shards <br> 15 damage <br> ability happens every 7 hits"
            } else if (petImage.includes("pet_Angel_Cat")) {
                newDesc = "attack: 5 <br> attack speed: 1s"
            } else if (petImage.includes("pet_Angel_Dog")) {
                newDesc = "attack: 5 <br> attack speed: 1s"
            } else if (petImage.includes("pet_King_Cat")) {
                newDesc = "This is description for pet_King_Cat"
            } else if (petImage.includes("pet_Atomic_Corgi")) {
                newDesc = "attack: 5 <br> attack speed: 1s"
            } else if (petImage.includes("pet_Doge")) {
                newDesc = "attack: 5 <br> attack speed: 1s"
            } 
            
            g("newPetDesc").innerHTML = newDesc

            
            
        }
        

    }
    zoomIn()
    setTimeout(() => {
        zoomOut()
    }, 100);
}

function moveScreenPet(params) {
    isScreenPetMoving = true
    setTimeout(() => {
        g("screenPet").style.left=Math.random()*900+"px";
        g("screenPet").style.top=Math.random()*600+"px";
        
        currentCriminalHealth -= 2
        console.log(currentCriminalHealth);
        
        moveScreenPet()
    }, genInt(2000));
    
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
function keep(params) {
    g("comparePetBoard").style.display = "none"
    g("centerEgg").style.display = "none"
    clickedCount = 0
}
function select(params) {
    g("comparePetBoard").style.display = "none"
    g("centerEgg").src = petImage 
    setTimeout(() => {
        document.getElementById("centerEgg").style.display = "none"
        clickedCount = 0
        g("slot1").style.backgroundImage = `url(${petImage})`
        g("screenPet").style.display = "block"
        g("screenPet").src=petImage
        if(isScreenPetMoving == false) {
            moveScreenPet()
        }
        
    }, 2000);
}


function togglePistolInfo(shouldShow, whoCallsMe) {
    if (shouldShow == true) {
            document.getElementById("weaponInfo").style.display = "block"
    }else{
        document.getElementById("weaponInfo").style.display = "none"
    }

    if(whoCallsMe == 0) {
        //pistol's info icon calls me
        document.getElementById("weaponInfo").innerHTML = "DMG: 10 <br>x5 bundle "
        document.getElementById("weaponInfo").style.top = "90px"
                document.getElementById("weaponInfo").style.left = "60px"
    } else if(whoCallsMe == 1) {
        // push top to lower position
        document.getElementById("weaponInfo").style.top = "120px"
        document.getElementById("weaponInfo").style.left = "57px"

        //change content 
        document.getElementById("weaponInfo").innerHTML = "DMG: 50 <br>x5 bundle "
    }else if (whoCallsMe == 2) {
        // push top to lower position
        document.getElementById("weaponInfo").style.top = "150px"
        document.getElementById("weaponInfo").style.left = "13px"

        //change content 
        document.getElementById("weaponInfo").innerHTML = "DMG: 50 <br>x5 bundle "
    }else if (whoCallsMe == 3) {
        // push top to lower position
        document.getElementById("weaponInfo").style.top = "180px"
        document.getElementById("weaponInfo").style.left = "48px"

        //change content 
        document.getElementById("weaponInfo").innerHTML = "DMG: 200 <br>x5 bundle "
    }else if (whoCallsMe == 4) {
        // push top to lower position
        document.getElementById("weaponInfo").style.top = "210px"
        document.getElementById("weaponInfo").style.left = "45px"

        //change content 
        document.getElementById("weaponInfo").innerHTML = "DMG: 500 <br>x5 bundle "
    }else if (whoCallsMe == 5) {
        // push top to lower position
        document.getElementById("weaponInfo").style.top = "240px"
        document.getElementById("weaponInfo").style.left = "50px"

        //change content 
        document.getElementById("weaponInfo").innerHTML = "DMG: 1000 <br>x5 bundle "
    }else if (whoCallsMe == 6) {
        // push top to lower position
        document.getElementById("weaponInfo").style.top = "270px"
        document.getElementById("weaponInfo").style.left = "35px"

        //change content 
        document.getElementById("weaponInfo").innerHTML = "DMG: 100000 <br>x5 bundle "
    }
}

var isButton1Clicked = false
var isButton2Clicked = false
var isButton3Clicked = false
function secretButtonClick(whichButton) {
    // play ding
    const audio = new Audio("./sounds/ding.mp3");
    audio.play();
    if (whichButton == 1 ) {
        // change button to green   
        isButton1Clicked = true
        document.getElementById("b1").style.backgroundColor = "lightgreen"
    } else if (whichButton == 2) {
        // change button to green   
                isButton2Clicked = true
        document.getElementById("b2").style.backgroundColor = "lightgreen"
    } else if (whichButton == 3) {
        // change button to green   
                isButton3Clicked = true
        document.getElementById("b3").style.backgroundColor = "lightgreen"
    }
    if (isButton1Clicked == true && isButton2Clicked == true && isButton3Clicked == true) {
        g("amongUs").style.display = "block"
        for (let index = 1; index < 4; index++) {
            g(`b${index}`).style.display = "none"
            
        }
    }
}
function SAUW(params) {
    g("knifeOption").innerHTML = "among us x infinite <br>"
    currentDMG = amongUsDamage
    g("amongUs").style.display = "none"
}