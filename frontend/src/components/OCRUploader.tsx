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

    // Check file size (25MB limit for mobile)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      setError('File size too large. Please select an image smaller than 25MB.');
      return;
    }

    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    setIsLoading(true);
    setError(null);

    try {
      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      let processedFile = file;
      
      // Convert unsupported formats to JPEG
      const unsupportedFormats = [
        'image/heic',
        'image/heif', 
        'image/webp',
        'image/avif',
        'image/tiff',
        'image/bmp'
      ];
      
      const isUnsupportedFormat = unsupportedFormats.includes(file.type) || 
        file.name.toLowerCase().match(/\.(heic|heif|webp|avif|tiff|tif|bmp)$/);
      
      if (isUnsupportedFormat) {
        console.log(`Converting ${file.type} to JPEG...`);
        processedFile = await convertToJpeg(file);
      }

      // Process with OCR
      console.log('Sending file to OCR:', {
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type,
        lastModified: processedFile.lastModified
      });
      
      const result = await apiService.ocr.extract(processedFile);
      
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
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
      // Clean up preview URL after processing is complete
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  // Function to convert any image format to JPEG
  const convertToJpeg = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const jpegFile = new File([blob], file.name.replace(/\.(heic|heif|webp|avif|tiff|tif|bmp)$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(jpegFile);
          } else {
            reject(new Error('Failed to convert image to JPEG'));
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
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

  const openCamera = () => {
    // Create a new file input for camera
    const cameraInput = document.createElement('input');
    cameraInput.type = 'file';
    cameraInput.accept = 'image/*';
    cameraInput.capture = 'environment'; // Use back camera
    cameraInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFile(target.files[0]);
      }
    };
    cameraInput.click();
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
                Supports JPG, PNG, WebP, HEIC, HEIF, AVIF, TIFF, and BMP formats
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
          onClick={openCamera}
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
