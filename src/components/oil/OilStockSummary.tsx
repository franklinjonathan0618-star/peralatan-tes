
import React from 'react';
import { Droplets, Download, Upload } from 'lucide-react';
import { OliTransaction } from '../../types/oil';

interface OilStockSummaryProps {
  transactions: OliTransaction[];
  currentStock?: number;
}

const OilStockSummary: React.FC<OilStockSummaryProps> = ({ transactions, currentStock }) => {
  const totalPembelian = transactions
    .filter(item => item.jenis === 'pembelian')
    .reduce((sum, item) => sum + item.volume, 0);
    
  const totalSisaStock = transactions
    .filter(item => item.jenis === 'sisa_stock')
    .reduce((sum, item) => sum + item.volume, 0);

  const totalPemakaian = transactions
    .filter(item => item.jenis === 'pemakaian')
    .reduce((sum, item) => sum + item.volume, 0);
    
  const calculatedStock = (totalPembelian + totalSisaStock) - totalPemakaian;
  const displayStock = currentStock !== undefined ? currentStock : calculatedStock;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="glass-card p-6 flex items-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
          <Droplets size={24} className="text-green-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Stock Oli</p>
          <p className="text-2xl font-bold">{displayStock.toLocaleString('id-ID')} Liter</p>
        </div>
      </div>
      
      <div className="glass-card p-6 flex items-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
          <Download size={24} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Pembelian</p>
          <p className="text-2xl font-bold">{totalPembelian.toLocaleString('id-ID')} Liter</p>
        </div>
      </div>
      
      <div className="glass-card p-6 flex items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
          <Upload size={24} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Pemakaian</p>
          <p className="text-2xl font-bold">{totalPemakaian.toLocaleString('id-ID')} Liter</p>
        </div>
      </div>
    </div>
  );
};

export default OilStockSummary;
