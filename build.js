#!/usr/bin/node
const { exec } = require("child_process");
const buildType = process.argv[2]

process.on('unhandledRejection', error => {
  console.log('\n\n')
  console.error(error)
  process.exit(1);
});

function runShellCommand (cmd) {
  return new Promise((resolve, reject) => {
    console.log(`${cmd}`)
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(error.message))
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        resolve();
        return;
      }

      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      resolve();
    });
  })
}

async function buildLibraries () {
  if (!process.env.SKIP_LIBRARY_BUILD) {
    await runShellCommand(
      `emcc -O2 -Wall -pthread -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -I.. -c libs/sqlite3.c -o out/libs/sqlite3.o`
    )
    await runShellCommand(
      `emcc -O2 -Wall -pthread -I.. -c libs/pthreadfs.cpp -o out/libs/pthreadfs.o`
    )
  }
}

async function script (buildType) {
  console.log(`building: ${buildType}`)
  await runShellCommand('mkdir -p out/libs')

  if (buildType === 'speedtest') {
    await runShellCommand('mkdir -p out/speedtest')
    await buildLibraries()
    await runShellCommand(
      `emcc -O2 -Wall -pthread -c -Ilibs src/speedtest1.c -o out/speedtest/speedtest1.o`
    )
    await runShellCommand(
      `emcc -pthread -s PROXY_TO_PTHREAD -O2 -s INITIAL_MEMORY=134217728 -gsource-map --source-map-base http://localhost:8992/out/speedtest/ --js-library=libs/library_pthreadfs.js --pre-js=libs/sqlite-prejs.js out/speedtest/speedtest1.o out/libs/pthreadfs.o out/libs/sqlite3.o -o out/speedtest/index.html`
    )
  } else if (buildType === 'sqlite-wrapper') {
    await runShellCommand('mkdir -p out/sqlite-wrapper')

    if (!process.env.SKIP_LIBRARY_BUILD) {
      await runShellCommand('emcc -O2 -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_NORMALIZE -c libs/sqlite_js/sqlite3.c -o out/sqlite-wrapper/sqlite3.bc')
      await runShellCommand('emcc -O2 -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_NORMALIZE -c libs/sqlite_js/extension-functions.c -o out/sqlite-wrapper/extension-functions.bc')
    }

    await runShellCommand('emcc --memory-init-file 0 -s RESERVED_FUNCTION_POINTERS=64 -s ALLOW_TABLE_GROWTH=1 -s EXPORTED_FUNCTIONS=@libs/sqlite_js/exported_functions.json -s EXPORTED_RUNTIME_METHODS=@libs/sqlite_js/exported_runtime_methods.json -s SINGLE_FILE=0 -s NODEJS_CATCH_EXIT=0 -s NODEJS_CATCH_REJECTION=0 -s INLINING_LIMIT=50 -O3 -flto --closure 1 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 out/sqlite-wrapper/sqlite3.bc out/sqlite-wrapper/extension-functions.bc --pre-js src/sqlite_wrapper/wrapper.js -o out/sqlite-wrapper/sql-wasm.js')
    await runShellCommand('mv out/sqlite-wrapper/sql-wasm.js out/tmp-raw.js')
    await runShellCommand('cat libs/sqlite_js/shell-pre.js out/tmp-raw.js libs/sqlite_js/shell-post.js > out/sqlite-wrapper/sql-wasm.js')
    await runShellCommand('rm out/tmp-raw.js')

    /*

      dist/sql-wasm.js: $(BITCODE_FILES) $(OUTPUT_WRAPPER_FILES) $(SOURCE_API_FILES) $(EXPORTED_METHODS_JSON_FILES)
      $(EMCC) $(EMFLAGS) $(EMFLAGS_OPTIMIZED) $(EMFLAGS_WASM) $(BITCODE_FILES) $(EMFLAGS_PRE_JS_FILES) -o $@
      mv $@ out/tmp-raw.js
      cat src/shell-pre.js out/tmp-raw.js src/shell-post.js > $@
      rm out/tmp-raw.js

     */


    //sqlite.js: out/sqlite3.bc out/extension-functions.bc src/shell-pre.js src/shell-post.js src/api.js

    // BITCODE_FILES = out/sqlite3.bc out/extension-functions.bc
    // OUTPUT_WRAPPER_FILES = src/shell-pre.js src/shell-post.js
    // SOURCE_API_FILES = src/api.js
    // EXPORTED_METHODS_JSON_FILES = src/exported_functions.json src/exported_runtime_methods.json

    /* EMFLAGS = --memory-init-file 0 \
      -s RESERVED_FUNCTION_POINTERS=64 \
      -s ALLOW_TABLE_GROWTH=1 \
      -s EXPORTED_FUNCTIONS=@src/exported_functions.json \
      -s EXPORTED_RUNTIME_METHODS=@src/exported_runtime_methods.json \
      -s SINGLE_FILE=0 \
      -s NODEJS_CATCH_EXIT=0 \
      -s NODEJS_CATCH_REJECTION=0 */
    /*
      EMFLAGS_OPTIMIZED= \
      -s INLINING_LIMIT=50 \
      -O3 \
      -flto \
      --closure 1
    */
    /*
      EMFLAGS_WASM = \
      -s WASM=1 \
      -s ALLOW_MEMORY_GROWTH=1
    */

    /*
      EMFLAGS_PRE_JS_FILES = \
      --pre-js src/api.js
     */
  } else {
    throw new Error(`Invalid build type ${buildType}`)
  }
}

script(buildType)
