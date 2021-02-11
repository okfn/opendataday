#!/bin/bash

set -euo pipefail

pip install --upgrade pip
pip install -r requirements.txt
python ./etl/etl.py
git config user.name "opendataday[bot]"
git config user.email "actions@users.noreply.github.com"
git add -A
timestamp=$(date -u)
git commit -m "Update at ${timestamp}" || exit 0
git push
