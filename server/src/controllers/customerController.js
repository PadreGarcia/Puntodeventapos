import Customer from '../models/Customer.js';
import NFCCard from '../models/NFCCard.js';
import AccountReceivable from '../models/AccountReceivable.js';
import Loan from '../models/Loan.js';
import AuditLog from '../models/AuditLog.js';

// Obtener todos los clientes
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes'
    });
  }
};

// Obtener cliente por ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente'
    });
  }
};

// Buscar cliente por NFC
export const getCustomerByNFC = async (req, res) => {
  try {
    const customer = await Customer.findOne({ nfcCardId: req.params.nfcId });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error al buscar cliente por NFC:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar cliente'
    });
  }
};

// Crear cliente
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'customer_created',
      module: 'customers',
      description: `Cliente creado: ${customer.name}`,
      details: { customerId: customer._id },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? 'El ID de tarjeta NFC ya existe' : 'Error al crear cliente'
    });
  }
};

// Actualizar cliente
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'customer_updated',
      module: 'customers',
      description: `Cliente actualizado: ${customer.name}`,
      details: { customerId: customer._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: customer,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente'
    });
  }
};

// Eliminar cliente
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'customer_deleted',
      module: 'customers',
      description: `Cliente eliminado: ${customer.name}`,
      details: { customerId: customer._id },
      ipAddress: req.ip,
      success: true,
      criticality: 'warning'
    });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente'
    });
  }
};

// Agregar puntos de lealtad
export const addLoyaltyPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    customer.loyaltyPoints += points;
    
    // Actualizar tier basado en puntos
    if (customer.loyaltyPoints >= 1000) customer.loyaltyTier = 'platinum';
    else if (customer.loyaltyPoints >= 500) customer.loyaltyTier = 'gold';
    else if (customer.loyaltyPoints >= 200) customer.loyaltyTier = 'silver';
    else customer.loyaltyTier = 'bronze';

    await customer.save();

    res.json({
      success: true,
      data: customer,
      message: 'Puntos agregados exitosamente'
    });
  } catch (error) {
    console.error('Error al agregar puntos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar puntos'
    });
  }
};

// Canjear puntos de lealtad
export const redeemLoyaltyPoints = async (req, res) => {
  try {
    const { points, description } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    if (customer.loyaltyPoints < points) {
      return res.status(400).json({
        success: false,
        message: 'Puntos insuficientes'
      });
    }

    customer.loyaltyPoints -= points;
    
    // Actualizar tier
    if (customer.loyaltyPoints >= 1000) customer.loyaltyTier = 'platinum';
    else if (customer.loyaltyPoints >= 500) customer.loyaltyTier = 'gold';
    else if (customer.loyaltyPoints >= 200) customer.loyaltyTier = 'silver';
    else customer.loyaltyTier = 'bronze';

    await customer.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'loyalty_points_redeemed',
      module: 'customers',
      description: `${customer.name} canjeó ${points} puntos - ${description}`,
      details: { 
        customerId: customer._id,
        pointsRedeemed: points,
        description
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: customer,
      message: 'Puntos canjeados exitosamente'
    });
  } catch (error) {
    console.error('Error al canjear puntos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al canjear puntos'
    });
  }
};

// Actualizar límite de crédito
export const updateCreditLimit = async (req, res) => {
  try {
    const { creditLimit, creditScore } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const previousLimit = customer.creditLimit;
    customer.creditLimit = creditLimit;
    
    if (creditScore !== undefined) {
      customer.creditScore = creditScore;
    }

    await customer.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'credit_limit_updated',
      module: 'customers',
      description: `Límite de crédito actualizado para ${customer.name}: $${previousLimit} → $${creditLimit}`,
      details: { 
        customerId: customer._id,
        previousLimit,
        newLimit: creditLimit,
        creditScore: customer.creditScore
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: customer,
      message: 'Límite de crédito actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar límite de crédito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar límite de crédito'
    });
  }
};

