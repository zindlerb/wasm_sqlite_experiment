importScripts('/out/simple-example/simple_file.js')
console.log('worker')

//console.log(this)
Module['onRuntimeInitialized'] = function() {
  const lstat_test = Module.cwrap('lstat_test', 'number', [])
  console.log('run')
  console.log('lstat_test()', lstat_test())
};

//WebAssembly.instantiate(Module);

/*

  fetch("/out/simple-example/simple_file.wasm").then(response =>
  response.arrayBuffer()
  ).then(bytes =>
  WebAssembly.compile(bytes)
  ).then(Module => {
  console.log(Module)
  const lstat_test = Module.cwrap('lstat_test', 'number', [])
  });
*/



//lstat_test()
