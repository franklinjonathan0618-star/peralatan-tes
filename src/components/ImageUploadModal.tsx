
import React, { useState, useRef } from 'react';
import { X, Upload, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  initialImage?: string;
  alatName: string;
  noLambung: string;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialImage,
  alatName,
  noLambung
}) => {
  const [image, setImage] = useState<string | undefined>(initialImage);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    // Dalam versi produksi, di sini Anda akan mengunggah file ke server 
    // dan mendapatkan URL dari server
    // Untuk demo, kita hanya menggunakan FileReader untuk preview
    const reader = new FileReader();
    
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      console.error('Error membaca file');
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setIsLoading(true);

    // Logika yang sama dengan handleFileChange
    const reader = new FileReader();
    
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      console.error('Error membaca file');
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">Foto Alat Berat</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <div className="font-medium">{alatName}</div>
            <div className="text-sm text-gray-500">No. Lambung: {noLambung}</div>
          </div>
          
          {image ? (
            <div className="mb-4">
              <div className="relative">
                <img
                  src={image}
                  alt={`Foto ${alatName}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  onClick={handleRemoveImage}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  title="Hapus foto"
                >
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload size={32} className="text-gray-400 mb-2" />
              <div className="text-center">
                <p className="text-sm font-medium">Klik atau seret foto ke sini</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG (maks. 5MB)</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Batal
            </Button>
            <Button
              onClick={() => image && onSave(image)}
              disabled={!image || isLoading}
              variant="default"
            >
              Simpan Foto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
