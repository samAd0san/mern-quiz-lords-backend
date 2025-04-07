import Questions from "../models/questionSchema.js";
import Results from "../models/resultSchema.js";
import User from "../models/userModel.js";

import { setOneQuestions, answersSetOne } from '../database/setOne.js';
import { setTwoQuestions, answersSetTwo } from '../database/setTwo.js';
import { setThreeQuestions, answersSetThree } from '../database/setThree.js';

/** Get questions based on roll number */
export async function getQuestions(req, res) {
    try {
        const { rollNumber } = req.query; // Get roll number from query parameters

        // Default to setOne if rollNumber is not provided
        const rollInt = rollNumber ? parseInt(rollNumber.slice(-3)) - 1 : 0;

        let set;
        if (rollInt % 3 === 0) {
            set = 'setOne';
        } else if (rollInt % 3 === 1) {
            set = 'setTwo';
        } else {
            set = 'setThree';
        }

        console.log("Querying set:", set); // debug

        const questions = await Questions.findOne({ set });
        console.log("Found questions:", questions); // Additional debugging statement
    
        if (!questions) return res.status(404).json({ 
            status: 'error',
            message: "Questions not found" 
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

/** Insert all questions */
export async function insertQuestions(req, res) {
    try {
        await Questions.insertMany([
            { set: 'setOne', questions: setOneQuestions, answers: answersSetOne },
            { set: 'setTwo', questions: setTwoQuestions, answers: answersSetTwo },
            { set: 'setThree', questions: setThreeQuestions, answers: answersSetThree }
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

/** Delete all Questions */
export async function dropQuestions(req, res) {
    try {
        await Questions.deleteMany();
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
        const results = await Results.find().populate('rollNumber', 'firstName lastName email year semester section');
        res.status(200).json({
            status: 'success',
            data: results
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
        const { rollNumber, result, attempts, points, achieved } = req.body;
        if (!rollNumber || !result) throw new Error('Roll Number and Result are Required');

        // Check if user exists
        const user = await User.findOne({ rollNo: rollNumber });
        if (!user) {
            return res.status(404).json({ 
                status: 'error',
                message: 'User not found with this roll number' 
            });
        }

        await Results.create({ rollNumber, result, attempts, points, achieved });
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
        await Results.deleteMany();
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