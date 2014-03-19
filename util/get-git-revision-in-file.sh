#!/bin/bash
#
# dump the current git revision commit hash, etc. in a file for use by the software
#

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null

# go to root of project
cd ..




rm -f HEAD.HASH
gitbranch=$( git rev-parse --abbrev-ref HEAD )
commithash=$( git rev-parse --short HEAD )

# write as JSON file:
cat > HEAD.HASH <<EOT
{
    "git_branch": "$gitbranch",
    "commit_hash": "$commithash"
}
EOT






popd                                                                                                    2> /dev/null  > /dev/null

