
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { OliTransaction } from '../../types/oil';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center'
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableColHeader: {
    width: '16.6%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCol: {
    width: '16.6%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 12,
    fontWeight: 'bold'
  },
  tableCell: {
    margin: 5,
    fontSize: 10
  }
});

interface OilPDFDocumentProps {
  transactions: OliTransaction[];
  oilType: string;
}

const OilPDFDocument: React.FC<OilPDFDocumentProps> = ({ transactions, oilType }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Laporan Stock {oilType}</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Tanggal</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Jenis</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Volume</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Harga</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Keterangan</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Lokasi Proyek</Text>
          </View>
        </View>
        {transactions.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{format(new Date(item.tanggal), 'dd/MM/yyyy')}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.jenis}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.volume}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.hargaPembelian || '-'}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.keterangan}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.lokasiProyek || '-'}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default OilPDFDocument;
