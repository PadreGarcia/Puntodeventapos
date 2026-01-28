import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';

// Obtener todos los productos
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    // Mapear _id a id para compatibilidad con frontend
    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      id: product._id.toString()
    }));
    
    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener productos' 
    });
  }
};

// Obtener producto por ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Mapear _id a id para compatibilidad con frontend
    const formattedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    };

    res.json({
      success: true,
      data: formattedProduct
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener producto' 
    });
  }
};

// Buscar producto por código de barras
export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode });
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Mapear _id a id para compatibilidad con frontend
    const formattedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    };

    res.json({
      success: true,
      data: formattedProduct
    });
  } catch (error) {
    console.error('Error al buscar producto:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar producto' 
    });
  }
};

// Crear producto
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Auditoría - solo si hay usuario autenticado
    if (req.userId && req.user) {
      await AuditLog.create({
        userId: req.userId,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'product_created',
        module: 'products',
        description: `Producto creado: ${product.name}`,
        details: { productId: product._id },
        ipAddress: req.ip,
        success: true
      });
    }

    // Mapear _id a id para compatibilidad con frontend
    const formattedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    };

    res.status(201).json({
      success: true,
      data: formattedProduct,
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    
    // Validación de errores de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors: errors 
      });
    }
    
    // Código de barras duplicado
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'El código de barras ya existe' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Auditoría - solo si hay usuario autenticado
    if (req.userId && req.user) {
      await AuditLog.create({
        userId: req.userId,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'product_updated',
        module: 'products',
        description: `Producto actualizado: ${product.name}`,
        details: { productId: product._id },
        ipAddress: req.ip,
        success: true
      });
    }

    // Mapear _id a id para compatibilidad con frontend
    const formattedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    };

    res.json({
      success: true,
      data: formattedProduct,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors: errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'El código de barras ya existe' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// Eliminar producto
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'product_deleted',
      module: 'products',
      description: `Producto eliminado: ${product.name}`,
      details: { productId: product._id },
      ipAddress: req.ip,
      success: true
    });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar producto' 
    });
  }
};

// Ajustar inventario
export const adjustInventory = async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    const previousStock = product.stock;
    product.stock += adjustment;
    
    if (product.stock < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'El stock no puede ser negativo' 
      });
    }

    await product.save();

    // Auditoría
    await AuditLog.create({
      userId: req.userId,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'inventory_adjusted',
      module: 'inventory',
      description: `Inventario ajustado: ${product.name} - ${adjustment > 0 ? '+' : ''}${adjustment} unidades`,
      details: { 
        productId: product._id,
        previousStock,
        newStock: product.stock,
        adjustment,
        reason
      },
      ipAddress: req.ip,
      success: true
    });

    // Mapear _id a id para compatibilidad con frontend
    const formattedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    };

    res.json({
      success: true,
      data: formattedProduct,
      message: 'Inventario ajustado exitosamente'
    });
  } catch (error) {
    console.error('Error al ajustar inventario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al ajustar inventario' 
    });
  }
};
