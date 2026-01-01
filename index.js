import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createChordProgression } from "./createChordProgression.js";


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
        }),
    },
    async ({ key }) => {
        try {
            // Generate the MIDI file buffer
            const midiBuffer = createChordProgression(key);
            
            // Convert buffer to base64 string for MCP
            const base64Data = midiBuffer.toString('base64');
            
            // Generate filename
            const keyName = key.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_#]/g, '');
            const filename = `${keyName}_chords.mid`;
            
            return {
                content: [
                    {
                        type: 'audio',
                        data: base64Data,
                        mimeType: 'audio/midi',
                    },
                    {
                        type: 'text',
                        text: `Generated MIDI file with I-IV-V-I chord progression in ${key}. File: ${filename}`,
                    },
                ],
                structuredContent: {
                    filename,
                    key,
                    progression: 'I-IV-V-I',
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