import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, User, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUploadCard } from "@/components/ImageUploadCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getPatientById, updatePatient, deletePatientImage, PatientData, getImageUrl } from "@/services/api";

// Assessment options for each image type
const ASSESSMENT_OPTIONS = {
  face: [
    "Sticky friable, transparent",
    "Gelatinous, red, translucent",
    "Smooth, pink, visible veins",
    "Superficial peeling &/or rash, few veins",
    "Cracking, pale areas, rare veins",
    "Parchment, deep cracking, no vessels",
    "Leathery, cracked, wrinkled"
  ],
  ear: [
    "None",
    "Sparse",
    "Abundant",
    "Thinning",
    "Bald areas",
    "Mostly bald"
  ],
  foot: [
    "no crease",
    "Faint red marks",
    "Anterior transverse crease only",
    "Creases ant. 2/3",
    "Creases over entire sole"
  ],
  palm: [
    "Lids fused loosely",
    "Lids fused tightly",
    "Lids open pinna flat stays folded",
    "Sl.curved pinna",
    "Well-curve pinna",
    "Formed & firm",
    "Thick cartilage, ear stiff"
  ]
};

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

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: ({ patientData, images }: { patientData: Partial<PatientData>; images: { [key: string]: File } }) =>
      updatePatient(id!, patientData, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setUploadingType(null);
      toast.success('Photo uploaded successfully!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadingType(null);
      toast.error('Failed to upload photo');
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

  const getImageTypeLabel = (type: "face" | "ear" | "foot" | "palm"): string => {
    const labels = {
      face: "Skin",
      ear: "Lanugo",
      foot: "Foot",
      palm: "Eye/Ear"
    };
    return labels[type];
  };

  const handleImageUpload = async (type: "face" | "ear" | "foot" | "palm", imageData: string) => {
    try {
      setUploadingType(type);
      toast.info(`Uploading ${getImageTypeLabel(type)} photo...`);

      // Convert base64 to File
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], `${type}.jpg`, { type: 'image/jpeg' });

      // Upload the image
      await updatePatientMutation.mutateAsync({
        patientData: {},
        images: { [type]: file },
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${getImageTypeLabel(type)} photo`);
      setUploadingType(null);
    }
  };

  const handleImageDelete = async (type: "face" | "ear" | "foot" | "palm") => {
    try {
      setUploadingType(type);
      toast.info(`Removing ${getImageTypeLabel(type)} photo...`);

      // Delete the image file and update JSON
      await deletePatientImage(id!, type);

      // Refresh the patient data
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });

      setUploadingType(null);
      toast.success('Photo removed successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to remove ${getImageTypeLabel(type)} photo`);
      setUploadingType(null);
    }
  };

  const handleAssessmentChange = async (type: "face" | "ear" | "foot" | "palm", value: string) => {
    try {
      toast.info(`Updating ${getImageTypeLabel(type)} assessment...`);

      // Update the assessment
      await updatePatientMutation.mutateAsync({
        patientData: {
          assessments: {
            ...patient?.assessments,
            [type]: value
          }
        },
        images: {},
      });

      toast.success('Assessment updated successfully!');
    } catch (error) {
      console.error('Assessment update error:', error);
      toast.error(`Failed to update ${getImageTypeLabel(type)} assessment`);
    }
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
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mother's Name:</span>
                <span className="text-card-foreground font-medium">{patient.motherName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Address:</span>
                <span className="text-card-foreground">{patient.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Date Added:</span>
                <span className="text-card-foreground">
                  {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : 'N/A'}
                </span>
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
            <div>
              <ImageUploadCard
                title="Skin Photo"
                imageUrl={patient.images?.face ? getImageUrl(patient.folderName!, patient.images.face) : undefined}
                onUpload={(url) => handleImageUpload("face", url)}
                onRemove={() => handleImageDelete("face")}
                isUploading={uploadingType === "face"}
              />
              <Select
                disabled={!patient.images?.face}
                value={patient.assessments?.face || ""}
                onValueChange={(value) => handleAssessmentChange("face", value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_OPTIONS.face.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ImageUploadCard
                title="Lanugo Photo"
                imageUrl={patient.images?.ear ? getImageUrl(patient.folderName!, patient.images.ear) : undefined}
                onUpload={(url) => handleImageUpload("ear", url)}
                onRemove={() => handleImageDelete("ear")}
                isUploading={uploadingType === "ear"}
              />
              <Select
                disabled={!patient.images?.ear}
                value={patient.assessments?.ear || ""}
                onValueChange={(value) => handleAssessmentChange("ear", value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_OPTIONS.ear.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ImageUploadCard
                title="Foot Photo"
                imageUrl={patient.images?.foot ? getImageUrl(patient.folderName!, patient.images.foot) : undefined}
                onUpload={(url) => handleImageUpload("foot", url)}
                onRemove={() => handleImageDelete("foot")}
                isUploading={uploadingType === "foot"}
              />
              <Select
                disabled={!patient.images?.foot}
                value={patient.assessments?.foot || ""}
                onValueChange={(value) => handleAssessmentChange("foot", value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_OPTIONS.foot.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ImageUploadCard
                title="Eye/Ear Photo"
                imageUrl={patient.images?.palm ? getImageUrl(patient.folderName!, patient.images.palm) : undefined}
                onUpload={(url) => handleImageUpload("palm", url)}
                onRemove={() => handleImageDelete("palm")}
                isUploading={uploadingType === "palm"}
              />
              <Select
                disabled={!patient.images?.palm}
                value={patient.assessments?.palm || ""}
                onValueChange={(value) => handleAssessmentChange("palm", value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_OPTIONS.palm.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
