import express from 'express';
import {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustInventory
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Todas las rutas requieren autenticación

// ==========================================
// RUTAS ESPECÍFICAS (ANTES DE /:id)
// ==========================================
router.get('/barcode/:barcode', getProductByBarcode);

// ==========================================
// RUTAS CRUD BÁSICAS
// ==========================================
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('admin', 'supervisor'), createProduct);
router.put('/:id', authorize('admin', 'supervisor'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);
router.patch('/:id/inventory', authorize('admin', 'supervisor'), adjustInventory);

export default router;
