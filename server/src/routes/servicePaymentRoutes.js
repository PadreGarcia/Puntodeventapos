import express from 'express';
import * as servicePaymentController from '../controllers/servicePaymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// ==========================================
// RUTAS DE PROVEEDORES
// ==========================================

// GET /api/services/providers - Obtener todos los proveedores
router.get('/providers', servicePaymentController.getAllProviders);

// GET /api/services/providers/:id - Obtener proveedor por ID
router.get('/providers/:id', servicePaymentController.getProviderById);

// POST /api/services/providers - Crear proveedor (Solo Admin)
router.post('/providers', authorize('admin'), servicePaymentController.createProvider);

// PUT /api/services/providers/:id - Actualizar proveedor (Admin/Supervisor)
router.put('/providers/:id', authorize('admin', 'supervisor'), servicePaymentController.updateProvider);

// ==========================================
// RUTAS DE PAGOS - ESPECÍFICAS PRIMERO
// ==========================================

// GET /api/services/stats/daily - Estadísticas del día
router.get('/stats/daily', servicePaymentController.getDailyStats);

// GET /api/services/stats/commissions - Reporte de comisiones
router.get('/stats/commissions', servicePaymentController.getCommissionsReport);

// GET /api/services/code/:code - Obtener pago por código
router.get('/code/:code', servicePaymentController.getPaymentByCode);

// GET /api/services/reference/:reference - Historial por referencia
router.get('/reference/:reference', servicePaymentController.getPaymentsByReference);

// POST /api/services/validate-reference - Validar referencia
router.post('/validate-reference', servicePaymentController.validateReference);

// ==========================================
// RUTAS DE PAGOS - CRUD BÁSICO
// ==========================================

// POST /api/services - Procesar pago de servicio (Todos)
router.post('/', servicePaymentController.createServicePayment);

// GET /api/services - Obtener todos los pagos
router.get('/', servicePaymentController.getAllPayments);

// GET /api/services/:id - Obtener pago por ID
router.get('/:id', servicePaymentController.getPaymentById);

// DELETE /api/services/:id - Cancelar pago (Admin/Supervisor)
router.delete('/:id', authorize('admin', 'supervisor'), servicePaymentController.cancelPayment);

export default router;
