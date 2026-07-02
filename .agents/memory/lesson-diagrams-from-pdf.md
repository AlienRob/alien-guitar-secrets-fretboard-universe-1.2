---
name: Lesson diagrams from Rob's PDFs
description: How to faithfully reuse the user's own lesson diagrams from the attached source PDFs.
---

# Sourcing lesson diagrams

The AGS teaching lessons are sourced from Rob's PDFs in `attached_assets/`
(e.g. `Lesson_1.1_Finding_Octaves...pdf`). The user wants their *own* diagrams
used, not hand-drawn or app-rendered approximations.

**Recipe:** render the figure page with `pdftoppm -png -r 130 -f N -l N <pdf> out`,
then crop the figure with ImageMagick `magick page.png -crop WxH+X+Y +repage`.

**Why render-then-crop, not `pdfimages`:** the arrows that show each formula's
movement are *vector overlays*, not part of the embedded raster image — extracting
the embedded image alone loses the arrows. The page render is the composited
result (grid + note dots + arrows + the "Formula N:" title), which is what the
user sees in their PDF.

**How to apply:** diagrams have light/white backgrounds, so frame them on a white
card (`bg-white`) in the lesson so they read on the dark cosmic theme. Drop the
crops in the artifact's `src/assets/lessons/` and `import` them in the page. Keep
the "© Alien Guitar Secrets" credit visible / note it in the lesson footer.
