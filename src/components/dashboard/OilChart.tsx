
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAllOliTransactions, OliTransaction } from '@/hooks/useAllOliTransactions';

const chartConfig = {
  pembelian: {
    label: "Pembelian",
    color: "hsl(160, 60%, 45%)",
  },
  pemakaian: {
    label: "Pemakaian",
    color: "hsl(30, 80%, 55%)",
  },
};

export function OilChart() {
  const { data: allTransactions } = useAllOliTransactions();

  const monthlyData = useMemo(() => {
    if (!allTransactions) return [];

    // Get last 6 months manually
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(startOfMonth(subMonths(new Date(), i)));
    }

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const pembelian = allTransactions
        .filter(item => {
          const date = new Date(item.tanggal);
          return item.jenis === 'pembelian' && date >= monthStart && date <= monthEnd;
        })
        .reduce((sum: number, item: OliTransaction) => sum + item.volume, 0);

      const pemakaian = allTransactions
        .filter(item => {
          const date = new Date(item.tanggal);
          return item.jenis === 'pemakaian' && date >= monthStart && date <= monthEnd;
        })
        .reduce((sum: number, item: OliTransaction) => sum + item.volume, 0);

      return {
        month: format(month, 'MMM yyyy', { locale: id }),
        pembelian: Math.round(pembelian),
        pemakaian: Math.round(pemakaian)
      };
    });
  }, [allTransactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Oli Bulanan</CardTitle>
        <CardDescription>
          Perbandingan pembelian vs pemakaian oli per bulan (semua jenis)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <div className="w-full h-[300px]">
            <BarChart 
              width={0} // Will be set by container
              height={0} // Will be set by container
              data={monthlyData}
              className="w-full h-full"
            >
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Legend />
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
            </BarChart>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
