#!/bin/bash


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
       | tr -d "\'" | sort  > ./wordlist.txt


