#!/bin/sh

echo "{"
FIRST=1
env | while IFS='=' read -r n v; do if [ "${FIRST}" ] ; then FIRST= ; else echo "," ; fi ; printf "\"%s\": \"%s\"" "$n" "$v"; done
echo "}"
