import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createChordProgression } from "./createChordProgression.js";

/**
 * Returns a human-readable description of the progression pattern
 */
function getProgressionDescription(numChords) {
    const patterns = {
        2: 'I-V',
        3: 'I-IV-V',
        4: 'I-IV-V-I',
        5: 'I-vi-IV-V-I',
        6: 'I-vi-IV-V-I-IV',
    };
    return patterns[numChords] || `I-IV-V-I (${numChords} chords)`;
}


const server = new McpServer({
    name: "chord-progression-mcp",
    version: "1.0.0",
    description: "A MCP server for chord progressions",
});

server.registerTool(
    'get-chord-progression',
    {
        title: 'Chord Progression Generator',
        description: 'Generate a chord progression MIDI file for a given musical key',
        inputSchema: z.object({
            key: z.string().describe('The musical key (e.g., "C major", "A minor", "F# major", "Bb minor")'),
            numChords: z.number().int().min(2).max(6).optional().default(4).describe('Number of chords in the progression (2-6, default: 4)'),
        }),
    },
    async ({ key, numChords = 4 }) => {
        try {
            // Validate numChords
            if (numChords < 2 || numChords > 6) {
                throw new Error('numChords must be between 2 and 6');
            }
            
            // Generate the MIDI file buffer
            const midiBuffer = createChordProgression(key, numChords);
            
            // Convert buffer to base64 string for MCP
            const base64Data = midiBuffer.toString('base64');
            
            // Generate filename
            const keyName = key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_#]/g, '');
            const filename = `${keyName}_chords.mid`;
            
            // Get progression description
            const progression = getProgressionDescription(numChords);
            
            return {
                content: [
                    {
                        type: 'audio',
                        data: base64Data,
                        mimeType: 'audio/midi',
                    },
                    {
                        type: 'text',
                        text: `Generated MIDI file with ${numChords} chord progression (${progression}) in ${key}. File: ${filename}`,
                    },
                ],
                structuredContent: {
                    filename,
                    key,
                    numChords,
                    progression,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating chord progression: ${errorMessage}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

const transport = new StdioServerTransport();

await server.connect(transport);