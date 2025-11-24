/**
 * API Service for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface BabyDetails {
  gestationalAge?: string;
  weightKg?: number | null;
  sex?: string;
  heartRateBpm?: number | null;
  temperatureC?: number | null;
}

export interface MaternalDetails {
  maternalAgeYears?: number | null;
  parity?: string;
  location?: string;
  maternalEducation?: string;
  deliveryMode?: string;
  gestationalHistory?: string;
  gestationalAgeEstimationMethod?: string;
}

export interface PatientData {
  id?: string;
  babyName: string;
  motherName: string;
  address: string;
  babyDetails?: BabyDetails;
  maternalDetails?: MaternalDetails;
  images?: {
    face?: string;
    ear?: string;
    foot?: string;
    palm?: string;
  };
  assessments?: {
    face?: string;
    ear?: string;
    foot?: string;
    palm?: string;
  };
  folderName?: string;
  folderPath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: any[];
}

/**
 * Create a new patient record
 */
export const createPatient = async (
  patientData: PatientData,
  images: { [key: string]: File }
): Promise<ApiResponse<PatientData>> => {
  const formData = new FormData();

  // Add patient data as individual fields
  formData.append('babyName', patientData.babyName);
  formData.append('motherName', patientData.motherName);
  formData.append('address', patientData.address);

  // Add baby details
  if (patientData.babyDetails) {
    Object.entries(patientData.babyDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(`babyDetails[${key}]`, value.toString());
      }
    });
  }

  // Add maternal details
  if (patientData.maternalDetails) {
    Object.entries(patientData.maternalDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(`maternalDetails[${key}]`, value.toString());
      }
    });
  }

  // Add image files
  Object.entries(images).forEach(([type, file]) => {
    if (file) {
      formData.append(type, file);
    }
  });

  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create patient');
  }

  return response.json();
};

/**
 * Get all patients
 */
export const getAllPatients = async (): Promise<ApiResponse<PatientData[]>> => {
  const response = await fetch(`${API_BASE_URL}/patients`);

  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }

  return response.json();
};

/**
 * Get a single patient by ID
 */
export const getPatientById = async (id: string): Promise<ApiResponse<PatientData>> => {
  const response = await fetch(`${API_BASE_URL}/patients/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch patient');
  }

  return response.json();
};

/**
 * Update a patient record
 */
export const updatePatient = async (
  id: string,
  patientData: Partial<PatientData>,
  images?: { [key: string]: File }
): Promise<ApiResponse<PatientData>> => {
  const formData = new FormData();

  // Add updated patient data
  Object.entries(patientData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && typeof value !== 'object') {
      formData.append(key, value.toString());
    }
  });

  // Add baby details
  if (patientData.babyDetails) {
    Object.entries(patientData.babyDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(`babyDetails[${key}]`, value.toString());
      }
    });
  }

  // Add maternal details
  if (patientData.maternalDetails) {
    Object.entries(patientData.maternalDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(`maternalDetails[${key}]`, value.toString());
      }
    });
  }

  // Add assessments
  if (patientData.assessments) {
    Object.entries(patientData.assessments).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(`assessments[${key}]`, value.toString());
      }
    });
  }

  // Add new image files if provided
  if (images) {
    Object.entries(images).forEach(([type, file]) => {
      if (file) {
        formData.append(type, file);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update patient');
  }

  return response.json();
};

/**
 * Delete a specific image from a patient record
 */
export const deletePatientImage = async (
  id: string,
  imageType: 'face' | 'ear' | 'foot' | 'palm'
): Promise<ApiResponse<PatientData>> => {
  const response = await fetch(`${API_BASE_URL}/patients/${id}/images/${imageType}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete image');
  }

  return response.json();
};

/**
 * Delete a patient record
 */
export const deletePatient = async (id: string): Promise<ApiResponse<null>> => {
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete patient');
  }

  return response.json();
};

/**
 * Get image URL for uploaded images
 */
export const getImageUrl = (folderName: string, imageName: string): string => {
  // Remove /api from the URL since /uploads is served at root level
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');
  return `${baseUrl}/uploads/${folderName}/${imageName}`;
};
