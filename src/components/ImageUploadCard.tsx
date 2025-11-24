import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Check, Trash2 } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface ImageUploadCardProps {
  title: string;
  imageUrl?: string;
  onUpload: (imageUrl: string) => void;
  onRemove?: () => void;
  isUploading?: boolean;
}

export const ImageUploadCard = ({
  title,
  imageUrl,
  onUpload,
  onRemove,
  isUploading = false,
}: ImageUploadCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRetakeMode, setIsRetakeMode] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;

      // If there's already an uploaded image, auto-upload the new one (replace mode)
      if (imageUrl) {
        onUpload(base64String);
      } else {
        // If no existing image, show preview first
        setPreviewImage(base64String);
      }
    };
    reader.onerror = () => {
      alert("Failed to read image file");
    };
    reader.readAsDataURL(file);

    // Reset file input to allow selecting the same file again
    event.target.value = '';
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = (imageData: string) => {
    setPreviewImage(imageData);
    setShowCamera(false);
  };

  const handleUploadClick = () => {
    if (previewImage) {
      onUpload(previewImage);
      setPreviewImage(null);
      setIsRetakeMode(false);
    }
  };

  // Auto-upload when in retake mode and image is captured
  useEffect(() => {
    if (isRetakeMode && previewImage) {
      onUpload(previewImage);
      setPreviewImage(null);
      setIsRetakeMode(false);
    }
  }, [isRetakeMode, previewImage, onUpload]);

  // Determine what to show: uploaded image, preview, or empty state
  const displayImage = imageUrl || previewImage;
  const isPreview = previewImage && !imageUrl;
  const isUploaded = imageUrl && !previewImage;

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <Card className="overflow-hidden bg-card">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            {title}
          </h3>

          {displayImage ? (
            <div className="space-y-3">
              {/* Image Display */}
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-xs">Uploading...</p>
                    </div>
                  </div>
                )}
                {isUploaded && !isUploading && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isPreview && !isUploading && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUploadClick}
                  className="w-full"
                  title="Upload photo"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              )}
              {isUploaded && !isUploading && (
                <div className="w-full space-y-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setIsRetakeMode(true);
                      setShowCamera(true);
                    }}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retake Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  {onRemove && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onRemove}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-4">
              <Camera className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground text-center mb-4">
                No photo taken
              </p>
              <div className="w-full space-y-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setIsRetakeMode(true);
                    setShowCamera(true);
                  }}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleButtonClick}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </Card>
    </>
  );
};
