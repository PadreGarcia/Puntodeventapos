import express from 'express';
import * as rechargeController from '../controllers/rechargeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// ==========================================
// RUTAS DE OPERADORES
// ==========================================

// GET /api/recharges/carriers - Obtener todos los operadores
router.get('/carriers', rechargeController.getAllCarriers);

// POST /api/recharges/carriers - Crear operador (Solo Admin)
router.post('/carriers', authorize('admin'), rechargeController.createCarrier);

// PUT /api/recharges/carriers/:id - Actualizar operador (Admin/Supervisor)
router.put('/carriers/:id', authorize('admin', 'supervisor'), rechargeController.updateCarrier);

// ==========================================
// RUTAS DE PRODUCTOS
// ==========================================

// GET /api/recharges/products - Obtener productos
router.get('/products', rechargeController.getProducts);

// POST /api/recharges/products - Crear producto (Solo Admin)
router.post('/products', authorize('admin'), rechargeController.createProduct);

// PUT /api/recharges/products/:id - Actualizar producto (Admin/Supervisor)
router.put('/products/:id', authorize('admin', 'supervisor'), rechargeController.updateProduct);

// ==========================================
// RUTAS DE RECARGAS - ESPECÍFICAS PRIMERO
// ==========================================

// GET /api/recharges/stats/daily - Estadísticas del día
router.get('/stats/daily', rechargeController.getDailyStats);

// GET /api/recharges/code/:code - Obtener recarga por código
router.get('/code/:code', rechargeController.getRechargeByCode);

// GET /api/recharges/phone/:phoneNumber - Historial por número
router.get('/phone/:phoneNumber', rechargeController.getRechargesByPhone);

// POST /api/recharges/validate-phone - Validar número telefónico
router.post('/validate-phone', rechargeController.validatePhoneNumber);

// ==========================================
// RUTAS DE RECARGAS - CRUD BÁSICO
// ==========================================

// POST /api/recharges - Crear nueva recarga (Todos)
router.post('/', rechargeController.createRecharge);

// GET /api/recharges - Obtener todas las recargas
router.get('/', rechargeController.getAllRecharges);

// GET /api/recharges/:id - Obtener recarga por ID
router.get('/:id', rechargeController.getRechargeById);

// DELETE /api/recharges/:id - Cancelar recarga (Admin/Supervisor)
router.delete('/:id', authorize('admin', 'supervisor'), rechargeController.cancelRecharge);

export default router;
