export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      alat_berat: {
        Row: {
          created_at: string | null
          id: string
          kondisi: string
          last_service: string
          lokasi: string
          merk: string
          nama_alat: string
          next_service: string
          no_lambung: string
          no_seri: string | null
          operator: string
          tahun_pembuatan: string
          tipe: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kondisi: string
          last_service: string
          lokasi: string
          merk: string
          nama_alat: string
          next_service: string
          no_lambung: string
          no_seri?: string | null
          operator: string
          tahun_pembuatan: string
          tipe: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kondisi?: string
          last_service?: string
          lokasi?: string
          merk?: string
          nama_alat?: string
          next_service?: string
          no_lambung?: string
          no_seri?: string | null
          operator?: string
          tahun_pembuatan?: string
          tipe?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      alat_pendukung: {
        Row: {
          alamat: string
          created_at: string | null
          foto: string | null
          gambar: string | null
          id: string
          jenis_alat: string
          keterangan: string | null
          kode_nomor: string | null
          kondisi: string
          lat: number | null
          lng: number | null
          nama_alat: string
          updated_at: string | null
        }
        Insert: {
          alamat: string
          created_at?: string | null
          foto?: string | null
          gambar?: string | null
          id?: string
          jenis_alat: string
          keterangan?: string | null
          kode_nomor?: string | null
          kondisi: string
          lat?: number | null
          lng?: number | null
          nama_alat: string
          updated_at?: string | null
        }
        Update: {
          alamat?: string
          created_at?: string | null
          foto?: string | null
          gambar?: string | null
          id?: string
          jenis_alat?: string
          keterangan?: string | null
          kode_nomor?: string | null
          kondisi?: string
          lat?: number | null
          lng?: number | null
          nama_alat?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bbm_transactions: {
        Row: {
          created_at: string | null
          harga_per_liter: number | null
          id: string
          keterangan_pemakaian: string | null
          lokasi_proyek: string | null
          nama_alat_berat: string | null
          tanggal_pemakaian: string | null
          tanggal_pembelian: string | null
          updated_at: string | null
          volume_pemakaian: number | null
          volume_pembelian: number | null
        }
        Insert: {
          created_at?: string | null
          harga_per_liter?: number | null
          id?: string
          keterangan_pemakaian?: string | null
          lokasi_proyek?: string | null
          nama_alat_berat?: string | null
          tanggal_pemakaian?: string | null
          tanggal_pembelian?: string | null
          updated_at?: string | null
          volume_pemakaian?: number | null
          volume_pembelian?: number | null
        }
        Update: {
          created_at?: string | null
          harga_per_liter?: number | null
          id?: string
          keterangan_pemakaian?: string | null
          lokasi_proyek?: string | null
          nama_alat_berat?: string | null
          tanggal_pemakaian?: string | null
          tanggal_pembelian?: string | null
          updated_at?: string | null
          volume_pemakaian?: number | null
          volume_pembelian?: number | null
        }
        Relationships: []
      }
      kegiatan_mekanik: {
        Row: {
          created_at: string | null
          id: string
          keterangan: string | null
          lokasi_pekerjaan: string
          nama_alat: string | null
          nama_mekanik: string
          no_lambung: string
          no_ppa: string | null
          tanggal: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          keterangan?: string | null
          lokasi_pekerjaan: string
          nama_alat?: string | null
          nama_mekanik: string
          no_lambung: string
          no_ppa?: string | null
          tanggal: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          keterangan?: string | null
          lokasi_pekerjaan?: string
          nama_alat?: string | null
          nama_mekanik?: string
          no_lambung?: string
          no_ppa?: string | null
          tanggal?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      oli_transactions: {
        Row: {
          created_at: string | null
          harga_pembelian: number | null
          id: string
          jenis: string
          keterangan: string
          oil_type: string
          tanggal: string
          total_harga: number | null
          updated_at: string | null
          volume: number
        }
        Insert: {
          created_at?: string | null
          harga_pembelian?: number | null
          id?: string
          jenis: string
          keterangan: string
          oil_type: string
          tanggal: string
          total_harga?: number | null
          updated_at?: string | null
          volume: number
        }
        Update: {
          created_at?: string | null
          harga_pembelian?: number | null
          id?: string
          jenis?: string
          keterangan?: string
          oil_type?: string
          tanggal?: string
          total_harga?: number | null
          updated_at?: string | null
          volume?: number
        }
        Relationships: []
      }
      perbaikan: {
        Row: {
          created_at: string
          id: string
          items: Json
          jenis_kerusakan: string
          lokasi_perbaikan: string | null
          nama_alat: string
          no_lambung: string
          penyebab_kerusakan: string
          status: string
          tanggal: string
          teknisi: string
          tindakan_perbaikan: string
          total_biaya: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          jenis_kerusakan: string
          lokasi_perbaikan?: string | null
          nama_alat: string
          no_lambung: string
          penyebab_kerusakan: string
          status?: string
          tanggal: string
          teknisi: string
          tindakan_perbaikan: string
          total_biaya?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          jenis_kerusakan?: string
          lokasi_perbaikan?: string | null
          nama_alat?: string
          no_lambung?: string
          penyebab_kerusakan?: string
          status?: string
          tanggal?: string
          teknisi?: string
          tindakan_perbaikan?: string
          total_biaya?: number
          updated_at?: string
        }
        Relationships: []
      }
      ppa: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          kerusakan: string
          keterangan: string | null
          nama_alat: string
          no_lambung: string
          no_ppa: string
          status: string
          tanggal: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          kerusakan: string
          keterangan?: string | null
          nama_alat: string
          no_lambung: string
          no_ppa: string
          status?: string
          tanggal: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          kerusakan?: string
          keterangan?: string | null
          nama_alat?: string
          no_lambung?: string
          no_ppa?: string
          status?: string
          tanggal?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      rpa: {
        Row: {
          created_at: string | null
          id: string
          item_pekerjaan: string
          lokasi_proyek: string | null
          rpa_id: string
          tanggal: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_pekerjaan: string
          lokasi_proyek?: string | null
          rpa_id: string
          tanggal: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_pekerjaan?: string
          lokasi_proyek?: string | null
          rpa_id?: string
          tanggal?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rpa_details: {
        Row: {
          created_at: string | null
          id: string
          keterangan: string | null
          mulai_tanggal: string | null
          nama_alat: string
          rpa_id: string
          selesai_tanggal: string | null
          updated_at: string | null
          uraian_pekerjaan: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          keterangan?: string | null
          mulai_tanggal?: string | null
          nama_alat: string
          rpa_id: string
          selesai_tanggal?: string | null
          updated_at?: string | null
          uraian_pekerjaan?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          keterangan?: string | null
          mulai_tanggal?: string | null
          nama_alat?: string
          rpa_id?: string
          selesai_tanggal?: string | null
          updated_at?: string | null
          uraian_pekerjaan?: string | null
        }
        Relationships: []
      }
      sewa_alat: {
        Row: {
          biaya_per_hari: number
          created_at: string
          id: string
          lokasi_proyek: string
          nama_alat: string
          status: string
          tanggal_mulai: string
          tanggal_selesai: string
          total_biaya: number
          updated_at: string
          vendor: string
        }
        Insert: {
          biaya_per_hari?: number
          created_at?: string
          id?: string
          lokasi_proyek: string
          nama_alat: string
          status?: string
          tanggal_mulai: string
          tanggal_selesai: string
          total_biaya?: number
          updated_at?: string
          vendor: string
        }
        Update: {
          biaya_per_hari?: number
          created_at?: string
          id?: string
          lokasi_proyek?: string
          nama_alat?: string
          status?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          total_biaya?: number
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      sewa_alat_eksternal: {
        Row: {
          biaya_demobilisasi: number
          biaya_mobilisasi: number
          biaya_per_hari: number
          biaya_uang_makan_operator: number
          created_at: string
          id: string
          lokasi_proyek: string
          nama_alat: string
          status: string
          tanggal_mulai: string
          tanggal_selesai: string
          total_biaya: number
          updated_at: string
          vendor: string
        }
        Insert: {
          biaya_demobilisasi?: number
          biaya_mobilisasi?: number
          biaya_per_hari?: number
          biaya_uang_makan_operator?: number
          created_at?: string
          id?: string
          lokasi_proyek: string
          nama_alat: string
          status?: string
          tanggal_mulai: string
          tanggal_selesai: string
          total_biaya?: number
          updated_at?: string
          vendor: string
        }
        Update: {
          biaya_demobilisasi?: number
          biaya_mobilisasi?: number
          biaya_per_hari?: number
          biaya_uang_makan_operator?: number
          created_at?: string
          id?: string
          lokasi_proyek?: string
          nama_alat?: string
          status?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          total_biaya?: number
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      sparepart: {
        Row: {
          created_at: string | null
          harga_per_item: number
          id: string
          jumlah_stok: number
          keterangan: string
          nama_item: string
          satuan_item: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          harga_per_item?: number
          id?: string
          jumlah_stok?: number
          keterangan: string
          nama_item: string
          satuan_item?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          harga_per_item?: number
          id?: string
          jumlah_stok?: number
          keterangan?: string
          nama_item?: string
          satuan_item?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timesheet: {
        Row: {
          aktivitas: string
          bbm: number | null
          created_at: string
          created_by: string | null
          id: string
          keterangan: string | null
          lokasi: string
          nama_alat: string
          nama_operator: string
          no_lambung: string | null
          oli_10: number | null
          oli_40: number | null
          oli_90: number | null
          sesi1_jam_mulai: string | null
          sesi1_jam_selesai: string | null
          sesi2_jam_mulai: string | null
          sesi2_jam_selesai: string | null
          sesi3_jam_mulai: string | null
          sesi3_jam_selesai: string | null
          tanggal: string
          total_jam: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          aktivitas: string
          bbm?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          keterangan?: string | null
          lokasi: string
          nama_alat: string
          nama_operator: string
          no_lambung?: string | null
          oli_10?: number | null
          oli_40?: number | null
          oli_90?: number | null
          sesi1_jam_mulai?: string | null
          sesi1_jam_selesai?: string | null
          sesi2_jam_mulai?: string | null
          sesi2_jam_selesai?: string | null
          sesi3_jam_mulai?: string | null
          sesi3_jam_selesai?: string | null
          tanggal: string
          total_jam?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          aktivitas?: string
          bbm?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          keterangan?: string | null
          lokasi?: string
          nama_alat?: string
          nama_operator?: string
          no_lambung?: string | null
          oli_10?: number | null
          oli_40?: number | null
          oli_90?: number | null
          sesi1_jam_mulai?: string | null
          sesi1_jam_selesai?: string | null
          sesi2_jam_mulai?: string | null
          sesi2_jam_selesai?: string | null
          sesi3_jam_mulai?: string | null
          sesi3_jam_selesai?: string | null
          tanggal?: string
          total_jam?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      insert_kegiatan_mekanik: {
        Args:
          | {
              p_created_at: string
              p_keterangan: string
              p_lokasi_pekerjaan: string
              p_nama_alat: string
              p_nama_mekanik: string
              p_no_lambung: string
              p_no_ppa: string
              p_tanggal: string
              p_user_id: string
            }
          | {
              p_keterangan: string
              p_lokasi_pekerjaan: string
              p_nama_alat: string
              p_nama_mekanik: string
              p_no_lambung: string
              p_no_ppa: string
              p_tanggal: string
              p_user_id: string
            }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
