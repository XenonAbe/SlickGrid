#! /bin/bash
#

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null
cd ../examples



function munch_file {
  title=$( cat $1 | grep -e '<title>' | sed -e 's/^.*<title>//' -e 's/<\/title>.*$//' -e 's/^Slickgrid .*: *//i' )
  strippedtitle=$( echo $title | sed -e 's/ \t//' )
  if test -z "$strippedtitle" ; then 
    title="----- $3 -----"
  fi 
  printf "%-70s %s: %-70s%s\n" "      <li><a href=\"$3\">" $2 "$title" "</a></li>"  >> __html

  # and rename the file:
  if test "$1" != "./$3" ; then
    mv $1   $3
  fi
}

function process_one {
  n=$( printf "%04d" $2 )
  echo "processing $n: $1"
  for f in $( find ./ -iregex "\\./example[-0-9abc]*-$1\\.html" ) ; do
    echo "    file: $f"
    munch_file $f $n "example-$n-$1.html"
  done

  # strip the entry from the generic index:
  cat __dirlist | sed -e "s/^$1\$//" > __dirlist2
  cat __dirlist2 > __dirlist 
}


# collect the examples available in this directory; sort to gurantee a cross-platform fixed order
find . -name 'example*.html' | sort -t e -k 3 -d -n | sed -e 's/^\.\///' -e 's/\.html$//' -e 's/example[-0-9abc]*-//' | sort > __dirlist

# collect the names of the examples, in order of appearance in the existing index file:
if test -f index.html ; then
  grep -e '<li><a href="' index.html | sed -e 's/^.*href="//' -e 's/\.html".*$//' -e 's/example[-0-9abc]*-//' > __index
else
  echo > __index
fi


echo > __html

# http://tldp.org/LDP/abs/html/dblparens.html
(( i = 1 ));

# first chew through the ordered set, i.e. the set collected from the existing index file:
for f in $( cat __index ) ; do
  process_one $f $i
  (( i++ ));
done

# next, process the others which remain:
for f in $( cat __dirlist ) ; do
  process_one $f $i
  (( i++ ));
done


# finally we create a new index.html by stripping out the old one and injecting the new generated index snippet:
grep -B 999 -e '<!-- list start -->' index.html > __index_html__
cat __html >> __index_html__
grep -A 999 -e '<!-- list end -->' index.html >> __index_html__
cat __index_html__ > index.html

#clean up
rm __index_html__ __index __dirlist __dirlist2 __html

popd                                                                                                    2> /dev/null  > /dev/null
