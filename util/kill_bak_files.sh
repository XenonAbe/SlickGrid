#! /bin/bash

#
# remove all editor backup files from the project;
# this is used to clean up the collection and helps Sublime to deliver only useful results
# (it won't find hits in those pesky bak files any more!)
#

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null
cd ..

rm -v -- $( find . -type f -iname '*.bak' -o -iname '*~' )

popd                                                                                                    2> /dev/null  > /dev/null
