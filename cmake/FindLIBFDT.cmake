#
# Try to find libfdt
# Once done this will define
#
#  LIBFDT_FOUND - system has libfdt
#  LIBFDT_INCLUDE_DIRS - the libfdt include directory
#  LIBFDT_LIBRARIES - Link these to use libfdt
#

find_path(LIBFDT_INCLUDE_DIR
  NAMES libfdt.h
  DOC "libfdt include directory")
mark_as_advanced(LIBFDT_INCLUDE_DIR)
find_library(LIBFDT_LIBRARY
  NAMES fdt libfdt
  DOC "libfdt library")
mark_as_advanced(LIBFDT_LIBRARY)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(LIBFDT
  REQUIRED_VARS LIBFDT_LIBRARY LIBFDT_INCLUDE_DIR)

if (LIBFDT_FOUND)
  set(LIBFDT_INCLUDE_DIRS "${LIBFDT_INCLUDE_DIR}")
  set(LIBFDT_LIBRARIES "${LIBFDT_LIBRARY}")
endif()
