#!/bin/bash

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null

# go to root of project
cd ..

webdir=$( pwd )

if test -n "$1" -a ! -f "$1" ; then
  dstdir="$1"
else
  dstdir=$webdir
fi

if test -z "$2" ; then
  depth=1
else
  depth=$2
fi


cat <<EOT

    Correct all X bits (and possibly some other stuff that might've been nuked by a windows system doing the release prep)


EOT


# RESET all X bits first
# -executable requires GNU find; bloody Mac OSX of course runs a BSD flavor
chmod a-x  $( find . -maxdepth $depth -type f -executable )
chmod a-x  $( find . -maxdepth $depth -type f -perm +u+x )
chmod a-x  $( find . -maxdepth $depth -type f -perm +g+x )
chmod a-x  $( find . -maxdepth $depth -type f -perm +o+x )

# now only set the X bits for those that should have it
chmod a+x  $( find . -type f -name '*.sh' )
chmod a+x  $( find . -type f -name '*.jar' )
chmod a+x  $( find . -type f  -name 'wsclean' -o -name 'mvn' -o -name 'ant' )




popd                                                                                                    2> /dev/null  > /dev/null

