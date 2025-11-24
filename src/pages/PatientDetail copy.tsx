import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, User, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUploadCard } from "@/components/ImageUploadCard";
import { toast } from "sonner";
import { getPatientById, updatePatient, PatientData, getImageUrl } from "@/services/api";

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // Fetch patient data
  const { data: patientResponse, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatientById(id!),
    enabled: !!id,
  });

  const patient = patientResponse?.data;

  // Debug: Log patient data to console
  console.log('Patient data:', patient);
  console.log('Patient images:', patient?.images);
  console.log('Folder name:', patient?.folderName);

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: ({ patientData, images }: { patientData: Partial<PatientData>; images: { [key: string]: File } }) =>
      updatePatient(id!, patientData, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setUploadingType(null);
    },
    onError: () => {
      setUploadingType(null);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive mb-2">Patient not found</h3>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (type: "face" | "ear" | "foot" | "palm", imageData: string) => {
    try {
      setUploadingType(type);
      toast.info(`Uploading ${type} photo...`);

      // Convert base64 to File
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], `${type}.jpg`, { type: 'image/jpeg' });

      // Upload the image
      await updatePatientMutation.mutateAsync({
        patientData: {},
        images: { [type]: file },
      });

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} photo uploaded successfully!`);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type} photo`);
    }
  };

  const handleRemoveImage = (type: "face" | "ear" | "foot" | "palm") => {
    // For removing images, we would need a separate API endpoint
    toast.info("Image removal feature coming soon");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/20 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Camera className="w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold">{patient.babyName}</h1>
              <p className="text-white/90 text-sm">Patient Details</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Patient Info Card */}
        <Card className="p-5 mb-6 bg-card">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Patient Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Mother's Name</p>
                <p className="text-card-foreground font-medium">{patient.motherName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-card-foreground">{patient.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date Added</p>
                <p className="text-card-foreground">
                  {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Medical Photos Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Medical Photos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ImageUploadCard
              title="Face Photo"
              imageUrl={patient.images?.face ? getImageUrl(patient.folderName!, patient.images.face) : undefined}
              onUpload={(url) => handleImageUpload("face", url)}
              onRemove={() => handleRemoveImage("face")}
              isUploading={uploadingType === "face"}
            />
            {/* Debug image URLs */}
            {console.log('Face image URL:', patient.images?.face ? getImageUrl(patient.folderName!, patient.images.face) : 'No face image')}
            <ImageUploadCard
              title="Ear Photo"
              imageUrl={patient.images?.ear ? getImageUrl(patient.folderName!, patient.images.ear) : undefined}
              onUpload={(url) => handleImageUpload("ear", url)}
              onRemove={() => handleRemoveImage("ear")}
              isUploading={uploadingType === "ear"}
            />
            <ImageUploadCard
              title="Foot Photo"
              imageUrl={patient.images?.foot ? getImageUrl(patient.folderName!, patient.images.foot) : undefined}
              onUpload={(url) => handleImageUpload("foot", url)}
              onRemove={() => handleRemoveImage("foot")}
              isUploading={uploadingType === "foot"}
            />
            <ImageUploadCard
              title="Palm Photo"
              imageUrl={patient.images?.palm ? getImageUrl(patient.folderName!, patient.images.palm) : undefined}
              onUpload={(url) => handleImageUpload("palm", url)}
              onRemove={() => handleRemoveImage("palm")}
              isUploading={uploadingType === "palm"}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
