import ProductReceipt from '../models/ProductReceipt.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';

// Obtener todas las recepciones
export const getReceipts = async (req, res) => {
  try {
    const { supplierId, purchaseOrderId, startDate, endDate } = req.query;
    
    const filter = {};
    if (supplierId) filter.supplierId = supplierId;
    if (purchaseOrderId) filter.purchaseOrderId = purchaseOrderId;
    if (startDate || endDate) {
      filter.receivedDate = {};
      if (startDate) filter.receivedDate.$gte = new Date(startDate);
      if (endDate) filter.receivedDate.$lte = new Date(endDate);
    }
    
    const receipts = await ProductReceipt.find(filter).sort({ receivedDate: -1 });
    
    res.json({
      success: true,
      data: receipts
    });
  } catch (error) {
    console.error('Error al obtener recepciones:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener recepciones' 
    });
  }
};

// Obtener recepción por ID
export const getReceiptById = async (req, res) => {
  try {
    const receipt = await ProductReceipt.findById(req.params.id);
    
    if (!receipt) {
      return res.status(404).json({ 
        success: false,
        message: 'Recepción no encontrada' 
      });
    }

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Error al obtener recepción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener recepción' 
    });
  }
};

// Crear recepción de productos
export const createReceipt = async (req, res) => {
  try {
    const { purchaseOrderId, items, notes } = req.body;
    
    // Buscar orden de compra
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada'
      });
    }

    // Generar número de recepción
    const receiptNumber = await ProductReceipt.generateReceiptNumber();
    
    // Calcular discrepancias
    const discrepancies = [];
    let isPartial = false;
    
    for (const item of items) {
      if (item.quantityReceived !== item.quantityOrdered) {
        discrepancies.push({
          productId: item.productId,
          productName: item.productName,
          expected: item.quantityOrdered,
          received: item.quantityReceived,
          difference: item.quantityReceived - item.quantityOrdered,
          reason: item.notes || 'Sin especificar'
        });
        
        if (item.quantityReceived < item.quantityOrdered) {
          isPartial = true;
        }
      }
    }
    
    const receiptData = {
      receiptNumber,
      purchaseOrderId,
      orderNumber: purchaseOrder.orderNumber,
      supplierId: purchaseOrder.supplierId,
      supplierName: purchaseOrder.supplierName,
      items,
      receivedBy: req.userId,
      receivedByName: req.user.fullName,
      notes,
      status: isPartial ? 'partial' : 'complete',
      discrepancies
    };
    
    const receipt = await ProductReceipt.create(receiptData);

    // Actualizar stock de productos
    for (const item of items) {
      if (item.quantityReceived > 0) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantityReceived } }
        );
      }
    }

    // Actualizar status de orden de compra
    purchaseOrder.status = 'received';
    purchaseOrder.receivedAt = new Date();
    await purchaseOrder.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'product_receipt_created',
      module: 'purchases',
      description: `Recepción creada: ${receipt.receiptNumber} - Orden ${purchaseOrder.orderNumber}`,
      details: { 
        receiptId: receipt._id,
        receiptNumber: receipt.receiptNumber,
        orderId: purchaseOrder._id,
        itemsCount: items.length,
        hasDiscrepancies: discrepancies.length > 0
      },
      ipAddress: req.ip,
      success: true
    });

    res.status(201).json({
      success: true,
      data: receipt,
      message: 'Recepción creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear recepción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear recepción' 
    });
  }
};

// Actualizar recepción
export const updateReceipt = async (req, res) => {
  try {
    const receipt = await ProductReceipt.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!receipt) {
      return res.status(404).json({ 
        success: false,
        message: 'Recepción no encontrada' 
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'product_receipt_updated',
      module: 'purchases',
      description: `Recepción actualizada: ${receipt.receiptNumber}`,
      details: { receiptId: receipt._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      data: receipt,
      message: 'Recepción actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar recepción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar recepción' 
    });
  }
};

// Eliminar recepción
export const deleteReceipt = async (req, res) => {
  try {
    const receipt = await ProductReceipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ 
        success: false,
        message: 'Recepción no encontrada' 
      });
    }

    // Revertir stock de productos
    for (const item of receipt.items) {
      if (item.quantityReceived > 0) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantityReceived } }
        );
      }
    }

    await ProductReceipt.findByIdAndDelete(req.params.id);

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'product_receipt_deleted',
      module: 'purchases',
      description: `Recepción eliminada: ${receipt.receiptNumber}`,
      details: { receiptId: receipt._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      message: 'Recepción eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar recepción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar recepción' 
    });
  }
};
