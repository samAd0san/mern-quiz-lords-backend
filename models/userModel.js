import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
    },  
    rollNo: {
        type: String,
        required: false,
        unique: false
    },
    branch: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    section: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    active: { type: Boolean, default: true },
    role: { type: String, default: 'User' },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now }
});

// Pre-save middleware to update the updatedDate
schema.pre('save', function(next) {
    this.updatedDate = new Date();
    next();
});

const User = mongoose.model('users', schema);
export default User;
