import { useState } from 'react';
import { usePOS } from '@/app/contexts/POSContext';
import { PaymentModal } from './PaymentModal';
import type { PaymentMethod, Customer, Sale } from '@/types/pos';

interface PaymentModalWithAPIProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sale: Sale) => void;
  TAX_RATE?: number;
}

export function PaymentModalWithAPI({ 
  isOpen, 
  onClose, 
  onSuccess,
  TAX_RATE = 0.16 
}: PaymentModalWithAPIProps) {
  const { cartItems, customers, createSale } = usePOS();
  const [isProcessing, setIsProcessing] = useState(false);

  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleCompleteSale = async (
    method: PaymentMethod,
    amountReceived?: number,
    change?: number,
    customer?: Customer
  ) => {
    setIsProcessing(true);

    try {
      // Calcular puntos de lealtad
      const loyaltyPointsEarned = customer ? Math.floor(total / 10) : 0;

      // Preparar datos de la venta para el backend
      const saleData: Partial<Sale> = {
        items: cartItems,
        subtotal,
        tax,
        total,
        paymentMethod: method,
        amountReceived,
        change,
        customerId: customer?.id,
        customerName: customer?.name,
        nfcCardId: customer?.nfcCardId,
        loyaltyPointsEarned,
        date: new Date(),
        timestamp: new Date(),
      };

      // Crear venta en el backend
      const createdSale = await createSale(saleData);

      if (createdSale) {
        onSuccess(createdSale);
      }
    } catch (error) {
      console.error('Error al procesar la venta:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PaymentModal
      isOpen={isOpen}
      total={total}
      onClose={onClose}
      onComplete={handleCompleteSale}
      customers={customers}
    />
  );
}
