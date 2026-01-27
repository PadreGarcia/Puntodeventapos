import express from 'express';
import { createServicePayment, getServicePayments } from '../controllers/serviceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getServicePayments);
router.post('/', createServicePayment);

export default router;
