import { useCallback } from 'react';
import { supabase } from '@/integrations/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from './useSubscription';
import { withTimeout } from '@/utils/withTimeout';
import { DEMO_MODE } from '@/contexts/AuthContext';

// Type assertion for supabase client
const typedSupabase = supabase as any;

// Mock oil transaction data for offline mode
const MOCK_OLI_DATA: OliTransaction[] = [
  {
    id: '1',
    tanggal: '2025-02-01',
    jenis: 'pembelian',
    volume: 500,
    hargaPembelian: 50000,
    totalHarga: 25000000,
    keterangan: 'Pembelian oli SAE 40',
    oilTypeId: 'Oli SAE 40',
    oilTypeName: 'SAE 40',
    lokasiProyek: 'Proyek A'
  },
  {
    id: '2',
    tanggal: '2025-02-02',
    jenis: 'pemakaian',
    volume: 50,
    hargaPembelian: 50000,
    totalHarga: 2500000,
    keterangan: 'Pemakaian oli SAE 40 pada CAT 320',
    oilTypeId: 'Oli SAE 40',
    oilTypeName: 'SAE 40',
    lokasiProyek: 'Proyek A'
  },
  {
    id: '3',
    tanggal: '2025-01-28',
    jenis: 'pembelian',
    volume: 300,
    hargaPembelian: 45000,
    totalHarga: 13500000,
    keterangan: 'Pembelian oli SAE 10',
    oilTypeId: 'Oli SAE 10',
    oilTypeName: 'SAE 10',
    lokasiProyek: 'Proyek B'
  }
];

export interface OliTransaction {
  id: string;
  tanggal: string;
  jenis: 'pembelian' | 'pemakaian' | 'sisa_stock';
  volume: number;
  hargaPembelian: number;
  totalHarga: number;
  keterangan: string;
  oilTypeId: string;
  oilTypeName: string;
  lokasiProyek: string;
}

const fetchAllOliTransactions = async () => {
  if (DEMO_MODE) {
    return MOCK_OLI_DATA;
  }

  console.log('Fetching all oil transactions');
  try {
    // Wrap dengan 15 detik timeout untuk handle network delay
    const { data, error } = await withTimeout(
      Promise.resolve(typedSupabase
        .from('oli_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .then((r: any) => r)
      ),
      15000,
      'Oil Transactions Fetch'
    ) as any;

    if (error) throw error;

    // Map the data to our OliTransaction type and include oil type info
    return (data || []).map((item: any) => ({
      id: item.id,
      tanggal: item.tanggal,
      jenis: item.jenis,
      volume: Number(item.jumlah),
      hargaPembelian: Number(item.cost || 0),
      totalHarga: item.cost && item.jumlah ? Number(item.cost) * Number(item.jumlah) : 0,
      keterangan: item.keterangan || '',
      oilTypeId: item.jenis_oli,
      oilTypeName: item.jenis_oli,
      lokasiProyek: item.no_lambung || ''
    })) as OliTransaction[];
  } catch (err) {
    console.warn('Supabase oil transactions unavailable, using mock data', err);
    return MOCK_OLI_DATA;
  }
};

export const useAllOliTransactions = (options: Record<string, any> = {}) => {
  const queryClient = useQueryClient();
  
  // Use the custom subscription hook with debounce
  const handleChange = useCallback(() => {
    console.log('Invalidating oli_transactions query');
    queryClient.invalidateQueries({ 
      queryKey: ['all-oli-transactions']
    }).catch((error: Error) => {
      console.error('Error invalidating query:', error);
    });
  }, [queryClient]);

  // Only subscribe if we have data
  const { data: initialData } = useQuery<OliTransaction[]>({
    queryKey: ['all-oli-transactions'],
    queryFn: fetchAllOliTransactions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Fast-fail untuk mock data
    retryDelay: 500,
    ...options
  });

  // Only enable subscription after initial data load
  const shouldSubscribe = !!initialData;

  // Use subscription with error handling
  useSubscription({
    supabase: typedSupabase,
    table: 'oli_transactions',
    event: '*',
    callback: handleChange,
    options: {
      enabled: shouldSubscribe && !DEMO_MODE,
      onError: (error: Error) => {
        console.error('Subscription error for oli_transactions:', error);
        // Retry after delay
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['all-oli-transactions'] });
        }, 5000);
      }
    }
  });

  const transactionsByOilType = (initialData || []).reduce<Record<string, {
    oilTypeId: string;
    oilTypeName: string;
    transactions: OliTransaction[];
    totalVolume: number;
    totalPembelian: number;
    totalPemakaian: number;
    totalSisaStock: number;
  }>>((acc, transaction) => {
    if (!acc[transaction.oilTypeId]) {
      acc[transaction.oilTypeId] = {
        oilTypeId: transaction.oilTypeId,
        oilTypeName: transaction.oilTypeName,
        transactions: [],
        totalVolume: 0,
        totalPembelian: 0,
        totalPemakaian: 0,
        totalSisaStock: 0,
      };
    }
    
    acc[transaction.oilTypeId].transactions.push(transaction);
    
    if (transaction.jenis === 'pembelian') {
      acc[transaction.oilTypeId].totalPembelian += transaction.volume;
    } else if (transaction.jenis === 'sisa_stock') {
      acc[transaction.oilTypeId].totalSisaStock = (acc[transaction.oilTypeId].totalSisaStock || 0) + transaction.volume;
    } else {
      acc[transaction.oilTypeId].totalPemakaian += transaction.volume;
    }
    
    acc[transaction.oilTypeId].totalVolume = 
      (acc[transaction.oilTypeId].totalPembelian + (acc[transaction.oilTypeId].totalSisaStock || 0)) - 
      acc[transaction.oilTypeId].totalPemakaian;
    
    return acc;
  }, {});

  return {
    data: initialData || [],
    transactionsByOilType,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['all-oli-transactions'] })
  };
};

