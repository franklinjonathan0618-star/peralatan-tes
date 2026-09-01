import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend, Tooltip } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useBBMTransactions, type BBMTransaction } from '@/hooks/useBBMTransactions';
import { useBBMStocks } from '@/hooks/useBBMStocks';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        <div className="space-y-1">
          {payload?.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900 ml-4">
                {Number(entry.value).toLocaleString('id-ID')} L
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const chartConfig = {
  pembelian: {
    label: "Pembelian",
    color: "hsl(210, 80%, 55%)",
  },
  pemakaian: {
    label: "Pemakaian",
    color: "hsl(340, 80%, 55%)",
  },
  sisaStock: {
    label: "Sisa Stok",
    color: "hsl(150, 80%, 40%)",
  },
};

interface MonthlyData {
  month: string;
  pembelian: number;
  pemakaian: number;
  sisaStock: number;
}

const BBMChart = () => {
  const { data: bbmData = [], isLoading: isLoadingTransactions } = useBBMTransactions();
  const { data: bbmStocks = [], isLoading: isLoadingStocks } = useBBMStocks();

  const bbmTypes = ['Dexlite', 'Pertalite', 'Pertamax', 'Pertamina Dex', 'Biosolar', 'HSD (BBM Alat Berat)'];
  const [selectedType, setSelectedType] = useState<string>('Dexlite');

  const monthlyData = useMemo<MonthlyData[]>(() => {
    if (isLoadingTransactions || isLoadingStocks) return [];

    // Get last 6 months
    const months: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(startOfMonth(subMonths(new Date(), i)));
    }

    // Sort transactions chronologically
    const sortedTransactions = [...bbmData].sort((a, b) =>
      new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    const firstMonthStart = startOfMonth(subMonths(new Date(), 5));
    
    // Calculate opening stock before the 6-month window
    const openingStock = sortedTransactions
      .filter((item: BBMTransaction) => {
        return item.jenisBBM === selectedType && new Date(item.tanggal) < firstMonthStart;
      })
      .reduce((stock, item) => {
        if (item.jenis === 'pembelian' || item.jenis === 'sisa_stock') {
          return stock + item.jumlah;
        } else if (item.jenis === 'pemakaian') {
          return stock - item.jumlah;
        }
        return stock;
      }, 0);

    let runningStock = Math.max(0, openingStock);
    const result: MonthlyData[] = [];

    months.forEach(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Filter transactions for this month and selected type
      const monthlyTransactions = sortedTransactions.filter((item: BBMTransaction) => {
        const date = new Date(item.tanggal);
        return item.jenisBBM === selectedType && date >= monthStart && date <= monthEnd;
      });

      let monthlyPembelian = 0;
      let monthlyPemakaian = 0;

      monthlyTransactions.forEach(item => {
        if (item.jenis === 'pembelian') {
          monthlyPembelian += item.jumlah;
          runningStock += item.jumlah;
        } else if (item.jenis === 'sisa_stock') {
          // Sisa stock dimasukkan pada bulan transaksi tersebut
          runningStock += item.jumlah;
        } else if (item.jenis === 'pemakaian') {
          monthlyPemakaian += item.jumlah;
          runningStock -= item.jumlah;
        }
      });

      result.push({
        month: format(month, 'MMM yyyy', { locale: id }),
        pembelian: Math.round(monthlyPembelian),
        pemakaian: Math.round(monthlyPemakaian),
        sisaStock: Math.max(0, Math.round(runningStock))
      });
    });

    return result;
  }, [bbmData, bbmStocks, selectedType, isLoadingTransactions, isLoadingStocks]);

  const isLoading = isLoadingTransactions || isLoadingStocks;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grafik BBM</CardTitle>
          <CardDescription>Pembelian dan Pemakaian BBM Bulanan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Grafik BBM ({selectedType})</CardTitle>
          <CardDescription className="text-sm">Pembelian vs pemakaian {selectedType}</CardDescription>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-sm border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {bbmTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="pt-0 h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="month" 
              tick={{ 
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))',
                fontFamily: 'var(--font-sans)'
              }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis 
              tick={{ 
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))',
                fontFamily: 'var(--font-sans)'
              }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={35}
              tickFormatter={(value) => `${value}L`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar
              dataKey="pembelian"
              fill={chartConfig.pembelian.color}
              name="Pembelian (L)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="pemakaian"
              fill={chartConfig.pemakaian.color}
              name="Pemakaian (L)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="sisaStock"
              fill={chartConfig.sisaStock.color}
              name="Sisa Stok (L)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default BBMChart;
