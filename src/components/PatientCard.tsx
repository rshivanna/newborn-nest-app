import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, MapPin, User, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface Patient {
  id: string;
  babyName: string;
  motherName: string;
  address: string;
  dateAdded: string;
  // Baby details
  babyWeight?: number;
  babySex?: "male" | "female" | "";
  heartRate?: number;
  temperature?: number;
  // Maternal details
  maternalAge?: number;
  parity?: number;
  gestationalHistory?: string;
  location?: string;
  maternalEducation?: string;
  deliveryMode?: "normal" | "cesarean" | "assisted" | "";
  gestationalAgeMethod?: "LMB" | "Ultra sound" | "Ballard score" | "other";
  gestationalAgeEstimate?: number;
}

interface PatientCardProps {
  patient: Patient;
  onEdit: (patient: Patient) => void;
}

export const PatientCard = ({ patient, onEdit }: PatientCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 bg-card border-border">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-card-foreground mb-1">
            {patient.babyName}
          </h3>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <User className="w-4 h-4" />
            <span>Mother: {patient.motherName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{patient.address}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/patient/${patient.id}`)}
            className="hover:bg-accent/10 hover:text-accent"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(patient)}
            className="hover:bg-primary/10 hover:text-primary"
            title="Edit patient"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
        Added: {new Date(patient.dateAdded).toLocaleDateString()}
      </div>
    </Card>
  );
};
