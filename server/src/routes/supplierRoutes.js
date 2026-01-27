import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSuppliers);
router.post('/', authorize('admin', 'supervisor'), createSupplier);
router.put('/:id', authorize('admin', 'supervisor'), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

export default router;
