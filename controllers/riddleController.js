const Riddle = require('../models/Riddle');
const { Julep } = require('@julep/sdk');

const client = new Julep({
    apiKey: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAwMDk1NDgsImlhdCI6MTc0NDgyNTU0OCwic3ViIjoiNGZmMDJjYmYtYmUzNS01Y2Q2LWFkMmEtNGYzZTA3NmQ0ZTMyIn0.mo4_RrzxlZANxYw2geageO_GYBQx5ubmxIBSOXynGD4t_XwIWWCFYKh_DILfZSoGqoBZCqY0k4eF1RKBBWGlBA',
    environment: 'production',
});

let agent = null;
let task = null;

const initializeAgentAndTask = async () => {
    if (!agent) {
        agent = await client.agents.create({
            name: 'LocaLoot Hunt Generator',
            model: 'claude-3.7-sonnet', //'gpt-4-turbo',
            about: 'Generates real-world treasure hunts with riddles, history, and visuals'
        });
    }

    if (!task) {
        task = await client.tasks.create(agent.id, {
            name: 'LocaLoot++ Hunt Generator',
            description: 'Generate treasure hunt clues with stories and image prompts for a given location',
            main: [
                {
                    prompt: [
                        {
                            role: 'system',
                            content: 'You are a creative and historically-informed game designer.',
                        },
                        {
                            role: 'user',
                            content: `
Generate a JSON array of 5 clues for a location-based treasure hunt in "{{steps[0].input.location}}".
Give Brief History in the story part. Give precise or accurate coordinates for latitude and longitude.

Each clue should include:
- "title": string
- "description": string
- "latitude": float
- "longitude": float
- "hint": string
- "story": string
- "points": integer (between 5–20)
- "imagePrompt": string
              `
                        }
                    ]
                }
            ]
        });
    }
};

const generateHunts = async (req, res) => {

    // console.log(req.body);

    const { location } = req.body;
    if (!location) return res.status(400).json({ error: 'Location is required' });

    try {
        const existing = await Riddle.find({ place: location });
        if (existing.length > 0) {
            return res.json({ message: 'Hunts already exist', huntIDs: existing.map(h => h._id) });
        }

        await initializeAgentAndTask();

        const huntIDs = [];

        for (let i = 0; i < 3; i++) {
            const execution = await client.executions.create(task.id, {input: { location }});

            let result;
            while (true) {
                result = await client.executions.get(execution.id);
                if (['succeeded', 'failed'].includes(result.status)) break;
                await new Promise(r => setTimeout(r, 2000)); // wait 2s
            }

            if (result.status !== 'succeeded') {
                console.error('Julep execution failed:', result.output);
                continue;
            }

            let output = result.output.choices[0].message.content.trim();

            // Remove Markdown-style code block wrappers if present
            if (output.startsWith('```') || output.startsWith('"""')) {
                output = output.replace(/^```(json)?|"""|```$/g, '').trim();
            }

            let cluesRaw;
            try {
                console.log(result.output.choices[0].message.content);
                cluesRaw = JSON.parse(output);
                console.log(cluesRaw);
            } catch (parseErr) {
                console.error('Error parsing Julep output:', parseErr);
                continue;
            }

            const clues = cluesRaw.map(clue => ({
                description: clue.description,
                latitue: clue.latitude,
                longitue: clue.longitude,
                hints: [{ description: clue.hint }],
                history: clue.story,
            }));

            const riddle = await Riddle.create({
                place: location,
                description: `${location} Treasure Hunt`,
                clues: clues,
                numberOfClues: clues.length,
                totalPoints: cluesRaw.reduce((sum, clue) => sum + (clue.points || 0), 0),
            });

            huntIDs.push(riddle._id);
        }

        res.json({ huntIDs });

    } catch (err) {
        console.error('Error generating hunts:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const User = require('../models/User'); // Make sure to import your User model

const getHuntById = async (req, res) => {
    const { huntId } = req.body;
    const userId = req.user?._id; // Safely access user ID if authentication middleware exists

    if (!huntId) {
        return res.status(400).json({ error: 'Hunt ID is required' });
    }

    try {
        // Only check active hunts if we have a user ID
        if (userId) {
            const user = await User.findById(userId);
            
            if (user) {
                // Check if hunt exists in user's active hunts
                // This handles both cases where hunts might have their own _id or use a reference ID
                const activeHunt = user.activeHunts.find(hunt => 
                    (hunt._id && hunt._id.toString() === huntId) || 
                    (hunt.huntId && hunt.huntId.toString() === huntId)
                );
                
                if (activeHunt) {
                    return res.status(200).json(activeHunt);
                }
            }
        }
        
        // If not found in active hunts or no user, fetch from Riddle collection
        const hunt = await Riddle.findById(huntId);

        if (!hunt) {
            return res.status(404).json({ error: 'Hunt not found' });
        }

        res.status(200).json(hunt);
    } catch (err) {
        console.error('Error fetching hunt by ID:', err);
        res.status(500).json({ error: 'Server error while fetching hunt' });
    }
};

module.exports = {
    generateHunts,
    getHuntById
};
