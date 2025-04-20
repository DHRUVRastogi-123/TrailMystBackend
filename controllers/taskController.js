const { Julep } = require('@julep/sdk');

// Init Julep client
const client = new Julep({
    apiKey: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAwMDk1NDgsImlhdCI6MTc0NDgyNTU0OCwic3ViIjoiNGZmMDJjYmYtYmUzNS01Y2Q2LWFkMmEtNGYzZTA3NmQ0ZTMyIn0.mo4_RrzxlZANxYw2geageO_GYBQx5ubmxIBSOXynGD4t_XwIWWCFYKh_DILfZSoGqoBZCqY0k4eF1RKBBWGlBA',
    environment: 'production',
});

let agent = null;
let task = null;

const initializeAgentAndTask = async () => {
    if (!agent) {
        agent = await client.agents.create({
            name: 'LocaLoot Task Suggester',
            model: 'gpt-4-turbo',
            about: 'Suggests short, fun, and healthy activities for players walking during treasure hunts'
        });
    }

    if (!task) {
        task = await client.tasks.create(agent.id, {
            name: 'Activity Suggestion Generator',
            description: 'Suggest short and engaging healthy activities for players en route to a clue',
            main: [
                {
                    prompt: [
                        {
                            role: 'system',
                            content: 'You are a cheerful health and game advisor helping players stay active during treasure hunts.',
                        },
                        {
                            role: 'user',
                            content: `
Suggest a short, fun, healthy, and safe activity a player can do while walking from point A to point B during a treasure hunt.
Their current location is "{{steps[0].input.userLocation}}" and their clue is at "{{steps[0].input.clueLocation}}".
Only respond with the activity text. No headings or explanations.
                        `
                        }
                    ]
                }
            ]
        });
    }
};

// POST /task/suggest
const suggestTask = async (req, res) => {
    const { userLat, userLong, clueLat, clueLong } = req.body;

    if (!userLat || !userLong || !clueLat || !clueLong) {
        return res.status(400).json({ error: 'Missing coordinates.' });
    }

    try {
        await initializeAgentAndTask();

        const input = {
            userLocation: `(${userLat}, ${userLong})`,
            clueLocation: `(${clueLat}, ${clueLong})`
        };

        const execution = await client.executions.create(task.id, { input });

        let result;
        while (true) {
            result = await client.executions.get(execution.id);
            if (['succeeded', 'failed'].includes(result.status)) break;
            await new Promise(r => setTimeout(r, 2000));
        }

        if (result.status !== 'succeeded') {
            console.error('Julep task suggestion failed:', result.output);
            return res.status(500).json({ error: 'Julep task generation failed' });
        }

        const taskSuggestion = result.output.choices[0].message.content.trim();
        res.status(200).json({ task: taskSuggestion });

    } catch (err) {
        console.error('Error suggesting task:', err);
        res.status(500).json({ error: 'Server error while generating task' });
    }
};

module.exports = { suggestTask };
