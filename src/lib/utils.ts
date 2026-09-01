import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number to Rupiah currency
 * @param amount - The amount to format
 * @returns Formatted Rupiah string (e.g., "Rp 1.234.567")
 */
export function formatRupiah(amount: number | string): string {
  // Convert string to number if needed
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if the conversion resulted in a valid number
  if (isNaN(num)) return 'Rp 0';
  
  // Format the number with thousand separators
  return `Rp ${Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}
