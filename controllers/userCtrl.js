import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/userModel.js';

const emailExists = (err) => err.message 
    && err.message.indexOf('duplicate key error') > -1;

const getDuplicateField = (err) => {
    if (err.message.includes('email')) return 'email';
    if (err.message.includes('rollNo')) return 'rollNo';
    return null;
};

const validateUserData = (data) => {
    const errors = [];
    
    // Validate year
    if (![1, 2, 3, 4].includes(data.year)) {
        errors.push('Year must be between 1 and 4');
    }
    
    // Validate semester
    if (![1, 2].includes(data.semester)) {
        errors.push('Semester must be 1 or 2');
    }
    
    // Validate section
    if (!['A', 'B', 'C', 'D', 'E'].includes(data.section.toUpperCase())) {
        errors.push('Section must be A, B, C, D, or E');
    }
    
    // Validate email format
    if (!/^[a-zA-Z0-9._-]+@lords\.ac\.in$/.test(data.email)) {
        errors.push('Email must be in format: username@lords.ac.in');
    }
    
    return errors;
};

const signup = async(req, res) => {
    try {
        const payload = req.body;

        
        
        // Validate user data
        const validationErrors = validateUserData(payload);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                errors: validationErrors
            });
        }
        
        // Check if this is a preview request
        if (payload.preview) {
            return res.status(200).json({
                status: 'preview',
                userData: {
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    rollNo: payload.rollNo,
                    year: payload.year,
                    semester: payload.semester,
                    section: payload.section.toUpperCase(),
                    email: payload.email
                }
            });
        }
        
        // Proceed with actual signup
        payload.password = await bcrypt.hash(payload.password, 2);
        payload.section = payload.section.toUpperCase();
        payload.createdDate = new Date();
        
        const user = new User(payload);
        await user.save();
        
        res.status(201).json({
            status: 'success',
            message: 'User created successfully'
        });
    } catch(err) {
        console.log(err.message);
        if(emailExists(err)) {
            const duplicateField = getDuplicateField(err);
            let errorMessage = 'Duplicate entry error';
            
            if (duplicateField === 'email') {
                errorMessage = 'Email already exists. Please use a different email address.';
            } else if (err.message.includes('rollNo')) {
                // This is a duplicate rollNumber error
                errorMessage = 'A user with this roll number already exists. Please use a different roll number.';
            }
            
            res.status(400).json({
                status: 'error',
                message: errorMessage
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error'
            });
        }
    }
};

const signin = async(req, res) => {
    try {
        const payload = req.body;
        const dbUser = await User.findOne(
            {email: payload.email},
            {_id: 0, createdDate: 0, updatedDate: 0, __v: 0}
        );

        if(!dbUser) {
            return res.status(404).json({
                status: 'error',
                message: 'Invalid Email'
            });
        }

        const isValid = await bcrypt.compare(payload.password, dbUser.password);

        if(isValid) {
            // If valid, creates a JWT token with user info, valid for 1 day.
            const token = jwt.sign(
                { 
                    email: dbUser.email,
                    role: dbUser.role,
                    year: dbUser.year,
                    semester: dbUser.semester,
                    section: dbUser.section
                }, 
                config.jwtSecret, 
                {expiresIn: '1d'}
            );
            
            // Returns a success response with user info and the token.
            res.status(200).json({
                status: 'success',
                data: {
                    firstName: dbUser.firstName,
                    lastName: dbUser.lastName,
                    email: dbUser.email,
                    role: dbUser.role,
                    year: dbUser.year,
                    semester: dbUser.semester,
                    section: dbUser.section,
                    token
                }
            });
        } else {
            res.status(401).json({
                status: 'error',
                message: 'Invalid password'
            });
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const email = req.params.email;
        const user = await User.findOne(
            {email: email},
            {_id: 0, createdDate: 0, updatedDate: 0, __v: 0}
        );

        if (user) {
            res.status(200).json({
                status: 'success',
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    rollNo: user.rollNo,
                    year: user.year,
                    semester: user.semester,
                    section: user.section,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

const deleteAllUsers = async (req, res) => {
    try {
        // Delete all users from the database
        const result = await User.deleteMany({});
        
        res.status(200).json({
            status: 'success',
            message: `All users deleted successfully. ${result.deletedCount} users were deleted.`
        });
    } catch (error) {
        console.error('Error in deleteAllUsers:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting all users'
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        // Get all users from the database
        const users = await User.find({}, {
            password: 0, // Exclude password field
            __v: 0,     // Exclude version field
            _id: 0      // Exclude ID field
        });
        
        res.status(200).json({
            status: 'success',
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching users'
        });
    }
};

const getUsersByFilters = async (req, res) => {
    try {
        const { year, semester, section } = req.query;
        
        // Build filter object based on provided parameters
        const filter = {};
        
        if (year) {
            const yearNum = parseInt(year);
            if (isNaN(yearNum) || ![1, 2, 3, 4].includes(yearNum)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Year must be between 1 and 4'
                });
            }
            filter.year = yearNum;
        }
        
        if (semester) {
            const semesterNum = parseInt(semester);
            if (isNaN(semesterNum) || ![1, 2].includes(semesterNum)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Semester must be 1 or 2'
                });
            }
            filter.semester = semesterNum;
        }
        
        if (section) {
            const sectionUpper = section.toUpperCase();
            if (!['A', 'B', 'C', 'D', 'E'].includes(sectionUpper)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Section must be A, B, C, D, or E'
                });
            }
            filter.section = sectionUpper;
        }
        
        // Get filtered users from the database
        const users = await User.find(filter, {
            password: 0, // Exclude password field
            __v: 0,     // Exclude version field
            _id: 0      // Exclude ID field
        });
        
        res.status(200).json({
            status: 'success',
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error in getUsersByFilters:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching users'
        });
    }
};

export default {
    signup,
    signin,
    getUserProfile,
    deleteAllUsers,
    getAllUsers,
    getUsersByFilters
};