import { helper, testFunction, testVariable, updateVar } from './utils.js';

document.getElementById('title').textContent += ' — ' + helper();

function testMain() {
    document.getElementById('title').textContent += ' test from main';
}

// document.getElementById('title').onclick = testMain;
function sayHello() {
  updateVar(100);
  testFunction();
  
}

window.sayHello = sayHello;
window.ttt = testMain;
