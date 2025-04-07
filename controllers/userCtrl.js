import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/userModel.js';

const emailExists = (err) => err.message 
    && err.message.indexOf('duplicate key error') > -1;

const getDuplicateField = (err) => {
    if (err.message.includes('email')) return 'email';
    return null;
};

const signup = async(req, res) => {
    try {
        const payload = req.body;
        
        // Check if this is a preview request
        if (payload.preview) {
            return res.status(200).json({
                status: 'preview',
                userData: {
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    rollNo: payload.rollNo,
                    branch: payload.branch,
                    year: payload.year,
                    semester: payload.semester,
                    section: payload.section,
                    email: payload.email
                }
            });
        }
        
        // Check if user with this rollNo already exists
        if (payload.rollNo) {
            const existingUser = await User.findOne({ rollNo: payload.rollNo });
            if (existingUser) {
                // Update the existing user instead of creating a new one
                existingUser.firstName = payload.firstName;
                existingUser.lastName = payload.lastName;
                existingUser.branch = payload.branch;
                existingUser.year = payload.year;
                existingUser.semester = payload.semester;
                existingUser.section = payload.section;
                existingUser.email = payload.email;
                existingUser.password = await bcrypt.hash(payload.password, 2);
                existingUser.updatedDate = new Date();
                
                await existingUser.save();
                
                return res.status(200).json({
                    status: 'success',
                    message: 'User updated successfully'
                });
            }
        }
        
        // Proceed with actual signup for new user
        payload.password = await bcrypt.hash(payload.password, 2);
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
                    branch: dbUser.branch,
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
                    branch: dbUser.branch,
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
                    branch: user.branch,
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
        const { year, semester, section, branch } = req.query;
        
        // Build filter object based on provided parameters
        const filter = {};
        
        if (year) {
            const yearNum = parseInt(year);
            filter.year = yearNum;
        }
        
        if (semester) {
            const semesterNum = parseInt(semester);
            filter.semester = semesterNum;
        }
        
        if (section) {
            filter.section = section;
        }
        
        if (branch) {
            filter.branch = branch;
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