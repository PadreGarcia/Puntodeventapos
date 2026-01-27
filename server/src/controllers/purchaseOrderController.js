import PurchaseOrder from '../models/PurchaseOrder.js';
import AuditLog from '../models/AuditLog.js';

// Obtener todas las órdenes de compra
export const getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplierId, startDate, endDate } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await PurchaseOrder.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener órdenes de compra' 
    });
  }
};

// Obtener orden por ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden de compra no encontrada' 
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener orden de compra' 
    });
  }
};

// Crear orden de compra
export const createPurchaseOrder = async (req, res) => {
  try {
    // Generar número de orden
    const orderNumber = await PurchaseOrder.generateOrderNumber();
    
    const orderData = {
      ...req.body,
      orderNumber,
      createdBy: req.userId,
      createdByName: req.user.fullName
    };
    
    const order = await PurchaseOrder.create(orderData);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'purchase_order_created',
      module: 'purchases',
      description: `Orden de compra creada: ${order.orderNumber} - ${order.supplierName}`,
      details: { 
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Orden de compra creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear orden de compra' 
    });
  }
};

// Actualizar orden de compra
export const updatePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden de compra no encontrada' 
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'purchase_order_updated',
      module: 'purchases',
      description: `Orden de compra actualizada: ${order.orderNumber}`,
      details: { orderId: order._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: order,
      message: 'Orden de compra actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar orden de compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar orden de compra' 
    });
  }
};

// Cambiar status de orden
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden de compra no encontrada' 
      });
    }

    const previousStatus = order.status;
    order.status = status;

    // Actualizar campos según el status
    if (status === 'sent' && !order.sentAt) {
      order.sentAt = new Date();
    }
    if (status === 'approved') {
      order.approvedAt = new Date();
      order.approvedBy = req.userId;
    }
    if (status === 'received') {
      order.receivedAt = new Date();
    }

    await order.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'purchase_order_status_changed',
      module: 'purchases',
      description: `Status de orden ${order.orderNumber} cambió de ${previousStatus} a ${status}`,
      details: { 
        orderId: order._id,
        previousStatus,
        newStatus: status
      },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: order,
      message: `Orden ${status === 'sent' ? 'enviada' : status === 'approved' ? 'aprobada' : 'actualizada'} exitosamente`
    });
  } catch (error) {
    console.error('Error al actualizar status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar status' 
    });
  }
};

// Eliminar orden de compra
export const deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden de compra no encontrada' 
      });
    }

    // Solo permitir eliminar si está en draft o cancelled
    if (order.status !== 'draft' && order.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar órdenes en borrador o canceladas'
      });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'purchase_order_deleted',
      module: 'purchases',
      description: `Orden de compra eliminada: ${order.orderNumber}`,
      details: { orderId: order._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      message: 'Orden de compra eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar orden de compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar orden de compra' 
    });
  }
};
