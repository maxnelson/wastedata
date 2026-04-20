#!/usr/bin/env bash
# Download the latest processed core data from the wastedata-ca-data GitHub release.
# Run before `npm run build` or once after cloning: npm run sync:data
set -e

REPO="maxnelson/wastedata-ca-data"
TAG="${DATA_VERSION:-data-latest}"
TMP_DIR="/tmp/wastedata-sync"
DEST="$(cd "$(dirname "$0")/.." && pwd)/data/processed"

mkdir -p "$TMP_DIR" "$DEST/disposal"

echo "Downloading core data from $REPO @ $TAG ..."
curl -fsSL \
  "https://github.com/${REPO}/releases/download/${TAG}/core-data.tar.gz" \
  -o "$TMP_DIR/core-data.tar.gz"

tar -xzf "$TMP_DIR/core-data.tar.gz" -C "$TMP_DIR"

# Copy the extracted files into data/processed/
cp "$TMP_DIR/data/processed/jurisdictions.json" "$DEST/"
cp "$TMP_DIR/data/processed/by_jurisdiction.json" "$DEST/"
cp "$TMP_DIR/data/processed/population.json" "$DEST/"
cp "$TMP_DIR/data/processed/disposal/jurisdiction_county_map.json" "$DEST/disposal/"

rm -rf "$TMP_DIR"
echo "Core data synced to data/processed/"
