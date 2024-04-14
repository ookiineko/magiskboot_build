if (typeof window !== 'undefined') {
    var Module = {
        'noInitialRun': true,  // prevent calling main() on page load
        'instantiateWasm': (imps, cb) => {
            var status_label = document.getElementById('status_label').childNodes[0];
            var status_show = document.getElementById('status_show');

            status_label.textContent = 'Fetching: ';
            status_show.textContent = '-- % (N/A)';

            // fetch wasm

            var xhr = new XMLHttpRequest();

            xhr.open('GET', '@MAGISKBOOT_WASM_NAME@.wasm', true);
            xhr.responseType = 'arraybuffer';
            xhr.onprogress = (ev) => {
                if (ev.lengthComputable) {
                    const pct = Math.floor(100 * (ev.loaded / ev.total));
                    status_show.textContent = `${pct} % (${ev.loaded} / ${ev.total})`;
                } else {
                    status_show.textContent = `-- % (${ev.loaded} / ?)`
                }
            };
            xhr.onload = async () => {
                var succeed = false;
                var wasm = null;

                if (xhr.status == 200) {
                    status_show.textContent = 'Take longer on slow devices';
                    status_label.textContent = 'Compiling: ';

                    try {
                        wasm = await WebAssembly.instantiate(xhr.response, imps);
                        succeed = true;
                    } catch (exc) {
                        status_show.textContent = exc.message;
                        status_label.textContent = 'WebAssembly Error: ';
                    }
                } else {
                    status_show.textContent = xhr.statusText;
                    status_label.textContent = 'Network Error: ';
                }

                xhr = null;

                if (succeed)
                    cb(wasm.instance);
            };
            xhr.send();

            return {};
        },
        'preInit': () => {
            // bind stdout

            const conout = document.getElementById('conout');
            const _dec = new TextDecoder();

            Module.TTY.stream_ops.write = (_, buff, off, len) => {
                const arr = buff.subarray(off, off + len);
                conout.value += _dec.decode(arr);
                conout.scrollTop = conout.scrollHeight;

                return len;
            }

            // exec ctrl

            const status_label = document.getElementById('status_label').childNodes[0];;
            const status_show = document.getElementById('status_show');
            window.onerror = (_) => {
                status_show.textContent = 'Crashed';
            };

            const cmdline_edit = document.getElementById('cmdline_edit');
            const clear_btn = document.getElementById('clear_btn');
            const exec_btn = document.getElementById('exec_btn');

            clear_btn.addEventListener('click', () => {
                status_show.textContent = 'Ready';
                conout.value = '';
            });
            Module.onRuntimeInitialized = () => {
                // we can call main() now
                status_show.textContent = 'Ready';
                status_label.textContent = 'Status: ';
                exec_btn.disabled = false;
            };
            exec_btn.addEventListener('click', () => {
                const args = cmdline_edit.value.split(/\s+/);  // ws seperated args
                conout.value += `\n### Arguments: ${cmdline_edit.value} ###\n\n`;
                cmdline_edit.value = '';

                status_show.textContent = 'Running';
                const ex = Module.callMain(args);
                status_show.textContent = `Exited (code ${ex})`;
            });
        },
    };
}