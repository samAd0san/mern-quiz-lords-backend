import express from 'express';

import userController from '../controllers/userCtrl.js'

const router = express.Router();

router.post('/signup',userController.signup);
router.post('/signin',userController.signin);

// New route for fetching user profile by email
router.get('/profile/:email', userController.getUserProfile);

// Route for deleting all users
router.delete('/delete-all', userController.deleteAllUsers);

// Route for getting all users
router.get('/all', userController.getAllUsers);

// Route for getting users filtered by year, semester, and section
router.get('/filter', userController.getUsersByFilters);

export default router;