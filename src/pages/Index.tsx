import { useState, useMemo } from "react";
import { Plus, Baby } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PatientCard } from "@/components/PatientCard";
import { PatientDialog } from "@/components/PatientDialog";
import { SearchBar } from "@/components/SearchBar";
import { toast } from "sonner";
import { getAllPatients, createPatient, updatePatient, PatientData } from "@/services/api";

const Index = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientData | null>(null);

  // Fetch patients from API
  const { data: patientsResponse, isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: getAllPatients,
  });

  const patients = patientsResponse?.data || [];

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: ({ patientData, images }: { patientData: PatientData; images: { [key: string]: File } }) =>
      createPatient(patientData, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success("Patient added successfully");
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create patient");
    },
  });

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: ({ id, patientData, images }: { id: string; patientData: Partial<PatientData>; images: { [key: string]: File } }) =>
      updatePatient(id, patientData, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success("Patient updated successfully");
      setDialogOpen(false);
      setEditingPatient(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update patient");
    },
  });

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;

    const query = searchQuery.toLowerCase();
    return patients.filter(
      (patient: PatientData) =>
        patient.babyName?.toLowerCase().includes(query) ||
        patient.motherName?.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  const handleSavePatient = (patientData: PatientData, images: { [key: string]: File }) => {
    if (patientData.id) {
      // Update existing patient
      updatePatientMutation.mutate({
        id: patientData.id,
        patientData,
        images
      });
    } else {
      createPatientMutation.mutate({ patientData, images });
    }
  };

  const handleEdit = (patient: PatientData) => {
    setEditingPatient(patient);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingPatient(null);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Baby className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Newborn gestation age estimation data collection tool</h1>
          </div>
          <p className="text-white/90 text-sm">Patient Management System</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Search and Add Section */}
        <div className="mb-6 space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Button
            onClick={handleAddNew}
            className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-medium shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Patient
          </Button>
        </div>

        {/* Patient List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-muted-foreground">Loading patients...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Baby className="w-16 h-16 mx-auto text-destructive mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-destructive mb-2">
                Failed to load patients
              </h3>
              <p className="text-muted-foreground text-sm">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Baby className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">
                {searchQuery ? "No patients found" : "No patients yet"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Add your first patient to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">
                  Patients ({filteredPatients.length})
                </h2>
              </div>
              {filteredPatients.map((patient: PatientData) => (
                <PatientCard
                  key={patient.id}
                  patient={patient as any}
                  onEdit={handleEdit}
                />
              ))}
            </>
          )}
        </div>
      </main>

      {/* Patient Dialog */}
      <PatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={editingPatient}
        onSave={handleSavePatient}
      />
    </div>
  );
};

export default Index;
