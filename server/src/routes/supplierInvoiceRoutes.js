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

// POST /api/invoices - Crear factura (admin, supervisor)
router.post('/', authorize(['admin', 'supervisor']), createInvoice);

// PUT /api/invoices/:id - Actualizar factura (admin, supervisor)
router.put('/:id', authorize(['admin', 'supervisor']), updateInvoice);

// POST /api/invoices/:id/payment - Registrar pago (admin, supervisor)
router.post('/:id/payment', authorize(['admin', 'supervisor']), recordPayment);

// DELETE /api/invoices/:id - Eliminar factura (solo admin)
router.delete('/:id', authorize(['admin']), deleteInvoice);

export default router;
