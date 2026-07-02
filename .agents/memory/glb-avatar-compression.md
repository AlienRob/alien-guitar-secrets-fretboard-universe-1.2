---
name: GLB avatar compression
description: How big uploaded character .glb models are shrunk for bundling in the web app.
---

# Shrinking large uploaded GLB characters

The user uploads full-body character `.glb` models that are huge (35–62 MB each,
texture-heavy PBR exports). Bundling them raw is not viable for a cost-sensitive
web app.

**Recipe (per file, ~85–90% smaller, e.g. 42 MB → 5.7 MB):**

```
pnpm dlx @gltf-transform/cli@4.4.0 optimize IN.glb OUT.glb \
  --texture-compress webp --texture-size 1024 \
  --compress meshopt --simplify false
```

**Why these flags:**
- `meshopt` (not `draco`): drei's `useGLTF` auto-wires the meshopt decoder
  (bundled via three-stdlib) — no external CDN dependency. Draco's decoder
  defaults to the gstatic CDN, which we want to avoid. (Sizes: meshopt ~5.7 MB,
  draco ~3.3 MB, quantize ~20 MB, texture-only ~30 MB for the same source.)
- `--simplify false`: the `optimize` preset's mesh simplify can wreck skinned
  character meshes; geometry is cheap after meshopt, so leave polys intact.
- WebP @1024: three loads WebP textures natively; 1024 is plenty for an avatar.

**How to apply:** run per model, output to the artifact's `src/assets/...` so Vite
hashes and emits each as its own on-demand asset (an eager `import.meta.glob` over
`*.glb?url` only pulls URLs, not the binaries, into JS). Keep the raw uploads in
`attached_assets/` as the source of truth in case you need to re-export.
