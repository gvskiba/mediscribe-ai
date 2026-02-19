import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, MapPin, User, Truck } from "lucide-react";
import { toast } from "sonner";

const DISPOSITION_TYPES = [
  { value: "discharge", label: "Discharge Home", color: "bg-green-100 text-green-800" },
  { value: "admission", label: "Hospital Admission", color: "bg-blue-100 text-blue-800" },
  { value: "transfer", label: "Transfer to Facility", color: "bg-orange-100 text-orange-800" },
  { value: "observation", label: "Observation", color: "bg-yellow-100 text-yellow-800" },
];

const LOCATIONS = {
  discharge: [
    { value: "home", label: "Home" },
    { value: "home_with_services", label: "Home with Home Health Services" },
    { value: "assisted_living", label: "Assisted Living" },
  ],
  admission: [
    { value: "acute_care", label: "Acute Care Hospital" },
    { value: "icu", label: "ICU" },
    { value: "step_down", label: "Step-Down Unit" },
    { value: "medical_surgical", label: "Medical-Surgical Unit" },
  ],
  transfer: [
    { value: "ltc", label: "Long-Term Care Facility" },
    { value: "rehab", label: "Rehabilitation Facility" },
    { value: "psychiatric", label: "Psychiatric Facility" },
    { value: "other_hospital", label: "Other Hospital" },
  ],
  observation: [
    { value: "observation_unit", label: "Observation Unit" },
    { value: "ed_observation", label: "ED Observation" },
  ],
};

const TRANSFER_METHODS = [
  { value: "ambulance", label: "Ambulance" },
  { value: "wheelchair", label: "Wheelchair" },
  { value: "stretcher", label: "Stretcher" },
  { value: "air_ambulance", label: "Air Ambulance/Helicopter" },
  { value: "self", label: "Self-Ambulating" },
  { value: "family", label: "Family Transport" },
];

export default function DispositionPlanner({ onSave }) {
  const [dispositionType, setDispositionType] = useState("discharge");
  const [location, setLocation] = useState("home");
  const [acceptingProvider, setAcceptingProvider] = useState("");
  const [admissionTime, setAdmissionTime] = useState("");
  const [transferMethod, setTransferMethod] = useState("ambulance");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const selectedDisposition = DISPOSITION_TYPES.find(d => d.value === dispositionType);
  const availableLocations = LOCATIONS[dispositionType] || [];

  useEffect(() => {
    // Reset location when disposition type changes
    if (availableLocations.length > 0) {
      setLocation(availableLocations[0].value);
    }
  }, [dispositionType, availableLocations]);

  const handleSave = () => {
    const dispositionData = {
      disposition_type: dispositionType,
      location,
      accepting_provider: acceptingProvider,
      admission_time: admissionTime,
      transfer_method: transferMethod,
      contact_info: contactInfo,
      additional_notes: additionalNotes,
    };
    onSave(dispositionData);
  };

  return (
    <div className="space-y-6">
      {/* Disposition Type Selection */}
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
            Disposition Type
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DISPOSITION_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setDispositionType(type.value)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  dispositionType === type.value
                    ? `${type.color} border-current font-semibold`
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-medium">{type.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location Selection */}
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location
          </h3>
        </div>
        <div className="p-6">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {availableLocations.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conditional Fields - Admission */}
      {dispositionType === "admission" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Accepting Provider
              </h3>
            </div>
            <div className="p-6">
              <Input
                value={acceptingProvider}
                onChange={(e) => setAcceptingProvider(e.target.value)}
                placeholder="e.g., Dr. Sarah Johnson, MD"
                className="text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Name and credentials of accepting physician</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Admission Time
              </h3>
            </div>
            <div className="p-6">
              <Input
                type="datetime-local"
                value={admissionTime}
                onChange={(e) => setAdmissionTime(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Expected admission date and time</p>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Fields - Transfer */}
      {dispositionType === "transfer" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border-2 border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                Transfer Method
              </h3>
            </div>
            <div className="p-6">
              <Select value={transferMethod} onValueChange={setTransferMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transfer method" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                Receiving Facility Contact
              </h3>
            </div>
            <div className="p-6">
              <Input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Facility name and contact information"
                className="text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Name, phone, or address of receiving facility</p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Additional Instructions</h3>
        </div>
        <div className="p-6">
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Add any additional disposition instructions, special precautions, or follow-up notes..."
            className="min-h-[150px] text-sm"
          />
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Disposition Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-600 font-medium mb-1">Type</p>
            <Badge className={selectedDisposition.color}>
              {selectedDisposition.label}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium mb-1">Location</p>
            <p className="text-sm font-medium text-slate-900">
              {availableLocations.find(l => l.value === location)?.label || location}
            </p>
          </div>
          {dispositionType === "admission" && acceptingProvider && (
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Provider</p>
              <p className="text-sm font-medium text-slate-900 truncate">{acceptingProvider}</p>
            </div>
          )}
          {dispositionType === "transfer" && transferMethod && (
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Transfer By</p>
              <p className="text-sm font-medium text-slate-900">
                {TRANSFER_METHODS.find(m => m.value === transferMethod)?.label}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 py-6 text-base"
      >
        <Check className="w-5 h-5" />
        Save Disposition Plan
      </Button>
    </div>
  );
}