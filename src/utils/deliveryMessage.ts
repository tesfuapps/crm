import type { ProductSale, Customer, ProductItem } from '../types/crm';

interface DeliveryMessageParams {
  sale: ProductSale;
  customer: Customer;
  product: ProductItem | undefined;
}

export function generateDeliveryMessage(params: DeliveryMessageParams): string {
  const { sale, customer, product } = params;
  const itemName = product ? product.itemName : 'Item';
  const qty = sale.quantity;
  const custName = customer.customerName;
  const companyName = customer.companyName ? ' (' + customer.companyName + ')' : '';
  const branchName = sale.branch_name;
  const dispatchShowroom = branchName || 'TTM Showroom';

  if (sale.fulfillment_type === 'pickup') {
    return (
      '📋 *TTM Pickup Notification*\n' +
      '\n' +
      'Hello ' + custName + companyName + ',\n' +
      '\n' +
      'Your order is ready for pickup at ' + dispatchShowroom + '.\n' +
      'Please bring your ID.\n' +
      '\n' +
      'Item: ' + itemName + ' × ' + qty + '\n' +
      '\n' +
      'Thank you for choosing TTM!'
    );
  }

  if (sale.delivery_scope === 'province') {
    return (
      '🚌 *TTM Bus Cargo Dispatch*\n' +
      '\n' +
      'Customer: ' + custName + companyName + '\n' +
      'Item: ' + itemName + ' × ' + qty + '\n' +
      '\n' +
      'Carrier: ' + (sale.carrier || 'N/A') + '\n' +
      'Ticket #: ' + (sale.ticketNumber || 'N/A') + '\n' +
      'Destination: ' + (sale.destinationCity || 'N/A') + '\n' +
      '\n' +
      'Please collect upon arrival. Thank you for choosing TTM!'
    );
  }

  if (sale.delivery_scope === 'addis_ababa') {
    if (sale.addis_delivery_type === 'own_delivery') {
      return (
        '📦 *TTM In-House Dispatch*\n' +
        '\n' +
        'Customer: ' + custName + companyName + '\n' +
        'Item: ' + itemName + ' × ' + qty + '\n' +
        '\n' +
        'Driver: ' + (sale.driver_name || 'N/A') + '\n' +
        'Phone: ' + (sale.driver_phone || 'N/A') + '\n' +
        'Vehicle: ' + (sale.vehicle_plate_number || 'N/A') + '\n' +
        'Dispatch Showroom: ' + dispatchShowroom + '\n' +
        '\n' +
        'Your order is on the way!'
      );
    }

    if (sale.addis_delivery_type === 'outsourced') {
      const feeStatus = sale.delivery_fee_paid_by === 'customer'
        ? 'Paid by customer'
        : 'Free delivery (TTM)';

      return (
        '🚗 *TTM Outsourced Delivery*\n' +
        '\n' +
        'Customer: ' + custName + companyName + '\n' +
        'Item: ' + itemName + ' × ' + qty + '\n' +
        '\n' +
        'Provider: ' + (sale.outsourced_provider || 'N/A') + '\n' +
        'Driver: ' + (sale.driver_name || 'N/A') + '\n' +
        'Phone: ' + (sale.driver_phone || 'N/A') + '\n' +
        'Vehicle: ' + (sale.vehicle_plate_number || 'N/A') + '\n' +
        'Delivery Fee: ' + feeStatus + '\n' +
        '\n' +
        'Please keep your phone ready for arrival!'
      );
    }
  }

  return 'Delivery message could not be generated. Please check the delivery details.';
}
