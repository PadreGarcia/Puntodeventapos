import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSuppliers);
router.post('/', createSupplier); // Todos los usuarios autenticados pueden crear
router.put('/:id', updateSupplier); // Todos los usuarios autenticados pueden actualizar
router.delete('/:id', authorize('admin', 'supervisor'), deleteSupplier); // Solo admin y supervisor pueden eliminar

export default router;
