/**
 * fotoUtils.ts — Helper untuk menangani 5 foto per alat (JSON array / single string)
 */

export const SLOT_LABELS = [
  'Foto Depan (Utama)',
  'Foto Samping Kanan',
  'Foto Samping Kiri',
  'Foto Belakang',
  'Foto Mesin / Detail',
];

/**
 * Mengubah data foto (JSON array string atau single URL) menjadi array string foto [url1, url2, ...]
 */
export function parseFotoList(fotoRaw: any): string[] {
  if (!fotoRaw) return [];
  if (Array.isArray(fotoRaw)) {
    return fotoRaw.filter(f => typeof f === 'string' && f.trim() !== '');
  }
  if (typeof fotoRaw === 'string') {
    const trimmed = fotoRaw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(f => typeof f === 'string' && f.trim() !== '');
        }
      } catch (e) {
        console.warn('Gagal parse JSON foto, fallback to string:', e);
      }
    }
    return [trimmed];
  }
  return [];
}

/**
 * Mengubah array foto menjadi string JSON (atau null jika kosong) untuk disimpan ke database
 */
export function serializeFotoList(fotos: string[]): string | null {
  const cleanList = fotos.filter(f => typeof f === 'string' && f.trim() !== '');
  if (cleanList.length === 0) return null;
  if (cleanList.length === 1) return cleanList[0]; // fallback backward compatibility
  return JSON.stringify(cleanList);
}
