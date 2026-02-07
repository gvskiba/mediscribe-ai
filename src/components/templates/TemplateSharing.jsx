import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Share2, X, Users, Globe, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function TemplateSharing({ template, open, onClose, onUpdate }) {
  const [isPublic, setIsPublic] = useState(template?.is_public || false);
  const [sharedWith, setSharedWith] = useState(template?.shared_with || []);
  const [emailInput, setEmailInput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleAddEmail = () => {
    if (!emailInput.trim()) return;
    if (sharedWith.includes(emailInput.trim())) {
      toast.error("Email already added");
      return;
    }
    setSharedWith([...sharedWith, emailInput.trim()]);
    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    setSharedWith(sharedWith.filter(e => e !== email));
  };

  const handleSave = async () => {
    await onUpdate(template.id, {
      is_public: isPublic,
      shared_with: isPublic ? [] : sharedWith
    });
    toast.success("Sharing settings updated");
    onClose();
  };

  const copyTemplateId = () => {
    navigator.clipboard.writeText(template.id);
    setCopied(true);
    toast.success("Template ID copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Template
          </DialogTitle>
          <DialogDescription>
            Share "{template?.name}" with your team or make it public
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Public Sharing Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Label className="font-semibold text-slate-900">Public Template</Label>
                <p className="text-xs text-slate-500">Share with all users in your organization</p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Private Sharing */}
          {!isPublic && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <Label className="font-semibold text-slate-900">Share with Specific Users</Label>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  className="flex-1"
                />
                <Button onClick={handleAddEmail} size="sm">
                  <Mail className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              {/* Shared Users List */}
              {sharedWith.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sharedWith.map((email, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                      <span className="text-sm text-slate-700">{email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmail(email)}
                        className="h-6 w-6"
                      >
                        <X className="w-3 h-3 text-slate-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template ID for Reference */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Label className="text-xs text-slate-600 mb-2 block">Template ID</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                {template?.id}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyTemplateId}
                className="h-7 w-7"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}