#!/bin/bash
# Simple build that just copies source files
mkdir -p dist
cp -r src/* dist/
echo "Build complete - files copied to dist/"
