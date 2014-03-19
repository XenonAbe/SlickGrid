#! /bin/bash
#
# checkout all submodules to their desired 'HEAD' bleeding edge revision: MASTER for most.
#

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null

cd ..



getopts ":Fhl" opt
#echo opt+arg = "$opt$OPTARG"
case "$opt$OPTARG" in
"F" )
  echo "--- checkout to branch or master with RESET + FORCE ---"
  mode="F"
  for (( i=OPTIND; i > 1; i-- )) do
    shift
  done
  #echo args: $@
  ;;

"h" )
  mode="?"
  cat <<EOT
$0 [-F] [-l]

checkout git submodules to the preconfigured branch (master / other).

-F       : apply 'git reset --hard' and 'git checkout --force' to each submodule

-l       : list the submodules which will be checked out to a non-'master' branch

EOT
  exit
  ;;

"l" )
  mode="?"
  cat <<EOT

These submodules have been preconfigured to checkout to non-master branches:

EOT
  ;;

* )
  echo "--- checkout git submodules to master / branch ---"
  mode="R"
  ;;
esac




#git submodule foreach --recursive git checkout master
#
# instead, use the shell to loop through the submodules so we can give any checkout errors the birdy!
if test "$mode" != "?" ; then
    for f in $( git submodule foreach --recursive --quiet pwd ) ; do
        pushd $f                                                                                            2> /dev/null  > /dev/null
        case "$mode" in
F )
            echo "submodule: $f (master, FORCED)"
            git reset --hard
            git checkout master --force
            git reset --hard
      ;;

"?" )
            ;;

R )
            echo "submodule: $f (master)"
            git checkout master
            ;;
        esac
        popd                                                                                                2> /dev/null  > /dev/null
    done
fi

# args: lib localname remote
function checkout_branch {
    pushd $1                                                                                                2> /dev/null  > /dev/null
    case "$mode" in
F )
        echo "submodule: $1, branch: $2 (FORCED)"
        git branch --track $2 $3                                                                            2> /dev/null
        git reset --hard
        git checkout $2 $4 --force
        git reset --hard
  ;;

"?" )
        if test "$2" != "master"; then
            echo "submodule: $1"
            echo "                                         branch: $2"
        fi
        ;;

R )
        echo "submodule: $1, branch: $2"
        git branch --track $2 $3                                                                            2> /dev/null
        git checkout $2 $4
        ;;
    esac
    popd                                                                                                    2> /dev/null  > /dev/null
}

# checkout_branch css/lib/Font-Awesome                experimental origin/experimental                                        $@


popd                                                                                                    2> /dev/null  > /dev/null

