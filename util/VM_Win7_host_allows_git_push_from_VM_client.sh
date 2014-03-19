#! /bin/bash
#
#

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null

cd ..

git config receive.denyCurrentBranch warn
for f in $( git submodule foreach --recursive --quiet pwd ) ; do
    pushd $f                                                                                            2> /dev/null  > /dev/null
    git config receive.denyCurrentBranch warn
    popd                                                                                                2> /dev/null  > /dev/null
done

popd                                                                                                    2> /dev/null  > /dev/null
