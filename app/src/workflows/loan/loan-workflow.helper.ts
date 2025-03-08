import { ProductEntity } from "../../repositories/models/product-models";

/**
 * Get appropriate icon based on loan product type
 */
export function getProductIcon(product: ProductEntity | null): string {
  if (!product) return '💰';
  
  const id = product.id.toLowerCase();
  
  if (id.includes('personal')) return '👤';
  if (id.includes('home') || id.includes('mortgage')) return '🏠';
  if (id.includes('vehicle') || id.includes('auto') || id.includes('car')) return '🚗';
  if (id.includes('education') || id.includes('student')) return '🎓';
  if (id.includes('business')) return '💼';
  
  return '💰'; // Default icon
}

/**
 * Get user-friendly interest rate display text from product
 */
export function getInterestRateDisplay(product: ProductEntity | null): string {
  if (!product) return '';
  
  if (product.metadata?.minRate && product.metadata?.maxRate) {
    return `${product.metadata.minRate}% - ${product.metadata.maxRate}% APR`;
  }
  
  if (product.metadata?.baseRate) {
    return `From ${product.metadata.baseRate}% APR`;
  }
  
  // Default rates based on product type identification
  const id = product.id.toLowerCase();
  
  if (id.includes('personal')) return '5.99% - 15.99% APR';
  if (id.includes('home') || id.includes('mortgage')) return '3.49% - 5.99% APR';
  if (id.includes('vehicle') || id.includes('auto')) return '4.25% - 8.99% APR';
  if (id.includes('education') || id.includes('student')) return '3.99% - 7.99% APR';
  if (id.includes('business')) return '6.75% - 12.99% APR';
  
  return 'Competitive rates available';
}
