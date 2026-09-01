
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend, Tooltip } from 'recharts';

import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const CustomTooltipContent = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    dataKey?: string | number;
    color?: string;
    name?: string;
    payload?: any;
  }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = entry.value ?? 0;
          const dataKey = String(entry.dataKey || '');
          return (
            <div key={`tooltip-${index}`} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color || '#000' }}
                />
                <span className="text-sm text-gray-600">
                  {dataKey === 'pembelian' ? 'Pembelian' : 
                   dataKey === 'pemakaian' ? 'Pemakaian' : 'Sisa Stock'} (L)
                </span>
              </div>
              <span className="font-medium text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : '0'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
import { id } from 'date-fns/locale';
import { useAllOliTransactions, type OliTransaction } from '@/hooks/useAllOliTransactions';
import { useOliStocks } from '@/hooks/useOliStocks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';



// Define the fetch function here since it's not exported from the hook
const fetchAllOliTransactions = async () => {
  const { data, error } = await supabase
    .from('oli_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

interface MonthlyData {
  month: string;
  pembelian: number;
  pemakaian: number;
  sisaStock: number;
}

const chartConfig = {
  pembelian: {
    label: "Pembelian",
    color: "hsl(200, 60%, 45%)",
    lightColor: "hsl(200, 60%, 75%)",
  },
  pemakaian: {
    label: "Pemakaian",
    color: "hsl(50, 80%, 55%)",
    lightColor: "hsl(50, 80%, 75%)",
  },
  sisaStock: {
    label: "Sisa Stock",
    color: "hsl(120, 60%, 45%)",
    lightColor: "hsl(120, 60%, 75%)",
  },
};

export function OilChart10() {
  // Use the hook to get the data
  const { data: allTransactions = [] } = useAllOliTransactions();
  const { data: oliStocks = [] } = useOliStocks();
  
  // Use a separate query for loading and error states
  const { isLoading, isError, error } = useQuery({
    queryKey: ['all-oli-transactions'],
    queryFn: fetchAllOliTransactions,
    enabled: false // We'll use the data from useAllOliTransactions
  });

  const monthlyData = useMemo<MonthlyData[]>(() => {
    if (isLoading) return [];
    
    if (isError) {
      console.error('Error loading oil transactions:', error);
      return [];
    }
    
    if (!allTransactions || allTransactions.length === 0) return [];

    // Sort transactions by date
    const sortedTransactions = [...allTransactions].sort((a, b) =>
      new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
    const normalizeOilType = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetType = normalizeOilType('Oli SAE 10');

    // Get last 6 months
    const months: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(startOfMonth(subMonths(new Date(), i)));
    }

    const firstMonthStart = startOfMonth(subMonths(new Date(), 5));
    const openingStock = sortedTransactions
      .filter((item: OliTransaction) => {
        const itemType = normalizeOilType(item.oilTypeId || item.oilTypeName || '');
        return itemType === targetType && new Date(item.tanggal) < firstMonthStart;
      })
      .reduce((stock, item) => {
        if (item.jenis === 'pembelian' || item.jenis === 'sisa_stock') {
          return stock + item.volume;
        } else if (item.jenis === 'pemakaian') {
          return stock - item.volume;
        }
        return stock;
      }, 0);

    let runningStock = Math.max(0, openingStock);
    const result: MonthlyData[] = [];

    months.forEach(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Filter transactions for this month and Oli SAE 10
      const monthlyTransactions = sortedTransactions.filter((item: OliTransaction) => {
        const date = new Date(item.tanggal);
        const itemType = normalizeOilType(item.oilTypeId || item.oilTypeName || '');
        return itemType === targetType && date >= monthStart && date <= monthEnd;
      });

      // Process transactions in chronological order
      let monthlyPembelian = 0;
      let monthlyPemakaian = 0;

      monthlyTransactions.forEach(item => {
        if (item.jenis === 'pembelian') {
          monthlyPembelian += item.volume;
          runningStock += item.volume;
        } else if (item.jenis === 'sisa_stock') {
          runningStock += item.volume;
        } else if (item.jenis === 'pemakaian') {
          monthlyPemakaian += item.volume;
          runningStock -= item.volume;
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
  }, [allTransactions, isLoading, isError, error, oliStocks]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Grafik Oli 10</CardTitle>
          <CardDescription className="text-sm">
            Memuat data...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Grafik Oli 10</CardTitle>
          <CardDescription className="text-sm text-red-500">
            Gagal memuat data. Silakan muat ulang halaman.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Grafik Oli 10</CardTitle>
        <CardDescription className="text-sm">
          Pembelian vs pemakaian Oli 10
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 h-[300px]">
        <ChartContainer 
          config={chartConfig}
          className="h-full w-full"
        >
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
            <Tooltip content={<CustomTooltipContent />} />
            <Bar 
              dataKey="pembelian"
              fill={chartConfig.pembelian.color}
              radius={[2, 2, 0, 0]} 
              name="Pembelian (L)"
            />
            <Bar 
              dataKey="pemakaian" 
              fill={chartConfig.pemakaian.color}
              radius={[2, 2, 0, 0]} 
              name="Pemakaian (L)"
            />
            <Bar 
              dataKey="sisaStock" 
              fill={chartConfig.sisaStock.color}
              radius={[2, 2, 0, 0]} 
              name="Sisa Stock (L)"
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

