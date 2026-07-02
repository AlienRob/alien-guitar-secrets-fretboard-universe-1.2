#!/usr/bin/env bash
set -e

EAS_BIN="/home/runner/workspace/.config/npm/node_global/bin/eas"
SRC="/home/runner/workspace"
BUILD_DIR="/tmp/ags-mobile-build"
EAS_TMP="/tmp/eas-build-tmp"

echo "==> Cleaning previous build dirs..."
rm -rf "$BUILD_DIR" "$EAS_TMP"
mkdir -p "$BUILD_DIR/artifacts" "$BUILD_DIR/lib"

echo "==> Copying source files (no node_modules)..."

# Workspace root config + lockfile
for f in package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json tsconfig.json eas.json .npmrc; do
  [ -f "$SRC/$f" ] && cp "$SRC/$f" "$BUILD_DIR/$f" || true
done

# ags-mobile source only
cp -r "$SRC/artifacts/ags-mobile" "$BUILD_DIR/artifacts/ags-mobile"
rm -rf "$BUILD_DIR/artifacts/ags-mobile/node_modules"

# api-client-react lib (only workspace dep)
cp -r "$SRC/lib/api-client-react" "$BUILD_DIR/lib/api-client-react"
rm -rf "$BUILD_DIR/lib/api-client-react/node_modules"

echo "==> Initialising git so EAS uses archive mode..."
cd "$BUILD_DIR"
git init -q
git config user.email "build@ags.local"
git config user.name "AGS Build"
git add -A
git commit -q -m "eas build"

echo "==> Symlinking node_modules (untracked — EAS resolves plugins but won't archive them)..."
ln -s "$SRC/node_modules"                        "$BUILD_DIR/node_modules"
ln -s "$SRC/artifacts/ags-mobile/node_modules"   "$BUILD_DIR/artifacts/ags-mobile/node_modules"
ln -s "$SRC/lib/api-client-react/node_modules"   "$BUILD_DIR/lib/api-client-react/node_modules" 2>/dev/null || true

echo "==> Running EAS from clean directory (~$(du -sh --exclude=node_modules "$BUILD_DIR" 2>/dev/null | head -1 | cut -f1) source)..."
cd "$BUILD_DIR/artifacts/ags-mobile"
mkdir -p "$EAS_TMP"
TMPDIR="$EAS_TMP" "$EAS_BIN" "$@"
