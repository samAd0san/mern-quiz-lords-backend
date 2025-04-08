import Questions from "../models/questionSchema.js";
import Results from "../models/resultSchema.js";
import User from "../models/userModel.js";
import Subject from "../models/subjectSchema.js";

import { setOneQuestions, answersSetOne } from '../database/setOne.js';
import { setTwoQuestions, answersSetTwo } from '../database/setTwo.js';
import { setThreeQuestions, answersSetThree } from '../database/setThree.js';

/** Get questions based on roll number and subject */
export async function getQuestions(req, res) {
    try {
        const { rollNumber } = req.query; // Get roll number from query parameters
        const subjectId = req.query.subjectId || req.params.subjectId; // Get subjectId from query or path parameters
        
        if (!subjectId) {
            return res.status(400).json({
                status: 'error',
                message: "Subject ID is required"
            });
        }

        // Check if subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                status: 'error',
                message: "Subject not found"
            });
        }

        // If no rollNumber is provided, return all three sets
        if (!rollNumber) {
            const allSets = await Questions.find({ subject: subjectId }).populate('subject');
            
            if (!allSets || allSets.length === 0) {
                return res.status(404).json({ 
                    status: 'error',
                    message: "Questions not found for this subject" 
                });
            }
            
            return res.status(200).json({
                status: 'success',
                data: allSets
            });
        }

        // Default to setOne if rollNumber is provided
        const rollInt = parseInt(rollNumber.slice(-3)) - 1;

        let set;
        if (rollInt % 3 === 0) {
            set = 'setOne';
        } else if (rollInt % 3 === 1) {
            set = 'setTwo';
        } else {
            set = 'setThree';
        }

        console.log("Querying set:", set); // debug

        const questions = await Questions.findOne({ set, subject: subjectId }).populate('subject');
        console.log("Found questions:", questions); // Additional debugging statement
    
        if (!questions) return res.status(404).json({ 
            status: 'error',
            message: "Questions not found for this subject" 
        });

        res.status(200).json({
            status: 'success',
            data: questions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: "An error occurred while fetching questions" 
        });
    }
}

/** Insert questions for a subject */
export async function insertQuestions(req, res) {
    try {
        const { subjectId } = req.params;
        
        if (!subjectId) {
            return res.status(400).json({
                status: 'error',
                message: "Subject ID is required"
            });
        }
        
        // Check if subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                status: 'error',
                message: "Subject not found"
            });
        }
        
        // Check if questions already exist for this subject
        const existingQuestions = await Questions.findOne({ subject: subjectId });
        if (existingQuestions) {
            return res.status(400).json({
                status: 'error',
                message: "Questions already exist for this subject"
            });
        }
        
        await Questions.insertMany([
            { set: 'setOne', subject: subjectId, questions: setOneQuestions, answers: answersSetOne },
            { set: 'setTwo', subject: subjectId, questions: setTwoQuestions, answers: answersSetTwo },
            { set: 'setThree', subject: subjectId, questions: setThreeQuestions, answers: answersSetThree }
        ]);
        
        res.status(201).json({ 
            status: 'success',
            message: "Questions Saved Successfully" 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: "An error occurred while inserting questions" 
        });
    }
}

/** Delete questions for a subject */
export async function dropQuestions(req, res) {
    try {
        const { subjectId } = req.query;
        
        if (!subjectId) {
            return res.status(400).json({
                status: 'error',
                message: "Subject ID is required"
            });
        }
        
        // Check if subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                status: 'error',
                message: "Subject not found"
            });
        }
        
        await Questions.deleteMany({ subject: subjectId });
        res.status(200).json({ 
            status: 'success',
            message: "Questions Deleted Successfully" 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: "An error occurred while deleting questions" 
        });
    }
}

/** Get all results */
export async function getResult(req, res) {
    try {
        const { subjectId } = req.query;
        
        let query = {};
        if (subjectId) {
            query.subject = subjectId;
        }
        
        const results = await Results.find(query)
            .populate('user', 'firstName lastName email year semester section branch rollNo')
            .populate('subject', 'name branch year semester');
            
        // Map the results to include rollNumber from the user object
        const mappedResults = results.map(result => {
            const resultObj = result.toObject();
            if (resultObj.user && resultObj.user.rollNo) {
                resultObj.rollNumber = resultObj.user.rollNo;
            }
            return resultObj;
        });
            
        res.status(200).json({
            status: 'success',
            data: mappedResults
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: 'An error occurred while fetching results' 
        });
    }
}

/** Post all results */
export async function storeResult(req, res) {
    try {
        const { rollNumber, subjectId } = req.params;
        const { result, attempts, points, achieved, set } = req.body;

        if (!rollNumber || !result || !subjectId || !set) {
            throw new Error('Roll Number, Subject ID, Result, and Set are Required');
        }

        const user = await User.findOne({ rollNo: rollNumber });
        if (!user) {
            return res.status(404).json({ 
                status: 'error',
                message: 'No user found with this roll number' 
            });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Subject not found' 
            });
        }

        await Results.create({ 
            rollNumber: user.rollNo, 
            user: user._id,
            subject: subjectId,
            set: set,
            result, 
            attempts, 
            points, 
            achieved 
        });

        res.status(201).json({ 
            status: 'success',
            message: "Result Saved Successfully" 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'An error occurred while saving the result' 
        });
    }
}

/** Delete all results */
export async function dropResult(req, res) {
    try {
        const { subjectId } = req.query;
        
        let query = {};
        if (subjectId) {
            query.subject = subjectId;
        }
        
        await Results.deleteMany(query);
        res.status(200).json({ 
            status: 'success',
            message: "Results Deleted Successfully" 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: 'An error occurred while deleting results' 
        });
    }
}

