import express from 'express';
import { getAuditLogs, createAuditLog } from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'supervisor'), getAuditLogs);
router.post('/', createAuditLog);

export default router;
