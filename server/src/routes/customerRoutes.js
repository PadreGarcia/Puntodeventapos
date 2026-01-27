import express from 'express';
import {
  getCustomers,
  getCustomerById,
  getCustomerByNFC,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  updateCreditLimit,
  getCustomerProfile,
  searchCustomers,
  getCustomerStats
} from '../controllers/customerController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken); // Todas las rutas requieren autenticación

// ==================== BÚSQUEDA Y ESTADÍSTICAS ====================

// GET /api/customers/search - Búsqueda avanzada
router.get('/search', searchCustomers);

// GET /api/customers/stats - Estadísticas
router.get('/stats', getCustomerStats);

// ==================== CLIENTES ====================

// GET /api/customers - Listar todos
router.get('/', getCustomers);

// GET /api/customers/nfc/:nfcId - Buscar por NFC
router.get('/nfc/:nfcId', getCustomerByNFC);

// GET /api/customers/:id/profile - Perfil completo
router.get('/:id/profile', getCustomerProfile);

// GET /api/customers/:id - Obtener por ID
router.get('/:id', getCustomerById);

// POST /api/customers - Crear cliente
router.post('/', createCustomer);

// PUT /api/customers/:id - Actualizar cliente
router.put('/:id', updateCustomer);

// DELETE /api/customers/:id - Eliminar cliente
router.delete('/:id', authorize(['admin']), deleteCustomer);

// ==================== LEALTAD ====================

// POST /api/customers/:id/loyalty/add - Agregar puntos
router.post('/:id/loyalty/add', addLoyaltyPoints);

// POST /api/customers/:id/loyalty/redeem - Canjear puntos
router.post('/:id/loyalty/redeem', redeemLoyaltyPoints);

// ==================== CRÉDITO ====================

// PATCH /api/customers/:id/credit - Actualizar límite de crédito
router.patch('/:id/credit', authorize(['admin', 'supervisor']), updateCreditLimit);

export default router;
