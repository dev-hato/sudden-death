#!/usr/bin/env bash
set -e

npm ci
mv node_modules/ ../
