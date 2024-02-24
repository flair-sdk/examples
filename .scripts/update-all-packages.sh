#!/bin/bash

for d in */ ; do
  echo "Updating packages in $d"
  (cd $d && pnpm update flair-sdk flair-cli)
done
