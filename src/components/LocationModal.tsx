
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number; updatedAt: string };
  alatName: string;
  noLambung: string;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLocation,
  alatName,
  noLambung
}) => {
  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.lat || -7.795580,
    lng: initialLocation?.lng || 110.369490,
  });
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ketika modal terbuka, scroll ke atas dan nonaktifkan scroll pada body
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    // Cleanup: kembalikan scroll pada body ketika modal tertutup
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleGetCurrentLocation = () => {
    setIsLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolokasi tidak didukung oleh browser Anda");
      setIsLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocation({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      (err) => {
        let errorMessage = "Terjadi kesalahan saat mendapatkan lokasi";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Izin untuk mengakses lokasi ditolak";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia";
            break;
          case err.TIMEOUT:
            errorMessage = "Waktu permintaan lokasi habis";
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocation(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belum ada update';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (e) {
      return 'Format tanggal tidak valid';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">Lokasi Alat Berat</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <div className="font-medium">{alatName}</div>
            <div className="text-sm text-gray-500">No. Lambung: {noLambung}</div>
            
            {initialLocation && (
              <div className="mt-2 text-sm text-gray-500">
                Terakhir diperbarui: {formatDate(initialLocation.updatedAt)}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label htmlFor="lat" className="text-sm font-medium">
                Latitude
              </label>
              <input
                id="lat"
                name="lat"
                type="number"
                step="0.000001"
                value={location.lat}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lng" className="text-sm font-medium">
                Longitude
              </label>
              <input
                id="lng"
                name="lng"
                type="number"
                step="0.000001"
                value={location.lng}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
          
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-md mb-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Mendapatkan Lokasi...</span>
              </>
            ) : (
              <span>Gunakan Lokasi Saat Ini</span>
            )}
          </button>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}
          
          {userLocation && (
            <div className="bg-green-50 p-3 rounded-md mb-4">
              <div className="text-sm text-green-700">
                Lokasi saat ini:
                <div className="font-medium mt-1">
                  Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={() => onSave(location)}
              className="btn-primary"
            >
              Simpan Lokasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
