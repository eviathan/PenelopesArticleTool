#!/bin/bash
echo "--------------------------------------------------------------------"
echo "--------------------------------------------------------------------"
echo 
echo "                        ~Get Penelopes Work!~                       "
echo 
echo "--------------------------------------------------------------------"
echo
echo "                           ~Getting Images~                         "
echo "   (╯°Д°)╯ ┻━┻ "
echo "--------------------------------------------------------------------"

cat sites.txt | xargs -n1 webkit2png -W 1600 -F -D images/

echo "--------------------------------------------------------------------"
echo "                            ~Getting Text~                          "
echo "	                                    C= C= C= C= C=┌(;・ω・)┘      "
echo "--------------------------------------------------------------------"

mkdir -p webPages
cd webPages
cat ../sites.txt | xargs -n1 wget -E -k -p 

echo "--------------------------------------------------------------------"
echo "                             ~Sanitising~                           "
echo "	   (＃￣□￣)o━∈・・━━━━☆               (⊃｡•́‿•̀｡)⊃━✿✿✿✿✿✿	            "
echo "--------------------------------------------------------------------"
echo "Beginning sanitisation ..."

find . -name '*.html' | xargs -n1 sed -i.old.html '/<script.*<\/script>/d'
#find . -name '*.html.old' | xargs -n1 rm
echo "Sanitisation Complete!"
echo "--------------------------------------------------------------------"