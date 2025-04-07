import mongoose from "mongoose";
const { Schema } = mongoose;

/** subject model */
const subjectSchema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Subject name is required'],
        trim: true
    },
    branch: { 
        type: String, 
        required: [true, 'Branch is required'],
        enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'],
        uppercase: true
    },
    year: { 
        type: Number, 
        required: [true, 'Year is required'],
        enum: [1, 2, 3, 4],
        validate: {
            validator: Number.isInteger,
            message: 'Year must be between 1 and 4'
        }
    },
    semester: { 
        type: Number, 
        required: [true, 'Semester is required'],
        enum: [1, 2],
        validate: {
            validator: Number.isInteger,
            message: 'Semester must be 1 or 2'
        }
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt timestamp before saving
subjectSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Subject', subjectSchema); 