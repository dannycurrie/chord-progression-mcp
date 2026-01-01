import MidiWriter from 'midi-writer-js';

/**
 * Maps note names to MIDI note numbers (C4 = 60)
 */
const NOTE_TO_MIDI = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
  'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
};

/**
 * Intervals for major and minor triads
 */
const MAJOR_TRIAD = [0, 4, 7]; // Root, Major Third, Perfect Fifth
const MINOR_TRIAD = [0, 3, 7]; // Root, Minor Third, Perfect Fifth

/**
 * Scale degrees for major keys (chromatic offsets from root)
 */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

/**
 * Scale degrees for minor keys (natural minor - chromatic offsets from root)
 */
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]; // C, D, Eb, F, G, Ab, Bb

/**
 * Parses a musical key string (e.g., "C major", "A minor", "F# major")
 * Returns the root note name and whether it's minor
 */
function parseKey(keyString) {
  const normalized = keyString.trim();

  // Check for minor indicators
  const minorIndicators = ['minor', 'min', 'm'];
  const isMinor = minorIndicators.some(indicator => 
    normalized.toLowerCase().includes(indicator.toLowerCase())
  );
  
  // Extract root note (remove minor/major indicators and whitespace)
  let root = normalized
    .replace(/minor|min|major|maj|m|M/gi, '')
    .trim();
  
  // Handle edge cases like "Am" or "a minor"
  if (!root || root.length === 0) {
    // Check if the string itself is a note (e.g., "Am")
    const noteMatch = normalized.match(/^([A-G][#b]?)(m|M)?$/i);
    if (noteMatch) {
      root = noteMatch[1];
      // Capitalize first letter
      root = root.charAt(0).toUpperCase() + root.slice(1);
      // If 'm' is present and not part of the note name, it's minor
      if (noteMatch[2] && noteMatch[2].toLowerCase() === 'm') {
        return { root, isMinor: true };
      }
      return { root, isMinor: false };
    }
    return null;
  }
  
  // Capitalize first letter
  root = root.charAt(0).toUpperCase() + root.slice(1);
  
  return { root, isMinor };
}

/**
 * Converts a note name and octave to MIDI note number
 */
function noteToMidi(noteName, octave = 4) {
  const baseNote = NOTE_TO_MIDI[noteName];
  if (baseNote === undefined) {
    throw new Error(`Invalid note name: ${noteName}`);
  }
  return baseNote + (octave - 4) * 12;
}

/**
 * Gets the note name for a scale degree in a given key
 */
function getScaleDegreeNote(root, degree, isMinor) {
  const scale = isMinor ? MINOR_SCALE : MAJOR_SCALE;
  const rootMidi = NOTE_TO_MIDI[root];
  
  if (rootMidi === undefined) {
    throw new Error(`Invalid root note: ${root}`);
  }
  
  // Convert scale degree (0-6) to chromatic offset
  const degreeIndex = ((degree - 1) % 7 + 7) % 7; // Handle negative degrees
  const chromaticOffset = scale[degreeIndex];
  
  // Calculate MIDI note and convert back to note name
  const midiNote = rootMidi + chromaticOffset;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteInOctave = midiNote % 12;
  
  // Map MIDI note numbers to note names
  const midiToNote = {
    0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
    6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B'
  };
  
  // Get the enharmonic equivalent that matches the key signature
  const noteName = midiToNote[noteInOctave];
  
  // Adjust for key signature preferences (e.g., use Db instead of C# in Db major)
  const keyPrefs = {
    'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
    'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
  };
  
  const preferred = keyPrefs[root]?.[degreeIndex];
  return preferred || noteName;
}

/**
 * Gets chord notes for a scale degree (I, IV, V, etc.)
 */
function getChordNotes(root, degree, isMinor, octave = 4) {
  const scale = isMinor ? MINOR_SCALE : MAJOR_SCALE;
  
  // Get the root note of the chord
  const chordRoot = getScaleDegreeNote(root, degree, isMinor);
  
  // Determine if the chord is major or minor based on scale degree
  let isChordMinor;
  if (isMinor) {
    // In minor keys: i, ii°, III, iv, v, VI, VII
    isChordMinor = [1, 4, 5].includes(degree);
  } else {
    // In major keys: I, ii, iii, IV, V, vi, vii°
    isChordMinor = [2, 3, 6].includes(degree);
  }
  
  // Get the triad intervals
  const intervals = isChordMinor ? MINOR_TRIAD : MAJOR_TRIAD;
  
  // Calculate notes
  const notes = [];
  const rootMidi = noteToMidi(chordRoot, octave);
  
  intervals.forEach(interval => {
    const noteMidi = rootMidi + interval;
    const octaveNum = Math.floor(noteMidi / 12) - 1;
    const noteInOctave = noteMidi % 12;
    
    const midiToNote = {
      0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
      6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B'
    };
    
    const noteName = midiToNote[noteInOctave];
    notes.push(noteName + octaveNum);
  });
  
  return notes;
}

/**
 * Returns the scale degrees for a progression with the specified number of chords
 * @param numChords - Number of chords (2-6)
 * @returns Array of scale degrees (1-7)
 */
function getProgressionDegrees(numChords) {
  const patterns = {
    2: [1, 5],           // I-V
    3: [1, 4, 5],        // I-IV-V
    4: [1, 4, 5, 1],     // I-IV-V-I
    5: [1, 6, 4, 5, 1],  // I-vi-IV-V-I
    6: [1, 6, 4, 5, 1, 4], // I-vi-IV-V-I-IV
  };
  
  if (numChords < 2 || numChords > 6) {
    throw new Error(`numChords must be between 2 and 6, got ${numChords}`);
  }
  
  return patterns[numChords];
}

/**
 * Generates a MIDI file with a specified number of chords in the given key
 * Uses common chord progressions based on the number of chords requested
 * 
 * @param key - The musical key (e.g., "C major", "A minor", "F# major", "Bb minor")
 * @param numChords - Number of chords in the progression (2-6, default: 4)
 * @returns The buffer of the generated MIDI file
 */
export function createChordProgression(key, numChords = 4) {
  // Parse the key
  const keyInfo = parseKey(key);
  if (!keyInfo) {
    throw new Error(`Invalid key format: ${key}. Expected format: "C major" or "A minor"`);
  }
  
  const { root, isMinor } = keyInfo;
  
  // Validate root note
  if (!NOTE_TO_MIDI[root]) {
    throw new Error(`Invalid root note: ${root}. Valid notes: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (or enharmonic equivalents)`);
  }
  
  // Validate numChords
  if (numChords < 2 || numChords > 6) {
    throw new Error(`numChords must be between 2 and 6, got ${numChords}`);
  }
  
  // Get the chord progression degrees
  const progression = getProgressionDegrees(numChords);
  
  // Create a new MIDI track
  const track = new MidiWriter.Track();
  
  // Add each chord to the track
  progression.forEach(degree => {
    const chordNotes = getChordNotes(root, degree, isMinor, 4);
    
    // Convert note names to MIDI pitch format expected by midi-writer-js
    // Format: ["C4", "E4", "G4"]
    const noteEvent = new MidiWriter.NoteEvent({
      pitch: chordNotes,
      duration: '1', // Whole note (4 beats)
      velocity: 100 // Note velocity (0-127)
    });
    
    track.addEvent(noteEvent);
  });
  
  // Create a writer instance
  const writer = new MidiWriter.Writer(track);
  
  // Write the MIDI file
  const buffer = writer.buildFile();
  return Buffer.from(buffer);
}
