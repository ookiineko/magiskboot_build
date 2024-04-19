#if !NODERAWFS
// for Web only

// XXX: `mergeInto' is emsdk version dependent!
//      check emscripten source to adapt to other vers
mergeInto(LibraryManager.library, {
    // note:
    //   must use this full syntax to declare functions,
    //   otherwise emscripten will ignore them
    $mbb_get_wasm_name: function() {
        return wasmBinaryFile.split('/').pop();
    },

    $mbb_set_this_prog: function(this_prog) {
        thisProgram = this_prog;
    },
});
#endif
