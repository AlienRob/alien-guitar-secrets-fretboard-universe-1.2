#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Idempotent schema migrations — safe to run multiple times.
# Add new additive changes here as columns / constraints are introduced.
psql "$DATABASE_URL" -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS trail_flags jsonb DEFAULT '{\"findingNotesViewed\":false,\"intervalsViewed\":false,\"practiceStarted\":false,\"scaleLessonViewed\":false,\"chordLessonViewed\":false}'::jsonb;"
