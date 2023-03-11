cmake_minimum_required(VERSION 3.22)
set(CMAKE_C_COMPILER "clang")
set(CMAKE_CXX_COMPILER "clang++")
project(magiskboot_build)
enable_language(C CXX)
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_EXTENSIONS ON)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_EXTENSIONS ON)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/cmake ${CMAKE_MODULE_PATH})
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fuse-ld=lld -Wno-unused-command-line-argument")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fuse-ld=lld -Wno-unused-command-line-argument")
set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -s -fomit-frame-pointer -flto -fdata-sections -ffunction-sections -Wl,--gc-sections")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -s -fomit-frame-pointer -flto -fdata-sections -ffunction-sections -Wl,--gc-sections")
set(CMAKE_C_FLAGS_MINSIZEREL "${CMAKE_C_FLAGS_RELEASE}")
set(CMAKE_CXX_FLAGS_MINSIZEREL "${CMAKE_CXX_FLAGS_RELEASE}")
if(APPLE)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -D_DARWIN_C_SOURCE -D__DARWIN_C_LEVEL=__DARWIN_C_FULL")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -D_DARWIN_C_SOURCE -D__DARWIN_C_LEVEL=__DARWIN_C_FULL")
endif()

# Option to enable or disable patching vendor projects using patches directory.
# This helps to build vendor projects with or without any patching. Also if any
# files are changed in vendor projects those can be retained with this option.
option(PATCH_VENDOR_PROJECTS "Patch vendor projects using patches directory" ON)

# Option to enable or disable building static linked version of magiskboot.
# If enabled, the build result will be a standalone binary which you can run
# on any device with the same operating system and architecture.
# This requires installing depended static libraries on the host.
option(PREFER_STATIC_LINKING "Prefer static libraries when linking" OFF)

include(CMakeLists.android.txt)
include(CMakeLists.magisk.txt)

set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)
find_package(PkgConfig REQUIRED)
find_package(LibLZMA REQUIRED)
pkg_check_modules(zlib REQUIRED IMPORTED_TARGET zlib)
pkg_check_modules(libbsd REQUIRED IMPORTED_TARGET libbsd)

if (PREFER_STATIC_LINKING)
    set(LIBLZMA_NAME lzma)
    set(LIBLZ4_NAME liblz4)
    set(LIBBZ2_NAME libbz2)
    set(LIBFDT_NAME libfdt)
    set(LIBZ_NAME z)
    set(LIBBSD_NAME bsd md)
    set(PTHREAD_NAME pthread)
    set(EXTRA_LINKER_FLAGS dl -static)
else()
    find_package(BZip2 REQUIRED)
    pkg_check_modules(liblz4 REQUIRED IMPORTED_TARGET liblz4)
    find_package(LIBFDT REQUIRED)

    set(LIBLZMA_NAME ${LIBLZMA_LIBRARIES})
    set(LIBLZ4_NAME PkgConfig::liblz4)
    set(LIBBZ2_NAME ${BZIP2_LIBRARIES})
    set(LIBFDT_NAME ${LIBFDT_LIBRARIES})
    set(LIBZ_NAME PkgConfig::zlib)
    set(LIBBSD_NAME PkgConfig::libbsd)
    set(PTHREAD_NAME Threads::Threads)
    set(EXTRA_LINKER_FLAGS "")
endif()

add_compile_options(-Wall)

include(CMakeLists.rust.txt)
include(CMakeLists.magiskboot.txt)
include(CMakeLists.lib.txt)
include(CMakeLists.patch.txt)

# CPack configuration for creating source tarballs which already include
# patched versions of the vendored dependencies.
set(CPACK_SOURCE_GENERATOR "TXZ")
set(CPACK_SOURCE_PACKAGE_FILE_NAME "magiskboot_${MAGISK_VERSION}_${MAGISK_VER_CODE}-src")
set(CPACK_SOURCE_IGNORE_FILES "/patches/" "/build/" "/.git/" "/vendor/Magisk/app/"
    "/vendor/Magisk/buildSrc/" "/vendor/Magisk/docs/" "/vendor/Magisk/gradle/"
    "/vendor/Magisk/scripts/" "/vendor/Magisk/stub/" "/vendor/Magisk/tools/"
    "/vendor/Magisk/native/src/external/busybox/" "/vendor/Magisk/native/src/external/cxx-rs/"
    "/vendor/Magisk/native/src/external/libcxx/" "/vendor/Magisk/native/src/external/lsplt/"
    "/vendor/Magisk/native/src/external/nanopb/" "/vendor/Magisk/native/src/external/parallel-hashmap/"
    "/vendor/Magisk/native/src/external/pcre/" "/vendor/Magisk/native/src/external/selinux/"
    "/vendor/Magisk/native/src/external/systemproperties/" "/vendor/Magisk/native/src/external/xz/"
    "/vendor/Magisk/native/src/external/xz-embedded/" "/vendor/Magisk/native/src/external/xz_config/"
    "/vendor/Magisk/native/src/external/zlib/" "/vendor/Magisk/native/src/resetprop/"
    "/vendor/Magisk/native/src/su/" "/vendor/Magisk/native/src/zygisk/"
    "\\\\.so$" "\\\\.zip$" "\\\\.orig" "\\\\.rej"
    "\\\\.tar$" "\\\\.tar\\\\..*$" "\\\\.tgz$"
    "\\\\.data$" "aes_128_gcm.txt" "aes_256_gcm.txt")
include(CPack)
