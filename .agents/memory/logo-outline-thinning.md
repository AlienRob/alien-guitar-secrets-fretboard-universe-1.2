---
name: Recoloring outline-style logo PNGs
description: Why a tinted "outline" wordmark vanishes on busy backgrounds, and how to make it read.
---

When recoloring an *outline*-style logo/wordmark PNG (thin glyph strokes, hollow
interiors) by masking with its alpha and downscaling, the strokes collapse:
heavy downscale (e.g. 5390px -> 1500px) averages a ~1px opaque stroke with its
transparent neighbours, dropping peak alpha well below 255 (saw 137) and covering
only ~4% of pixels. Result: a faint, near-invisible mark on a busy/dark scene,
even though it looks fine on the white preview swatch.

**Why:** thin antialiased strokes don't survive aggressive resampling; alpha is
peak-limited by the averaging, not just feathered.

**How to apply:** thicken before downscaling (PIL `ImageFilter.MaxFilter(13-15)`
on the alpha), render at higher target width (~1900px), resample LANCZOS, then
push alpha back to full opacity with a point op (`p -> 255 if p>40 else p*2.4`).
Add a dark CSS `drop-shadow` (not just a gold glow) so gold reads against the
busy hall. Verify with the alpha extrema, not the white-bg preview.
