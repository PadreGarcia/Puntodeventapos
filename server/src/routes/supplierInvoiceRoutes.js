import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  recordPayment,
  deleteInvoice,
  getOverdueInvoices
} from '../controllers/supplierInvoiceController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/invoices - Listar facturas
router.get('/', getInvoices);

// GET /api/invoices/overdue - Facturas vencidas
router.get('/overdue', getOverdueInvoices);

// GET /api/invoices/:id - Obtener factura por ID
router.get('/:id', getInvoiceById);

// POST /api/invoices - Crear factura (todos los usuarios autenticados)
router.post('/', createInvoice);

// PUT /api/invoices/:id - Actualizar factura (todos los usuarios autenticados)
router.put('/:id', updateInvoice);

// POST /api/invoices/:id/payment - Registrar pago (todos los usuarios autenticados)
router.post('/:id/payment', recordPayment);

// DELETE /api/invoices/:id - Eliminar factura (admin, supervisor)
router.delete('/:id', authorize('admin', 'supervisor'), deleteInvoice);

export default router;
