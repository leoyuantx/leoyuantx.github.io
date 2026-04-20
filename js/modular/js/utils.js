export function helper() {
  return '来自 utils';
}

//add a variable to test hot reload
export var testVariable = 0;

//add a function to test hot reload
export function testFunction() {
  console.log('这是一个测试函数', testVariable  ); 
}

export function updateVar(newValue) {
  testVariable = newValue;
}