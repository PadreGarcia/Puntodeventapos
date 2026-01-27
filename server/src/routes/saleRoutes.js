import express from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  deleteSale
} from '../controllers/saleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Todas las rutas requieren autenticación

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.delete('/:id', authorize('admin', 'supervisor'), deleteSale);

export default router;
