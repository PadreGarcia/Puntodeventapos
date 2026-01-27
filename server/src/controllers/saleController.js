import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import CashRegister from '../models/CashRegister.js';
import AuditLog from '../models/AuditLog.js';

// Crear venta
export const createSale = async (req, res) => {
  try {
    const saleData = req.body;

    // Verificar stock antes de crear la venta
    for (const item of saleData.items) {
      const product = await Product.findById(item.product.id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Producto ${item.product.name} no encontrado`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}`
        });
      }
    }

    // Crear la venta
    const sale = await Sale.create(saleData);

    // Actualizar stock de productos
    for (const item of saleData.items) {
      await Product.findByIdAndUpdate(
        item.product.id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Actualizar información del cliente si existe
    if (saleData.customerId) {
      const updateData = {
        $inc: {
          totalPurchases: 1,
          purchaseCount: 1,
          totalSpent: saleData.total
        },
        lastPurchase: new Date()
      };

      if (saleData.loyaltyPointsEarned) {
        updateData.$inc.loyaltyPoints = saleData.loyaltyPointsEarned;
      }

      await Customer.findByIdAndUpdate(saleData.customerId, updateData);
    }

    // Actualizar caja registradora si hay una abierta
    const cashRegister = await CashRegister.findOne({
      status: 'open',
      openedBy: req.userId
    });

    if (cashRegister) {
      cashRegister.salesCount += 1;
      
      if (saleData.paymentMethod === 'cash') {
        cashRegister.salesCash += saleData.total;
      } else if (saleData.paymentMethod === 'card') {
        cashRegister.salesCard += saleData.total;
      } else if (saleData.paymentMethod === 'transfer') {
        cashRegister.salesTransfer += saleData.total;
      }

      await cashRegister.save();
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'sale_created',
      module: 'pos',
      description: `Venta realizada por $${saleData.total.toFixed(2)} - ${saleData.paymentMethod} - ${saleData.items.length} artículos`,
      details: { 
        saleId: sale._id,
        total: saleData.total,
        items: saleData.items.length
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: sale,
      message: 'Venta registrada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la venta'
    });
  }
};

// Obtener todas las ventas
export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    const sales = await Sale.find(filter)
      .sort({ date: -1 })
      .limit(1000);

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas'
    });
  }
};

// Obtener venta por ID
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta'
    });
  }
};

// Cancelar venta (eliminar)
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Devolver stock a los productos
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product.id,
        { $inc: { stock: item.quantity } }
      );
    }

    // Actualizar información del cliente si existe
    if (sale.customerId) {
      const updateData = {
        $inc: {
          totalPurchases: -1,
          purchaseCount: -1,
          totalSpent: -sale.total
        }
      };

      if (sale.loyaltyPointsEarned) {
        updateData.$inc.loyaltyPoints = -sale.loyaltyPointsEarned;
      }

      await Customer.findByIdAndUpdate(sale.customerId, updateData);
    }

    await Sale.findByIdAndDelete(req.params.id);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'sale_deleted',
      module: 'pos',
      description: `Venta cancelada: $${sale.total.toFixed(2)}`,
      details: { saleId: sale._id },
      ipAddress: req.ip,
      success: true,
      criticality: 'warning'
    });

    res.json({
      success: true,
      message: 'Venta cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar venta'
    });
  }
};
