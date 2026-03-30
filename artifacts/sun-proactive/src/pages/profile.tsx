import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";

export default function Profile() {
  const { user } = useAuth();
  const { setLanguage, language } = useI18n();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Use local state for edit form
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");

  if (!user) return null;

  const handleSave = () => {
    // In a real app, call API to update profile here.
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Settings</h1>
          <p className="text-slate-600">Manage your account preferences and personal information.</p>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-amber-400 to-amber-500"></div>
          <CardContent className="p-6 pt-0 relative">
            <div className="flex justify-between items-end mb-6 -mt-12">
              <Avatar className="w-24 h-24 border-4 border-white shadow-md bg-white">
                <AvatarFallback className="bg-slate-100 text-slate-700 text-2xl font-bold">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant={isEditing ? "default" : "outline"} 
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className={isEditing ? "bg-slate-900 text-white" : ""}
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={user.name} disabled className="bg-slate-50" />
                  <p className="text-xs text-slate-500">Name cannot be changed directly.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user.email} disabled className="bg-slate-50" />
                </div>

                <div className="space-y-2">
                  <Label>Platform Language</Label>
                  <Select 
                    value={language} 
                    onValueChange={(v: "en"|"ru"|"kz") => setLanguage(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="kz">Қазақша</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Changes the UI and AI interaction language.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    disabled={!isEditing} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    disabled={!isEditing}
                    className="h-32"
                    placeholder="Tell other volunteers a bit about yourself..."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
