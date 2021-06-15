#!/usr/bin/env bash
# find . -name *.html | xargs rm
# echo "Warning: all old HTML files at have been deleted!"
jade -P --watch .
