import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        stopCamera();
        onCapture(imageData);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-black rounded-lg overflow-hidden shadow-2xl">
        <div className="relative aspect-[4/3] bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Card className="p-6 max-w-md">
                <p className="text-destructive text-center mb-4">{error}</p>
                <Button onClick={onClose} className="w-full">
                  Close
                </Button>
              </Card>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        {!error && (
          <div className="bg-background p-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-12 w-12"
            >
              <X className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={capturePhoto}
              className="h-16 w-16 rounded-full"
            >
              <Camera className="h-6 w-6" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={switchCamera}
              className="h-12 w-12"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
