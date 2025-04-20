const mongoose=require("mongoose");
const RiddleSchema = new mongoose.Schema({
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
});

const Riddle = mongoose.model("Riddle", RiddleSchema);
module.exports = Riddle;