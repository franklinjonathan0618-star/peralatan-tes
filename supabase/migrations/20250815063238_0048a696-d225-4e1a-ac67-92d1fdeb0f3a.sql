-- Fix remaining function search_path security warnings
-- Update the remaining insert_kegiatan_mekanik functions

CREATE OR REPLACE FUNCTION public.insert_kegiatan_mekanik(p_tanggal date, p_no_ppa character varying, p_no_lambung character varying, p_nama_alat character varying, p_nama_mekanik character varying, p_lokasi_pekerjaan text, p_keterangan text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  new_id BIGINT;
  result JSONB;
BEGIN
  -- Insert data baru
  INSERT INTO public.kegiatan_mekanik (
    tanggal,
    no_ppa,
    no_lambung,
    nama_alat,
    nama_mekanik,
    lokasi_pekerjaan,
    keterangan,
    user_id
  ) VALUES (
    p_tanggal,
    p_no_ppa,
    p_no_lambung,
    p_nama_alat,
    p_nama_mekanik,
    p_lokasi_pekerjaan,
    p_keterangan,
    p_user_id
  )
  RETURNING id INTO new_id;

  -- Kembalikan data yang baru di-insert
  SELECT jsonb_build_object(
    'status', 'success',
    'message', 'Data berhasil disimpan',
    'data', jsonb_build_object(
      'id', new_id,
      'tanggal', p_tanggal,
      'no_ppa', p_no_ppa,
      'no_lambung', p_no_lambung,
      'nama_alat', p_nama_alat,
      'nama_mekanik', p_nama_mekanik,
      'lokasi_pekerjaan', p_lokasi_pekerjaan,
      'keterangan', p_keterangan,
      'user_id', p_user_id,
      'created_at', NOW()
    )
  ) INTO result;

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_kegiatan_mekanik(p_tanggal timestamp with time zone, p_no_ppa text, p_no_lambung text, p_nama_alat text, p_nama_mekanik text, p_lokasi_pekerjaan text, p_keterangan text, p_user_id uuid, p_created_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  new_id UUID;
  result JSONB;
BEGIN
  -- Insert data baru dan dapatkan ID-nya
  INSERT INTO public.kegiatan_mekanik (
    tanggal,
    no_ppa,
    no_lambung,
    nama_alat,
    nama_mekanik,
    lokasi_pekerjaan,
    keterangan,
    user_id,
    created_at
  ) VALUES (
    p_tanggal,
    p_no_ppa,
    p_no_lambung,
    p_nama_alat,
    p_nama_mekanik,
    p_lokasi_pekerjaan,
    p_keterangan,
    p_user_id::UUID,
    p_created_at
  ) RETURNING id INTO new_id;

  -- Kembalikan data yang baru saja di-insert
  SELECT row_to_json(t) INTO result
  FROM (
    SELECT * FROM public.kegiatan_mekanik WHERE id = new_id
  ) t;

  RETURN jsonb_build_object(
    'status', 'success',
    'data', result
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'code', SQLSTATE
  );
END;
$function$;