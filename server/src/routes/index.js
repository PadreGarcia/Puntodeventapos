import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import saleRoutes from './saleRoutes.js';
import customerRoutes from './customerRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import auditRoutes from './auditRoutes.js';
import userRoutes from './userRoutes.js';
import purchaseOrderRoutes from './purchaseOrderRoutes.js';
import productReceiptRoutes from './productReceiptRoutes.js';
import supplierInvoiceRoutes from './supplierInvoiceRoutes.js';
import payableAccountRoutes from './payableAccountRoutes.js';
import cashRegisterRoutes from './cashRegisterRoutes.js';
import nfcCardRoutes from './nfcCardRoutes.js';
import accountReceivableRoutes from './accountReceivableRoutes.js';
import loanRoutes from './loanRoutes.js';
import promotionRoutes from './promotionRoutes.js';
import couponRoutes from './couponRoutes.js';
import rechargeRoutes from './rechargeRoutes.js';
import servicePaymentRoutes from './servicePaymentRoutes.js';

const router = express.Router();

// Health check mejorado
router.get('/health', async (req, res) => {
  try {
    // Verificar conexión a MongoDB
    const dbStatus = mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado';
    
    // Obtener estadísticas de colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionStats = {};
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      collectionStats[collection.name] = count;
    }
    
    res.json({ 
      success: true,
      message: 'API funcionando correctamente',
      timestamp: new Date(),
      version: '1.0.0',
      database: {
        status: dbStatus,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        collections: Object.keys(collectionStats).length,
        stats: collectionStats
      },
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado del sistema',
      error: error.message
    });
  }
});

// Rutas
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/audit', auditRoutes);
router.use('/users', userRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/receipts', productReceiptRoutes);
router.use('/invoices', supplierInvoiceRoutes);
router.use('/payables', payableAccountRoutes);
router.use('/cash', cashRegisterRoutes);
router.use('/nfc', nfcCardRoutes);
router.use('/receivables', accountReceivableRoutes);
router.use('/loans', loanRoutes);
router.use('/promotions', promotionRoutes);
router.use('/coupons', couponRoutes);
router.use('/recharges', rechargeRoutes);
router.use('/service-payments', servicePaymentRoutes);  // Cambiado de /services a /service-payments
router.use('/service-providers', serviceRoutes);        // service-providers para proveedores

export default router;
