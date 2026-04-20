export function helper() {
  return 'From utils.js';
}

//add a variable to test hot reload
export var testVariable = 0;

//add a function to test hot reload
export function testFunction() {
  console.log('This is a test function', testVariable  ); 
}

export function updateVar(newValue) {
  testVariable = newValue;
}