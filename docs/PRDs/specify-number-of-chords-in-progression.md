# Specify Number of Chords Feature PRD

## Introduction

This feature allows users to specify how many chords to return in their requested chord progression.

## User Stories

- **US1:** *As a user, I want to specify how many chords I want to include in my progression*

## Acceptance Criteria

**For US1 (Specify number of chords):**

- The user can optionally specify at least 2, and up to 6 chords to be returned in the progression.
- THe server call will return a progression with the required nunber of chords, in the selected key.
- If no number is specified, return 4 chords.