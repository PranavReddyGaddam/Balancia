import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import { Upload, Camera, FileText, Loader2 } from 'lucide-react';

interface OCRUploaderProps {
  onNext: () => void;
}

export default function OCRUploader({ onNext }: OCRUploaderProps) {
  const { setItems, setError, isLoading, setIsLoading } = useStore();
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Process with OCR
      const result = await apiService.ocr.extract(file);
      
      // Update store with extracted items
      setItems(result.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price), // Ensure price is a number
        isTaxable: item.is_taxable
      })));
      
      onNext();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsLoading(false);
      // Clean up preview URL after processing is complete
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Receipt</h2>
        <p className="text-gray-600">
          Upload a photo of your receipt to automatically extract items
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
            <div>
              <p className="text-lg font-medium text-gray-900">Processing receipt...</p>
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="space-y-4">
            <img 
              src={previewUrl} 
              alt="Receipt preview" 
              className="mx-auto max-h-64 rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-500">Processing image...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your receipt here, or{' '}
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, and WebP formats
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={openFileDialog}
          disabled={isLoading}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Choose File
        </button>
        
        <button
          type="button"
          disabled={isLoading}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for best results:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure good lighting and clear text</li>
          <li>• Keep the receipt flat and in focus</li>
          <li>• Include the entire receipt in the photo</li>
          <li>• Avoid shadows and glare</li>
        </ul>
      </div>
    </div>
  );
}
