const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path if needed

const addHuntToUser = async (req, res) => {
    console.log(req.body);

    const { hunt } = req.body;
    const userId = req.body.userId?.id || req.body.userId; // ✅ Handle ObjectId properly

    if (!userId || !hunt) {
        return res.status(400).json({ error: 'userId and hunt are required' });
    }

    // Optional safety check
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid userId format' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if this hunt is already in the user's activeHunts
        const huntActive = user.activeHunts.find(activeHunt => 
            (hunt._id && activeHunt._id && activeHunt._id.toString() === hunt._id.toString()) ||
            (hunt.place === activeHunt.place && hunt.description === activeHunt.description)
        );

        if (huntActive) {

            const currentClueIndex = huntActive.currentClueIndex;

            return res.status(201).json({ 
                message: 'Already Hunt Present', currentClueIndex
            });
        }

        const huntWithDefaults = {
            ...hunt,
            currentClueIndex: 0,
            isCompleted: false,
            currentPoints: 0
        };

        user.activeHunts.push(huntWithDefaults);
        await user.save();

        res.status(200).json({ message: 'Hunt added to user successfully', user });
    } catch (err) {
        console.error('Error adding hunt to user:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const solveClue = async (req, res) => {
    const { userId, huntId, clueIndex } = req.body;
    const finalUserId = userId?.id || userId;

    if (!finalUserId || !huntId || clueIndex === undefined) {
        return res.status(400).json({ error: 'userId, huntId, and clueIndex are required' });
    }

    // Optional safety check
    if (!mongoose.Types.ObjectId.isValid(finalUserId)) {
        return res.status(400).json({ error: 'Invalid userId format' });
    }

    try {
        const user = await User.findById(finalUserId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the hunt in user's activeHunts by _id
        const huntIndex = user.activeHunts.findIndex(h => h._id.toString() === huntId);
        if (huntIndex === -1) {
            return res.status(404).json({ error: 'Hunt not found in user\'s active hunts' });
        }

        const hunt = user.activeHunts[huntIndex];

        // Update the clue index
        const nextClueIndex = clueIndex + 1;
        hunt.currentClueIndex = nextClueIndex;
        hunt.currentPoints += nextClueIndex * 10;

        // If all clues are solved, mark as completed
        if (nextClueIndex === hunt.numberOfClues) {
            hunt.isCompleted = true;
            user.points += hunt.currentPoints;
        }

        await user.save();

        res.status(200).json({ message: 'Clue solved, progress updated', user });
    } catch (err) {
        console.error('Error solving clue:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    addHuntToUser,
    solveClue,
};
