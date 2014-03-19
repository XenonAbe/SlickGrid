#! /bin/bash
#
#

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null

cd ..




function set_git_origin {
    base=$(pwd)
    echo git remote set-url origin $1
    git remote set-url origin $1
    for f in $( git submodule foreach --recursive --quiet pwd ) ; do
        pushd $f                                                                                            2> /dev/null  > /dev/null
        echo git remote set-url origin $(echo $basedir/$(echo $f | sed -e s#$base##) | sed s#//#/#g)
        git remote set-url origin $(echo $basedir/$(echo $f | sed -e s#$base##) | sed s#//#/#g)
        popd                                                                                                2> /dev/null  > /dev/null
    done
}





getopts ":h" opt
case "$opt$OPTARG" in
"?" )
  echo "--- set origin of each git repo in this directory tree to point to VM host path ---"
  for (( i=OPTIND; i > 1; i-- )) do
    shift
  done

  # pick up basedir of the VM host from argv[1]:
  if test -z $1; then
    basedir=/media/sf_D_DRIVE/h/prj/1original/SlickGrid/SlickGrid
  elif ! test -d $1; then
    basedir=/media/sf_D_DRIVE/h/prj/1original/SlickGrid/SlickGrid
  else
    basedir=$1
  fi
  set_git_origin $basedir
  ;;

* )
  cat <<EOT
$0 [-h] [VM_host_path]

set origin of each git repo in this directory tree to point to VM host path.

The default VM_host_path is
  /media/sf_D_DRIVE/h/prj/1original/SlickGrid/SlickGrid

-h:  print this on-line help text

EOT
  ;;
esac

popd                                                                                                    2> /dev/null  > /dev/null


