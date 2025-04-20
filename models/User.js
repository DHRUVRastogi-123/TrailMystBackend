const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    activeHunts: [
        {
            place:String,
            description:String,
            clues: [{
                description: String,
                latitue: Number,
                longitue: Number,
                hints: [{
                    description: String,
                }],
                history: String,
            }],
            numberOfClues: Number,
            numberOfPlayersCompleted:{
                type:Number,
                default:0,
            },
            totalPoints: {
                type: Number,
                default: 0,
            },
            currentClueIndex: Number,
            isCompleted: Boolean,
            currentPoints: {
                type: Number,
                default: 0,
            },
        }
    ],
    points: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);