// Obtener perfil completo del cliente con historial
export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Obtener tarjeta NFC si existe
    let nfcCard = null;
    if (customer.nfcCardId) {
      nfcCard = await NFCCard.findOne({ cardId: customer.nfcCardId });
    }

    // Obtener cuentas por cobrar
    const receivables = await AccountReceivable.find({
      customerId: customer._id
    }).sort({ saleDate: -1 });

    // Obtener préstamos
    const loans = await Loan.find({
      customerId: customer._id
    }).sort({ startDate: -1 });

    // Calcular totales
    const totalDebt = receivables
      .filter(r => r.status !== 'paid' && r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.remainingAmount, 0);

    const totalLoans = loans
      .filter(l => l.status === 'active' || l.status === 'defaulted')
      .reduce((sum, l) => sum + l.remainingAmount, 0);

    const overdueReceivables = receivables.filter(r => r.status === 'overdue').length;
    const overdueLoans = loans.filter(l => l.status === 'defaulted').length;

    const profile = {
      customer,
      nfcCard,
      financial: {
        creditLimit: customer.creditLimit,
        currentCredit: customer.currentCredit,
        availableCredit: customer.creditLimit - customer.currentCredit,
        creditScore: customer.creditScore,
        totalDebt,
        totalLoans,
        totalOwed: totalDebt + totalLoans
      },
      loyalty: {
        points: customer.loyaltyPoints,
        tier: customer.loyaltyTier,
        tierBenefits: getTierBenefits(customer.loyaltyTier)
      },
      stats: {
        totalPurchases: customer.purchaseCount,
        totalSpent: customer.totalSpent,
        lastPurchase: customer.lastPurchase,
        overdueReceivables,
        overdueLoans
      },
      receivables: receivables.slice(0, 5), // Últimas 5
      loans: loans.slice(0, 3) // Últimos 3
    };

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error al obtener perfil del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del cliente'
    });
  }
};

// Buscar clientes con filtros avanzados
export const searchCustomers = async (req, res) => {
  try {
    const { 
      query, 
      loyaltyTier, 
      status, 
      hasNFC, 
      hasCredit,
      minPoints,
      maxPoints
    } = req.query;

    const filter = {};

    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { phone: new RegExp(query, 'i') },
        { nfcCardId: new RegExp(query, 'i') }
      ];
    }

    if (loyaltyTier) filter.loyaltyTier = loyaltyTier;
    if (status) filter.status = status;
    if (hasNFC === 'true') filter.nfcCardId = { $exists: true, $ne: null };
    if (hasCredit === 'true') filter.creditLimit = { $gt: 0 };
    if (minPoints) filter.loyaltyPoints = { $gte: parseInt(minPoints) };
    if (maxPoints) filter.loyaltyPoints = { ...filter.loyaltyPoints, $lte: parseInt(maxPoints) };

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar clientes'
    });
  }
};

// Obtener estadísticas de clientes
export const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    const withNFC = await Customer.countDocuments({ 
      nfcCardId: { $exists: true, $ne: null } 
    });
    
    const tierCounts = await Customer.aggregate([
      { $group: { _id: '$loyaltyTier', count: { $sum: 1 } } }
    ]);

    const topSpenders = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name totalSpent purchaseCount loyaltyTier');

    const stats = {
      total: totalCustomers,
      active: activeCustomers,
      inactive: totalCustomers - activeCustomers,
      withNFC,
      withoutNFC: totalCustomers - withNFC,
      tiers: {
        bronze: tierCounts.find(t => t._id === 'bronze')?.count || 0,
        silver: tierCounts.find(t => t._id === 'silver')?.count || 0,
        gold: tierCounts.find(t => t._id === 'gold')?.count || 0,
        platinum: tierCounts.find(t => t._id === 'platinum')?.count || 0
      },
      topSpenders
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Helper function para beneficios por tier
function getTierBenefits(tier) {
  const benefits = {
    bronze: {
      pointsMultiplier: 1,
      discount: 0,
      description: 'Nivel inicial - 1 punto por cada $10'
    },
    silver: {
      pointsMultiplier: 1.5,
      discount: 5,
      description: 'Nivel plata - 1.5 puntos por cada $10 + 5% descuento'
    },
    gold: {
      pointsMultiplier: 2,
      discount: 10,
      description: 'Nivel oro - 2 puntos por cada $10 + 10% descuento'
    },
    platinum: {
      pointsMultiplier: 3,
      discount: 15,
      description: 'Nivel platino - 3 puntos por cada $10 + 15% descuento'
    }
  };

  return benefits[tier] || benefits.bronze;
}
