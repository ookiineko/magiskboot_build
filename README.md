## magiskboot_build

a simple CMake-based build system for magiskboot

### Requirements

magiskboot itself depends on the following libraries:

1. [LZMA][LZMA]
2. [lz4][lz4]
3. [bzip2][bzip]
4. [libfdt][libfdt]
5. [zlib][zlib]

for build-time dependencies:

1. [pkg-config][pkg-config]
2. [Clang][Clang]
3. [LLD][LLD]
4. [Rust][Rust] (nightly)
5. [Cargo][Cargo]
6. [cxxbridge][cxx-rs]
7. [CMake][CMake]

for Linux systems, please install [libbsd][libbsd] as well

please ensure you have installed the above softwares before building

there are examples for some popular operating systems/distributions:

#### Ubuntu 22.04 (jammy)

install nightly Rust via [rustup][rustup] first

````shell
cargo install --version 1.0.92 cxxbridge-cmd
sudo apt update
sudo apt upgrade  # upgrade all existing packages (optional)
sudo apt install build-essentials lzma-dev liblzma-dev liblz4-dev libbz2-dev libfdt-dev \
                 zlib1g-dev pkgconf clang-15 lld-15 cmake ninja-build libbsd-dev
mkdir ~/.bin
ln -s `which clang-15` ~/.bin/clang
ln -s `which clang++-15` ~/.bin/clang++
ln -s `which lld-15` ~/.bin/lld
export PATH=~/.bin:$PATH
````

#### Alpine Linux (edge)

install nightly Rust via [rustup][rustup] (can be installed with `apk`) first

````shell
cargo install --version 1.0.92 cxxbridge-cmd
sudo apk update
sudo apk upgrade  # upgrade all existing packages (recommended)
sudo apk add build-base xz-dev lz4-dev bzip2-dev dtc-dev zlib-dev \
        pkgconf clang lld cmake samurai libbsd-dev
# for static builds also install these
sudo apk add xz-static lz4-static bzip2-static zlib-static libbsd-static
````

#### archlinux

install nightly Rust via [rustup][rustup] (can be installed with `pacman`) first

````shell
cargo install --version 1.0.92 cxxbridge-cmd
sudo pacman -Su  # sync and upgrade all existing packages
sudo pacman -S --needed base-dev xz lz4 bzip2 dtc zlib pkgconf clang lld cmake ninja libbsd
````

static build is not supported on this distribution

#### Termux

````shell
apt update
apt upgrade  # upgrade all existing packages (optional)
apt install tur-repo  # for nightly Rust package
apt install build-essentials liblzma liblz4 libbz2 dtc zlib pkg-config \
            clang lld rustc-nightly cmake ninja libbsd
cargo install --version 1.0.92 cxxbridge-cmd
````

### Build & Install

````shell
cmake -G Ninja -B build -DCMAKE_BUILD_TYPE=Release  # configure
cmake --build build -j $(nproc)  # build
./build/magiskboot  # running
# install to system (or to a directory specified by the `DESTDIR' environment variable)
sudo cmake --install install
````

to build a statically linked binary, pass `-DPREFER_STATIC_LINKING=ON` to `cmake` while configuring

### Generating source tarball

````shell
cmake -G Ninja -B build  # configure
cmake --build build -t package_source  # make a source package
````

you should be able to find your source package under the `build` folder

### Special thanks to

- [android-tools][android-tools] developers for many code and inspiration of this repository
- [Magisk][Magisk] developers for the magiskboot utility
- all other used projects' developers (mentioned in the [Requirements](#Requirements) section)

[pkg-config]: https://www.freedesktop.org/wiki/Software/pkg-config/
[LZMA]: https://tukaani.org/lzma/
[lz4]: https://lz4.github.io/lz4/
[bzip]: http://www.bzip.org/
[libfdt]: https://github.com/kernkonzept/libfdt.git
[zlib]: https://zlib.net/
[Clang]: https://clang.llvm.org/
[LLD]: https://lld.llvm.org/
[Rust]: https://www.rust-lang.org/
[Cargo]: https://doc.rust-lang.org/cargo/
[cxx-rs]: https://github.com/dtolnay/cxx.git
[CMake]: https://cmake.org/
[Magisk]: https://github.com/topjohnwu/Magisk.git
[android-tools]: https://github.com/nmeum/android-tools
[libbsd]: https://libbsd.freedesktop.org/
[rustup]: https://rustup.rs/
