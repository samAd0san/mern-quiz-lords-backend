import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema({
    firstName: {
        type: String,
        required: [true, 'First Name is mandatory'],
        minLength: [2, 'Min 2 characters'],
        maxLength: [15, 'Max 15 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last Name is Required'],
        minLength: [2, 'Min 2 characters'],
        maxLength: [15, 'Max 15 characters']
    },  
    rollNo: {
        type: String,
        required: false,
        unique: false
    },
    year: {
        type: Number,
        required: [true, 'Year is Required'],
        enum: [1, 2, 3, 4],
        validate: {
            validator: Number.isInteger,
            message: 'Year must be between 1 and 4'
        }
    },
    semester: {
        type: Number,
        required: [true, 'Semester is Required'],
        enum: [1, 2],
        validate: {
            validator: Number.isInteger,
            message: 'Semester must be 1 or 2'
        }
    },
    section: {
        type: String,
        required: [true, 'Section is Required'],
        enum: ['A', 'B', 'C', 'D', 'E'],
        uppercase: true
    },
    email: {
        type: String,
        required: [true, 'Email is Required'],
        unique: true,
        validate: {
            validator: function(value) {
                // Validate email format for lords.ac.in domain
                return /^[a-zA-Z0-9._-]+@lords\.ac\.in$/.test(value);
            },
            message: 'Email must be in format: username@lords.ac.in'
        }
    },
    password: { 
        type: String,
        required: [true, 'Password is Required'],
        minLength: [6, 'Password must be at least 6 characters']
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
