import mongoose from "mongoose";
const { Schema } = mongoose;
/** result model */
const resultModel = new Schema({
    rollNumber: { 
        type: String, 
        required: [true, 'Roll Number is Required']
    },
    subject: {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject reference is required']
    },
    result: { type: Array, default: []},
    attempts: { type: Number, default: 0},
    points: { type: Number, default: 0},
    achieved: { type: String, default: ''},
    createdAt: { type: Date, default: Date.now}
})

export default mongoose.model('result', resultModel);