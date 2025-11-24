import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Patient } from "./PatientCard";
import { PatientData, BabyDetails, MaternalDetails } from "@/services/api";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: PatientData | null;
  onSave: (patientData: PatientData, images: { [key: string]: File }) => void;
}

export const PatientDialog = ({
  open,
  onOpenChange,
  patient,
  onSave,
}: PatientDialogProps) => {
  const [babyName, setBabyName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [address, setAddress] = useState("");
  // Baby details
  const [babyWeight, setBabyWeight] = useState("");
  const [babySex, setBabySex] = useState<"male" | "female" | "">("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  // Maternal details
  const [maternalAge, setMaternalAge] = useState("");
  const [parity, setParity] = useState("");
  const [gestationalHistory, setGestationalHistory] = useState("");
  const [location, setLocation] = useState("");
  const [maternalEducation, setMaternalEducation] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"normal" | "cesarean" | "assisted" | "">("");
  const [gestationalAgeMethod, setGestationalAgeMethod] = useState<"LMB" | "Ultra sound" | "Ballard score" | "other" | "">("");
  const [gestationalAgeEstimate, setGestationalAgeEstimate] = useState("");
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation function
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case "babyWeight":
        const weight = parseFloat(value);
        if (value && (isNaN(weight) || weight < 0.5 || weight > 6)) {
          newErrors.babyWeight = "Weight should be between 0.5-6 kg";
        } else {
          delete newErrors.babyWeight;
        }
        break;
      case "heartRate":
        const hr = parseFloat(value);
        if (value && (isNaN(hr) || hr < 100 || hr > 180)) {
          newErrors.heartRate = "Heart rate should be between 100-180 bpm";
        } else {
          delete newErrors.heartRate;
        }
        break;
      case "temperature":
        const temp = parseFloat(value);
        if (value && (isNaN(temp) || temp < 35 || temp > 38)) {
          newErrors.temperature = "Temperature should be between 35-38°C";
        } else {
          delete newErrors.temperature;
        }
        break;
      case "maternalAge":
        const age = parseInt(value);
        if (value && (isNaN(age) || age < 12 || age > 60)) {
          newErrors.maternalAge = "Age should be between 12-60 years";
        } else {
          delete newErrors.maternalAge;
        }
        break;
      case "parity":
        const par = parseInt(value);
        if (value && (isNaN(par) || par < 0 || par > 20)) {
          newErrors.parity = "Parity should be between 0-20";
        } else {
          delete newErrors.parity;
        }
        break;
      case "gestationalAgeEstimate":
        const gestAge = parseInt(value);
        if (!value) {
          newErrors.gestationalAgeEstimate = "Gestational age estimate is required";
        } else if (isNaN(gestAge) || gestAge < 20 || gestAge > 42) {
          newErrors.gestationalAgeEstimate = "Gestational age should be between 20-42 weeks";
        } else {
          delete newErrors.gestationalAgeEstimate;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  useEffect(() => {
    if (patient) {
      setBabyName(patient.babyName || "");
      setMotherName(patient.motherName || "");
      setAddress(patient.address || "");
      setBabyWeight(patient.babyDetails?.weightKg?.toString() || "");
      setBabySex((patient.babyDetails?.sex as any) || "");
      setHeartRate(patient.babyDetails?.heartRateBpm?.toString() || "");
      setTemperature(patient.babyDetails?.temperatureC?.toString() || "");
      setMaternalAge(patient.maternalDetails?.maternalAgeYears?.toString() || "");
      setParity(patient.maternalDetails?.parity || "");
      setGestationalHistory(patient.maternalDetails?.gestationalHistory || "");
      setLocation(patient.maternalDetails?.location || "");
      setMaternalEducation(patient.maternalDetails?.maternalEducation || "");
      setDeliveryMode((patient.maternalDetails?.deliveryMode as any) || "");
      setGestationalAgeMethod((patient.maternalDetails?.gestationalAgeEstimationMethod as any) || "");
      setGestationalAgeEstimate(patient.babyDetails?.gestationalAge || "");
    } else {
      setBabyName("");
      setMotherName("");
      setAddress("");
      setBabyWeight("");
      setBabySex("");
      setHeartRate("");
      setTemperature("");
      setMaternalAge("");
      setParity("");
      setGestationalHistory("");
      setLocation("");
      setMaternalEducation("");
      setDeliveryMode("");
      setGestationalAgeMethod("");
      setGestationalAgeEstimate("");
      setErrors({});
    }
  }, [patient, open]);

  const handleSave = () => {
    // Validate gestational age estimate
    validateField("gestationalAgeEstimate", gestationalAgeEstimate);

    if (!babyName.trim() || !motherName.trim() || !address.trim() || !gestationalAgeEstimate.trim() || Object.keys(errors).length > 0) {
      return;
    }

    const patientData: PatientData = {
      id: patient?.id,
      folderName: patient?.folderName,
      babyName: babyName.trim(),
      motherName: motherName.trim(),
      address: address.trim(),
      babyDetails: {
        gestationalAge: gestationalAgeEstimate.trim(),
        weightKg: babyWeight ? parseFloat(babyWeight) : null,
        sex: babySex || '',
        heartRateBpm: heartRate ? parseInt(heartRate) : null,
        temperatureC: temperature ? parseFloat(temperature) : null,
      },
      maternalDetails: {
        maternalAgeYears: maternalAge ? parseInt(maternalAge) : null,
        parity: parity.trim() || '',
        location: location.trim() || '',
        maternalEducation: maternalEducation.trim() || '',
        deliveryMode: deliveryMode || '',
        gestationalHistory: gestationalHistory.trim() || '',
        gestationalAgeEstimationMethod: gestationalAgeMethod || '',
      },
    };

    // For now, pass empty images object - will be updated when image upload is integrated
    onSave(patientData, {});

    // Reset form
    setBabyName("");
    setMotherName("");
    setAddress("");
    setBabyWeight("");
    setBabySex("");
    setHeartRate("");
    setTemperature("");
    setMaternalAge("");
    setParity("");
    setGestationalHistory("");
    setLocation("");
    setMaternalEducation("");
    setDeliveryMode("");
    setGestationalAgeMethod("");
    setGestationalAgeEstimate("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-card-foreground">
            {patient ? "Edit Patient" : "Add New Patient"}
          </DialogTitle>
          <DialogDescription>
            {patient
              ? "Update the patient information below."
              : "Enter the newborn baby and mother's details."}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="babyName" className="text-foreground">Baby's Name *</Label>
                <Input
                  id="babyName"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Enter baby's name"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="motherName" className="text-foreground">Mother's Name *</Label>
                <Input
                  id="motherName"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Enter mother's name"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-foreground">Address *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                  className="bg-background text-foreground min-h-[80px]"
                />
              </div>
            </div>

            {/* Baby Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Baby Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="babyWeight" className="text-foreground">Weight (kg)</Label>
                  <Input
                    id="babyWeight"
                    type="number"
                    step="0.01"
                    value={babyWeight}
                    onChange={(e) => {
                      setBabyWeight(e.target.value);
                      validateField("babyWeight", e.target.value);
                    }}
                    placeholder="e.g., 3.5"
                    className={`bg-background text-foreground ${errors.babyWeight ? "border-red-500" : ""}`}
                  />
                  {errors.babyWeight && (
                    <p className="text-xs text-red-500 mt-1">{errors.babyWeight}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">Sex</Label>
                  <RadioGroup value={babySex} onValueChange={(value) => setBabySex(value as "male" | "female")}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="font-normal cursor-pointer text-foreground">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="font-normal cursor-pointer text-foreground">Female</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="heartRate" className="text-foreground">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    value={heartRate}
                    onChange={(e) => {
                      setHeartRate(e.target.value);
                      validateField("heartRate", e.target.value);
                    }}
                    placeholder="e.g., 140"
                    className={`bg-background text-foreground ${errors.heartRate ? "border-red-500" : ""}`}
                  />
                  {errors.heartRate && (
                    <p className="text-xs text-red-500 mt-1">{errors.heartRate}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperature" className="text-foreground">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => {
                      setTemperature(e.target.value);
                      validateField("temperature", e.target.value);
                    }}
                    placeholder="e.g., 36.5"
                    className={`bg-background text-foreground ${errors.temperature ? "border-red-500" : ""}`}
                  />
                  {errors.temperature && (
                    <p className="text-xs text-red-500 mt-1">{errors.temperature}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Maternal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Maternal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maternalAge" className="text-foreground">Maternal Age (years)</Label>
                  <Input
                    id="maternalAge"
                    type="number"
                    value={maternalAge}
                    onChange={(e) => {
                      setMaternalAge(e.target.value);
                      validateField("maternalAge", e.target.value);
                    }}
                    placeholder="e.g., 28"
                    className={`bg-background text-foreground ${errors.maternalAge ? "border-red-500" : ""}`}
                  />
                  {errors.maternalAge && (
                    <p className="text-xs text-red-500 mt-1">{errors.maternalAge}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parity" className="text-foreground">Parity</Label>
                  <Input
                    id="parity"
                    type="number"
                    value={parity}
                    onChange={(e) => {
                      setParity(e.target.value);
                      validateField("parity", e.target.value);
                    }}
                    placeholder="e.g., 1"
                    className={`bg-background text-foreground ${errors.parity ? "border-red-500" : ""}`}
                  />
                  {errors.parity && (
                    <p className="text-xs text-red-500 mt-1">{errors.parity}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location" className="text-foreground">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hospital/Birth location"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maternalEducation" className="text-foreground">Maternal Education</Label>
                <Input
                  id="maternalEducation"
                  value={maternalEducation}
                  onChange={(e) => setMaternalEducation(e.target.value)}
                  placeholder="e.g., High school, Bachelor's"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliveryMode" className="text-foreground">Delivery Mode</Label>
                <Select value={deliveryMode} onValueChange={(value) => setDeliveryMode(value as "normal" | "cesarean" | "assisted")}>
                  <SelectTrigger className="bg-background text-foreground">
                    <SelectValue placeholder="Select delivery mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="cesarean">Cesarean</SelectItem>
                    <SelectItem value="assisted">Assisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gestationalHistory" className="text-foreground">Gestational History</Label>
                <Textarea
                  id="gestationalHistory"
                  value={gestationalHistory}
                  onChange={(e) => setGestationalHistory(e.target.value)}
                  placeholder="Enter gestational history details"
                  className="bg-background text-foreground min-h-[80px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gestationalAgeMethod" className="text-foreground">Gestational Age Estimation Method</Label>
                <Select value={gestationalAgeMethod} onValueChange={(value) => setGestationalAgeMethod(value as "LMB" | "Ultra sound" | "Ballard score" | "other")}>
                  <SelectTrigger className="bg-background text-foreground">
                    <SelectValue placeholder="Select estimation method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LMB">LMB</SelectItem>
                    <SelectItem value="Ultra sound">Ultra sound</SelectItem>
                    <SelectItem value="Ballard score">Ballard score</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gestationalAgeEstimate" className="text-foreground">Gestational Age Estimate (weeks) *</Label>
                <Input
                  id="gestationalAgeEstimate"
                  type="number"
                  value={gestationalAgeEstimate}
                  onChange={(e) => {
                    setGestationalAgeEstimate(e.target.value);
                    validateField("gestationalAgeEstimate", e.target.value);
                  }}
                  placeholder="e.g., 38"
                  className={`bg-background text-foreground ${errors.gestationalAgeEstimate ? "border-red-500" : ""}`}
                />
                {errors.gestationalAgeEstimate && (
                  <p className="text-xs text-red-500 mt-1">{errors.gestationalAgeEstimate}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!babyName.trim() || !motherName.trim() || !address.trim() || !gestationalAgeEstimate.trim() || Object.keys(errors).length > 0}
            className="bg-primary hover:bg-primary/90"
          >
            {patient ? "Update" : "Add"} Patient
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