/** Get all subjects */
export async function getAllSubjects(req, res) {
    try {
        const subjects = await Subject.find();
        res.status(200).json({
            status: 'success',
            data: subjects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: 'An error occurred while fetching subjects' 
        });
    }
}

/** Get subjects by branch, year, and semester */
export async function getSubjectsByBranchYearSemester(req, res) {
    try {
        const { branch, year, semester } = req.params;
        
        // Validate parameters
        if (!branch || !year || !semester) {
            return res.status(400).json({
                status: 'error',
                message: 'Branch, year, and semester are required'
            });
        }
        
        // Convert year and semester to numbers
        const yearNum = parseInt(year);
        const semesterNum = parseInt(semester);
        
        // Validate year and semester values
        if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
            return res.status(400).json({
                status: 'error',
                message: 'Year must be between 1 and 4'
            });
        }
        
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 2) {
            return res.status(400).json({
                status: 'error',
                message: 'Semester must be 1 or 2'
            });
        }
        
        // Find subjects by branch, year, and semester
        const subjects = await Subject.find({ 
            branch: branch, 
            year: yearNum, 
            semester: semesterNum 
        });
        
        if (subjects.length === 0) {
            return res.status(404).json({ 
                status: 'error',
                message: 'No subjects found for this branch, year, and semester' 
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: subjects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: 'An error occurred while fetching subjects' 
        });
    }
}

/** Create a new subject */
export async function createSubject(req, res) {
    try {
        const { name, branch, year, semester } = req.body;
        
        // Validate required fields
        if (!name || !branch || !year || !semester) {
            return res.status(400).json({
                status: 'error',
                message: 'Name, branch, year, and semester are required'
            });
        }
        
        // Create new subject without checking for duplicates
        const subject = new Subject({
            name,
            branch: branch,
            year,
            semester
        });
        
        await subject.save();
        
        res.status(201).json({
            status: 'success',
            message: 'Subject created successfully',
            data: subject
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'An error occurred while creating the subject' 
        });
    }
}

/** Update a subject */
export async function updateSubject(req, res) {
    try {
        const { id } = req.params;
        const { name, branch, year, semester } = req.body;
        
        // Check if subject exists
        const subject = await Subject.findById(id);
        if (!subject) {
            return res.status(404).json({
                status: 'error',
                message: 'Subject not found'
            });
        }
        
        // Update subject
        if (name) subject.name = name;
        if (branch) subject.branch = branch;
        if (year) subject.year = year;
        if (semester) subject.semester = semester;
        
        await subject.save();
        
        res.status(200).json({
            status: 'success',
            message: 'Subject updated successfully',
            data: subject
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'An error occurred while updating the subject' 
        });
    }
}

/** Delete a subject */
export async function deleteSubject(req, res) {
    try {
        const { id } = req.params;
        
        // Check if subject exists
        const subject = await Subject.findById(id);
        if (!subject) {
            return res.status(404).json({
                status: 'error',
                message: 'Subject not found'
            });
        }
        
        // Check if there are any questions or results associated with this subject
        const questionsCount = await Questions.countDocuments({ subject: id });
        const resultsCount = await Results.countDocuments({ subject: id });
        
        if (questionsCount > 0 || resultsCount > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete subject because it has associated questions or results'
            });
        }
        
        await Subject.findByIdAndDelete(id);
        
        res.status(200).json({
            status: 'success',
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'An error occurred while deleting the subject' 
        });
    }
}

/** Get results filtered by year, semester, branch, and section or any one of them */
export async function getFilteredResults(req, res) {
    try {
        const { year, semester, branch, section } = req.query;
        
        // Build filter object based on provided parameters
        const userFilter = {};
        
        if (year) {
            const yearNum = parseInt(year);
            userFilter.year = yearNum;
        }
        
        if (semester) {
            const semesterNum = parseInt(semester);
            userFilter.semester = semesterNum;
        }
        
        if (branch) {
            userFilter.branch = branch;
        }
        
        if (section) {
            userFilter.section = section;
        }
        
        // Find users matching the filter criteria
        const users = await User.find(userFilter, '_id');
        const userIds = users.map(user => user._id);
        
        // Get filtered results from the database
        const results = await Results.find({ user: { $in: userIds } })
            .populate('user', 'firstName lastName email year semester section branch rollNo')
            .populate('subject', 'name branch year semester');
        
        // Map the results to include rollNumber from the user object
        const mappedResults = results.map(result => {
            const resultObj = result.toObject();
            if (resultObj.user && resultObj.user.rollNo) {
                resultObj.rollNumber = resultObj.user.rollNo;
            }
            return resultObj;
        });
        
        res.status(200).json({
            status: 'success',
            count: mappedResults.length,
            data: mappedResults
        });
    } catch (error) {
        console.error('Error in getFilteredResults:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching filtered results'
        });
    }
}

export async function getResultByRollAndSubject(req, res) {
    try {
        const { rollNumber, subjectId } = req.params;

        if (!rollNumber || !subjectId) {
            return res.status(400).json({
                status: 'error',
                message: 'rollNumber and subjectId are required'
            });
        }

        // Find the user by rollNumber
        const user = await User.findOne({ rollNo: rollNumber });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found with this roll number'
            });
        }

        // Find the result by user ID and subject ID
        const result = await Results.findOne({ user: user._id, subject: subjectId })
            .populate('user', 'firstName lastName email year semester section branch rollNo')
            .populate('subject', 'name branch year semester');

        if (!result) {
            return res.status(404).json({
                status: 'error',
                message: 'Result not found'
            });
        }

        // Convert to object and add rollNumber
        const resultObj = result.toObject();
        resultObj.rollNumber = user.rollNo;

        res.status(200).json({
            status: 'success',
            data: resultObj
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching the result'
        });
    }
}
