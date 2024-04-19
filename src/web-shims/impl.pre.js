var Module = {
#if NODERAWFS
    // only for targeting NodeJS

    'preInit': () => {
        // temporary solution for inheriting system environ:
        //   https://github.com/emscripten-core/emscripten/pull/3948#issuecomment-744032264
        Object.assign(Module.ENV, process.env);
    },
#else
    // only for targeting browsers

    'noInitialRun': true,  // prevent calling main() on page load
    'instantiateWasm': (imps, cb) => {
        if (Module.mbb_get_wasm_name === undefined) {
            // library function not yet initialized, maybe later

            setTimeout(() => {
                Module['instantiateWasm'](imps, cb);
            }, 50);

            return;
        }

        const status_label = document.getElementById('status_label').childNodes[0];
        const status_show = document.getElementById('status_show');

        status_label.textContent = 'Fetching: ';
        status_show.textContent = '-- % (? / ?)';

        // fetch wasm

        const xhr = new XMLHttpRequest();

        xhr.open('GET', Module.mbb_get_wasm_name(), true);
        xhr.responseType = 'arraybuffer';
        xhr.onprogress = (ev) => {
            if (ev.lengthComputable) {
                const pct = Math.floor(100 * (ev.loaded / ev.total));
                status_show.textContent = `${pct} % (${ev.loaded} / ${ev.total})`;
            } else
                status_show.textContent = `-- % (${ev.loaded} / ?)`;
        };
        xhr.onload = async () => {
            var succeed = false;
            var wasm = null;

            if (xhr.status === 200) {
                status_label.textContent = 'Compiling: ';
                status_show.textContent = 'Take longer on slow devices';

                try {
                    wasm = await WebAssembly.instantiate(xhr.response, imps);
                    succeed = true;
                } catch (exc) {
                    status_label.textContent = 'WebAssembly Error: ';
                    status_show.textContent = exc.message;
                }
            } else {
                status_label.textContent = 'HTTP Error: ';
                status_show.textContent = xhr.statusText;
            }

            if (succeed)
                cb(wasm.instance);
            else
                Module.abort();  // or emscripten will wait forever
        };
        xhr.onerror = (_) => {
            status_label.textContent = 'Network Error';
            status_show.textContent = '';

            Module.abort();  // or emscripten will wait forever
        };
        xhr.onabort = (_) => {
            status_label.textContent = 'Network Error: ';
            status_show.textContent = 'Connection is aborted';

            Module.abort();  // or emscripten will wait forever
        };
        xhr.ontimeout = (_) => {
            status_label.textContent = 'Network Error: ';
            status_show.textContent = 'Request timeout';

            Module.abort();  // or emscripten will wait forever
        };
        xhr.send();

        return {};
    },
    'preInit': () => {
        // set a pretty argv[0]
        Module.mbb_set_this_prog(Module.mbb_get_wasm_name().split('.wasm')[0]);

        // bind stdout

        const conout = document.getElementById('conout');
        const _dec = new TextDecoder();
        Module.TTY.stream_ops.write = (_, buff, off, len) => {
            const arr = buff.subarray(off, off + len);
            conout.value += _dec.decode(arr);
            conout.scrollTop = conout.scrollHeight;

            return len;
        }

        // filesystem

        const cwd_show = document.getElementById('cwd_show');
        const fileop_panel = document.getElementById('fileop_panel');
        const dirent_tab = document.getElementById('dirent_tab');

        function mbb_do_cwd_disp() {
            cwd_show.textContent = Module.FS.cwd();
        }

        const cp_btn = document.getElementById('cp_btn');
        cp_btn.addEventListener('click', () => {
            const ent = dirent_tab.querySelector('.mbb_highlight');

            if (ent === null)
                return;

            const name = ent.textContent;
            var new_name = prompt("New name for the copied file:", name);

            if (new_name === null)
                return;

            new_name = new_name.trim();
            if (new_name.length === 0
                || new_name === name)
                return;

            const data = Module.FS.readFile(name);
            mbb_fs_err_ignored(() => {
                Module.FS.writeFile(new_name, data);
                mbb_do_dirent_disp();
            });
        });

        function mbb_do_dirent_disp() {
            fileop_panel.disabled = true;
            cp_btn.disabled = true;
            dirent_tab.innerHTML = '';  // remove old entries
            Module.FS.readdir('.').sort().forEach((ent) => {
                if (ent === '.')
                    return;  // hide current dir

                var ent_name = ent;

                const buf = Module.FS.lstat(ent);
                if (Module.FS.isDir(buf.mode)) {
                    ent_name = ent + '/';
                }

                dirent_tab.insertRow().insertCell().textContent = ent_name;
            });
        }

        dirent_tab.addEventListener('click', (ev) => {
            if (ev.target.tagName === 'TD') {
                ev.preventDefault();

                const prev_ent = dirent_tab.querySelector('.mbb_highlight');
                if (prev_ent !== null) {
                    if (prev_ent === ev.target) {
                        const name = ev.target.textContent;
                        const buf = Module.FS.lstat(name);

                        if (Module.FS.isDir(buf.mode)) {
                            Module.FS.chdir(name);
                            mbb_do_cwd_disp();
                            mbb_do_dirent_disp();
                        } else {
                            const data = Module.FS.readFile(name);
                            const blob = new Blob([data]);
                            const data_url = window.URL.createObjectURL(blob);

                            const dl_link = document.createElement('a');
                            dl_link.download = name;
                            dl_link.href = data_url;
                            dl_link.click();

                            setTimeout(() => {
                                window.URL.revokeObjectURL(data_url);
                            }, 0);
                        }

                        return;
                    }

                    prev_ent.classList.remove('mbb_highlight');
                }

                ev.target.classList.add('mbb_highlight');
                fileop_panel.disabled = false;

                const name = ev.target.textContent;
                const buf = Module.FS.lstat(name);

                if (Module.FS.isFile(buf.mode))
                    cp_btn.disabled = false;
            }
        });

        function mbb_fs_err_ignored(fn) {
            try {
                return fn();
            } catch (exc) {
                if (exc instanceof Module.FS.ErrnoError)
                    return;

                throw exc;
            }
        }

        const mkdir_btn = document.getElementById('mkdir_btn');
        mkdir_btn.addEventListener('click', () => {
            var name = prompt('Name for the new folder:');

            if (name === null)
                return;

            name = name.trim();
            if (name.length === 0)
                return;

            mbb_fs_err_ignored(() => {
                Module.FS.mkdir(name);
                mbb_do_dirent_disp();
            });
        });

        const imp_btn = document.getElementById('imp_btn');
        imp_btn.addEventListener('click', () => {
            const file_picker = document.createElement('input');
            file_picker.type = 'file';
            file_picker.onchange = (ev) => {
                const f = ev.target.files[0];

                const rder = new FileReader();
                rder.onload = (_) => {
                    var name = prompt('Name for the imported file:', f.name);

                    if (name === null)
                        return;

                    name = name.trim();
                    if (name.length === 0)
                        return;

                    const data = new Uint8Array(rder.result);

                    mbb_fs_err_ignored(() => {
                        Module.FS.writeFile(name, data);
                        mbb_do_dirent_disp();
                    });
                };
                rder.readAsArrayBuffer(f);
            };
            file_picker.click();
        });

        const rm_btn = document.getElementById('rm_btn');
        rm_btn.addEventListener('click', () => {
            const ent = dirent_tab.querySelector('.mbb_highlight');

            if (ent === null)
                return;

            const name = ent.textContent;
            const buf = FS.lstat(name);

            if (Module.FS.isDir(buf.mode))
                mbb_fs_err_ignored(() => {
                    try {
                        Module.FS.rmdir(name);
                    } catch (exc) {
                        if (exc instanceof Module.FS.ErrnoError
                            && exc.errno === 55) {  // ENOTEMPTY
                            alert('Directory is not empty');
                            return;
                        } else
                            throw exc;
                    }

                    mbb_do_dirent_disp();
                });
            else
                mbb_fs_err_ignored(() => {
                    Module.FS.unlink(name);
                    mbb_do_dirent_disp();
                });
        });

        const rename_btn = document.getElementById('rename_btn');
        rename_btn.addEventListener('click', () => {
            const ent = dirent_tab.querySelector('.mbb_highlight');

            if (ent === null)
                return;

            var name = ent.textContent;
            if (name.endsWith('/'))
                name = name.slice(0, -1);

            var new_name = prompt('New name for this entry:', name);

            if (new_name === null)
                return;

            new_name = new_name.trim();

            if (new_name.length === 0
                || new_name === name)
                return;

            mbb_fs_err_ignored(() => {
                Module.FS.rename(name, new_name);
                mbb_do_dirent_disp();
            });
        });

        // start up

        const scr_sel = document.getElementById('scr_sel');  // always show TTY screen on load
        window.location.href = '#scr_tty';

        const status_label = document.getElementById('status_label').childNodes[0];
        const status_show = document.getElementById('status_show');
        window.onerror = (_) => {
            status_show.textContent = 'Crashed';
        };

        const cmdline_edit = document.getElementById('cmdline_edit');
        var status_upd = null;
        Module.onRuntimeInitialized = () => {
#if ASYNCIFY
            // turn on Web exclusive hacks
            Module.mbb_enable_conio_hack();
#else
            alert('Asyncify is not enabled, real-time terminal output will not be available.\n\n' +
                  'See README for more details.');
#endif

            // set initial cwd to a nice place
            Module.FS.chdir('/home/web_user');
            mbb_do_cwd_disp();
            mbb_do_dirent_disp();

            // we can do stuffs now

            scr_sel.disabled = false;

            status_label.textContent = 'Status: ';
            status_show.textContent = 'Idle';

            cmdline_edit.readOnly = false;
        };

        // exec ctrl

        cmdline_edit.addEventListener('keydown', (ev) => {
            if (ev.key === "Enter") {
                if (cmdline_edit.readOnly)
                    return;  // not safe to call main() yet

                ev.preventDefault();

                if (status_upd !== null) {
                    clearTimeout(status_upd);
                    status_upd = null;
                }

                // handle quoted arguments

                var args = cmdline_edit.value.match(/'[^']+'|"[^"]+"|\S+/g);

                if (args === null)
                    args = [];

                args = args.map((m) => {
                    if ((m.startsWith('\'') && m.endsWith('\''))
                        || (m.startsWith('"') && m.endsWith('"')))
                        return m.substring(1, m.length - 1);
                    else
                        return m;
                });

                cmdline_edit.readOnly = true;
                scr_sel.disabled = true;

                cmdline_edit.value = '';
                conout.value = '';  // clear old output
                status_show.textContent = 'Running';

                Module.callMain(args);
            }
        });
        Module['mbb_main_cb'] = (ex) => {
            status_upd = setTimeout(() => {
                mbb_do_dirent_disp();
                status_show.textContent = `Exited (code ${ex})`;

                cmdline_edit.readOnly = false;
                scr_sel.disabled = false;
            }, 150);
        };

        // env vars

        const env_edit = document.getElementById('env_edit');
        const json = localStorage.getItem('mbb_environ');
        if (json !== null) {
            // restore saved environ

            const environ = JSON.parse(json);
            Object.keys(environ).forEach((k) => {
                const v = environ[k];

                Module.ENV[k] = v;  // pass to emscripten
                env_edit.value += `${k}=${v}\n`;
            });
            env_edit.scrollTop = env_edit.scrollHeight;
        }

        const clear_env_btn = document.getElementById('clear_env_btn');
        clear_env_btn.addEventListener('click', () => {
            env_edit.value = '';
        });

        const apply_env_btn = document.getElementById('apply_env_btn');
        apply_env_btn.addEventListener('click', () => {
            const new_environ = {};

            env_edit.value.split('\n').forEach((l) => {
                const l_ = l.trim();

                if (l_.length === 0)
                    return;  // empty line

                const sep = l_.indexOf('=');
                var k = null;
                var v = null;

                if (sep === -1) {
                    // key only, flag vars?
                    k = l_;
                    v = '';
                } else {
                    k = l_.slice(0, sep);
                    v = l_.slice(sep + 1)
                }

                new_environ[k] = v;
            });

            const new_json = JSON.stringify(new_environ);
            localStorage.setItem('mbb_environ', new_json);

            document.body.style.display = 'none';  // hide page when reloading

            // emscripten limitation:
            // setting ENV is only effective before runtime is initialized
            window.location.reload();
        });
    },
#endif
};
