import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";

export default function NewPatientDialog({ open, onClose, patientData, onCreatePatient }) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: patientData?.patient_name || "",
    patient_id: patientData?.patient_id || "",
    date_of_birth: "",
    gender: "",
    contact_number: "",
    email: "",
  });

  const handleSubmit = async () => {
    if (!formData.patient_name || !formData.patient_id) {
      alert("Please fill in patient name and ID");
      return;
    }

    setIsCreating(true);
    try {
      await onCreatePatient(formData);
      onClose();
    } catch (error) {
      console.error("Failed to create patient:", error);
      alert("Failed to create patient. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            New Patient
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Patient Name *
            </label>
            <Input
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              placeholder="Enter patient name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Patient ID / MRN *
            </label>
            <Input
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              placeholder="Enter patient ID or MRN"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Date of Birth
            </label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Gender
            </label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Contact Number
            </label>
            <Input
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Patient
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}