import Supplier from '../models/Supplier.js';
import AuditLog from '../models/AuditLog.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener proveedores',
      error: error.message 
    });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    
    // Registrar en auditoría solo si hay usuario autenticado
    if (req.userId && req.user) {
      await AuditLog.create({
        userId: req.userId,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'supplier_created',
        module: 'suppliers',
        description: `Proveedor creado: ${supplier.name}`,
        details: { supplierId: supplier._id },
        ipAddress: req.ip,
        success: true
      });
    }

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    
    // Si es un error de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors: errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear proveedor',
      error: error.message 
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors: errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar proveedor',
      error: error.message 
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    
    res.json({ success: true, message: 'Proveedor eliminado', data: supplier });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar proveedor',
      error: error.message 
    });
  }
};
