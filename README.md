# Chord Progression MCP

A Model Context Protocol (MCP) server that generates MIDI files with chord progressions in any musical key.

## Overview

This MCP server provides a tool for generating classic I-IV-V-I chord progressions as MIDI files. It supports all major and minor keys, automatically determining the correct chord qualities based on the key signature.

## Features

- 🎹 Generate chord progressions in any major or minor key
- 🎵 Creates MIDI files with I-IV-V-I progression (classic chord progression)
- 🎼 Automatically handles chord qualities (major/minor) based on key signature
- 🔧 Supports all 12 chromatic keys with enharmonic equivalents
- 📦 Returns MIDI files as base64-encoded audio data

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## Usage

This is an MCP server that should be used with an MCP-compatible client. The server exposes a single tool:

### `get-chord-progression`

Generates a MIDI file with a I-IV-V-I chord progression for a given musical key.

**Parameters:**
- `key` (string): The musical key in the format `"C major"`, `"A minor"`, `"F# major"`, `"Bb minor"`, etc.

**Supported Key Formats:**
- `"C major"` or `"C"`
- `"A minor"` or `"A minor"` or `"Am"`
- `"F# major"` or `"F#"`
- `"Bb minor"` or `"Bb minor"` or `"Bbm"`
- Any combination of note name + major/minor indicator

**Returns:**
- A MIDI file (base64-encoded) containing the chord progression
- Metadata including the key and progression type

**Example:**
```javascript
// The tool can be called with keys like:
// - "C major"
// - "A minor"
// - "F# major"
// - "Bb minor"
// - "G"
// - "Am"
```

## How It Works

1. **Key Parsing**: The server parses the input key string to extract the root note and determine if it's major or minor.

2. **Scale Calculation**: Based on the key, it calculates the appropriate scale (major or natural minor).

3. **Chord Generation**: For each scale degree in the I-IV-V-I progression:
   - Determines the root note of the chord
   - Calculates whether the chord should be major or minor based on the key signature
   - Generates the triad (root, third, fifth) with correct intervals

4. **MIDI Creation**: Uses `midi-writer-js` to create a MIDI file with each chord as a whole note (4 beats).

## Technical Details

- **Chord Progression**: I-IV-V-I (tonic, subdominant, dominant, tonic)
- **Chord Duration**: Each chord is a whole note (4 beats)
- **Octave**: Chords are generated in octave 4 (middle C = C4)
- **Velocity**: 100 (moderate volume)

### Supported Keys

All 12 chromatic keys are supported:
- Major: C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B
- Minor: All of the above in minor

## Dependencies

- `@modelcontextprotocol/sdk`: MCP server framework
- `midi-writer-js`: MIDI file generation
- `zod`: Schema validation

## Development

The project uses ES modules (`type: "module"` in `package.json`).

### Project Structure

```
chord-progression-mcp/
├── index.js                    # MCP server setup and tool registration
├── createChordProgression.js   # Core chord progression logic
├── package.json
└── README.md
```

## License

ISC

## Author

See `package.json` for author information.

