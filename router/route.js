import { Router } from "express";
const router = Router();

/** import controllers */
import * as controller from '../controllers/controller.js';

/** Questions Routes API */
router.route('/questions')
    .get(controller.getQuestions) /** GET Request */
    .delete(controller.dropQuestions)

/** Subject-specific question routes */
router.route('/questions/subject/:subjectId')
    .get(controller.getQuestions)
    .post(controller.insertQuestions) /** POST Request */

/** Subject Routes API */
router.route('/subjects')
    .get(controller.getAllSubjects) /** GET Request - Get all subjects */
    .post(controller.createSubject) /** POST Request - Create a new subject */

router.route('/subjects/:id')
    .put(controller.updateSubject) /** PUT Request - Update a subject */
    .delete(controller.deleteSubject) /** DELETE Request - Delete a subject */

router.route('/subjects/branch/:branch/year/:year/semester/:semester')
    .get(controller.getSubjectsByBranchYearSemester) /** GET Request - Get subjects by branch, year, and semester */

router.route('/result')
    .get(controller.getResult)
    .post(controller.storeResult)
    .delete(controller.dropResult)

/** Filtered Results Route */
router.route('/result/filter')
    .get(controller.getFilteredResults) /** GET Request - Get results filtered by year, semester, branch, and section */

export default router;