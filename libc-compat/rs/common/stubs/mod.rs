#[cfg(not(any(target_os = "android", target_os = "cygwin")))]
mod errno;

#[cfg(not(any(target_os = "android", target_os = "cygwin")))]
pub use errno::*;

#[cfg(any(target_vendor = "apple", target_os = "windows"))]
mod fcntl;

#[cfg(any(target_vendor = "apple", target_os = "windows"))]
pub use fcntl::*;

#[cfg(any(target_os = "cygwin", target_vendor = "apple"))]
mod lfs64;

#[cfg(any(target_os = "cygwin", target_vendor = "apple"))]
pub use lfs64::*;

#[cfg(any(target_os = "cygwin", target_vendor = "apple",
          target_os = "emscripten", target_os = "windows"))]
mod sc_num;

#[cfg(any(target_os = "cygwin", target_vendor = "apple",
          target_os = "emscripten", target_os = "windows"))]
pub use sc_num::*;

#[cfg(any(target_os = "cygwin", target_os = "emscripten",
          target_os = "windows"))]
mod sendfile;

#[cfg(any(target_os = "cygwin", target_os = "emscripten",
          target_os = "windows"))]
pub use sendfile::*;
