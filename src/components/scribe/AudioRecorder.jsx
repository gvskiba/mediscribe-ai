import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AudioRecorder({ onAudioReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioBlob(file);
      toast.success("Audio file uploaded");
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    await onAudioReady(audioBlob);
    setIsUploading(false);
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Record or Upload Audio</h3>
        <p className="text-sm text-slate-600">Capture the patient-doctor conversation</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white gap-2"
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </Button>
        )}

        <label className="flex-1">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => document.querySelector('input[type="file"]').click()}
            variant="outline"
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Audio
          </Button>
        </label>
      </div>

      {audioBlob && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">✓ Audio ready to process</p>
          </div>
          <Button
            onClick={processAudio}
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Audio & Generate Note"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}