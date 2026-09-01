import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Legend, Tooltip } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { useAllOliTransactions } from "@/hooks/useAllOliTransactions";
import { useOliStocks } from "@/hooks/useOliStocks";
import { parseMySQLDate } from "@/utils/dateUtils";

interface MonthlyData {
  month: string;
  pembelian: number;
  pemakaian: number;
  sisaStock: number;
}

const chartConfig = {
  pembelian: {
    label: "Pembelian",
    color: "hsl(20, 80%, 55%)",
    lightColor: "hsl(20, 80%, 75%)",
  },
  pemakaian: {
    label: "Pemakaian",
    color: "hsl(340, 70%, 55%)",
    lightColor: "hsl(340, 70%, 75%)",
  },
  sisaStock: {
    label: "Sisa Stock",
    color: "hsl(120, 60%, 45%)",
    lightColor: "hsl(120, 60%, 75%)",
  },
};

export function OilChart90() {
  const { data: allTransactions } = useAllOliTransactions();
  const { data: oliStocks = [] } = useOliStocks();

  const monthlyData = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return [];

    const normalizeOilType = (value: string): string =>
      value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetType = normalizeOilType("Oli SAE 90");

    // Sort transactions by date
    const sortedTransactions = [...allTransactions]
      .filter(
        (item) =>
          normalizeOilType(item.oilTypeId || item.oilTypeName || "") ===
          targetType,
      )
      .sort((a, b) => {
        const dateA = parseMySQLDate(a.tanggal)?.getTime() || 0;
        const dateB = parseMySQLDate(b.tanggal)?.getTime() || 0;
        return dateA - dateB;
      });

    // Get last 6 months
    const months: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(startOfMonth(subMonths(new Date(), i)));
    }

    const firstMonthStart = startOfMonth(subMonths(new Date(), 5));
    const openingStock = sortedTransactions
      .filter((item) => {
        const date = parseMySQLDate(item.tanggal);
        return date && date < firstMonthStart;
      })
      .reduce((stock, item) => {
        if (item.jenis === "pembelian" || item.jenis === "sisa_stock") {
          return stock + item.volume;
        } else if (item.jenis === "pemakaian") {
          return stock - item.volume;
        }
        return stock;
      }, 0);

    let runningStock = Math.max(0, openingStock);
    const result: MonthlyData[] = [];

    months.forEach((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Filter transactions for this month
      const monthlyTransactions = sortedTransactions.filter((item) => {
        const date = parseMySQLDate(item.tanggal);
        return date && date >= monthStart && date <= monthEnd;
      });

      // Process transactions in chronological order
      let monthlyPembelian = 0;
      let monthlyPemakaian = 0;

      monthlyTransactions.forEach((item) => {
        if (item.jenis === "pembelian") {
          monthlyPembelian += item.volume;
          runningStock += item.volume;
        } else if (item.jenis === "sisa_stock") {
          runningStock += item.volume;
        } else if (item.jenis === "pemakaian") {
          monthlyPemakaian += item.volume;
          runningStock -= item.volume;
        }
      });

      result.push({
        month: format(month, "MMM yyyy", { locale: id }),
        pembelian: Math.round(monthlyPembelian),
        pemakaian: Math.round(monthlyPemakaian),
        sisaStock: Math.max(0, Math.round(runningStock)),
      });
    });

    return result;
  }, [allTransactions, oliStocks]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Grafik Oli 90</CardTitle>
        <CardDescription className="text-sm">
          Pembelian vs pemakaian Oli 90
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            data={monthlyData}
            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-sans)",
              }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-sans)",
              }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={35}
              tickFormatter={(value) => `${value}L`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;

                return (
                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800 mb-2">
                      {payload[0]?.payload.month}
                    </p>
                    <div className="space-y-1">
                      {payload.map((entry, index) => (
                        <div
                          key={`tooltip-${index}`}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-gray-600">
                              {entry.dataKey === "pembelian"
                                ? "Pembelian"
                                : entry.dataKey === "pemakaian"
                                  ? "Pemakaian"
                                  : "Sisa Stock"}{" "}
                              (L)
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {entry.value?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
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
              name="Sisa Stock (L)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
