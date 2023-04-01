#!/bin/bash


# unpack the SCOWL english words repo
tar -xzvf ./scowl-2020.12.07.tgz 


# extract the most common English and American English words, removing any overlap
cat ./scowl-2020.12.07/final/english-words.10 \
    ./scowl-2020.12.07/final/english-words.20 \
    ./scowl-2020.12.07/final/english-words.35 \
    ./scowl-2020.12.07/final/english-words.40 \
    ./scowl-2020.12.07/final/english-words.50 \
    ./scowl-2020.12.07/final/american-words.10 \
    ./scowl-2020.12.07/final/american-words.20 \
    ./scowl-2020.12.07/final/american-words.35 \
    ./scowl-2020.12.07/misc/profane.3 \
    ./scowl-2020.12.07/final/english-contractions.10 \
       | tr -d "\'" | sort -u > ./wordlist.txt


