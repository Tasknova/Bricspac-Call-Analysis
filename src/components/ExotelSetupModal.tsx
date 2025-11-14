import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Phone, CheckCircle, AlertCircle } from "lucide-react";

interface ExotelSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function ExotelSetupModal({ isOpen, onClose, onComplete }: ExotelSetupModalProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [exotelCredentials, setExotelCredentials] = useState({
    api_key: "",
    api_token: "",
    subdomain: "api.exotel.com",
    account_sid: "",
  });

  const handleSaveCredentials = async () => {
    if (!userRole) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          exotel_api_key: exotelCredentials.api_key,
          exotel_api_token: exotelCredentials.api_token,
          exotel_subdomain: exotelCredentials.subdomain,
          exotel_account_sid: exotelCredentials.account_sid,
          exotel_setup_completed: true,
        });

      if (error) throw error;

      toast({
        title: 'Exotel Setup Complete',
        description: 'Your Exotel credentials have been saved successfully. You can now make calls!',
      });

      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error saving Exotel credentials:', error);
      toast({
        title: 'Setup Failed',
        description: 'Failed to save Exotel credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = exotelCredentials.api_key && 
                     exotelCredentials.api_token && 
                     exotelCredentials.account_sid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-600" />
            Exotel Setup Required
          </DialogTitle>
          <DialogDescription>
            To enable calling functionality, you need to configure your Exotel API credentials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium">Credentials</span>
            </div>
            <div className="w-8 h-px bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                What is Exotel?
              </CardTitle>
              <CardDescription>
                Exotel is a cloud telephony platform that enables you to make and receive calls programmatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Make calls directly from the app</p>
                    <p className="text-sm text-muted-foreground">No need to use external calling apps</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Automatic call recording</p>
                    <p className="text-sm text-muted-foreground">All calls are automatically recorded for analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Professional caller ID</p>
                    <p className="text-sm text-muted-foreground">Use your business number as caller ID</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credentials Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key *</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={exotelCredentials.api_key}
                  onChange={(e) => setExotelCredentials(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Enter your Exotel API Key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-token">API Token *</Label>
                <Input
                  id="api-token"
                  type="password"
                  value={exotelCredentials.api_token}
                  onChange={(e) => setExotelCredentials(prev => ({ ...prev, api_token: e.target.value }))}
                  placeholder="Enter your Exotel API Token"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={exotelCredentials.subdomain}
                  onChange={(e) => setExotelCredentials(prev => ({ ...prev, subdomain: e.target.value }))}
                  placeholder="api.exotel.com"
                />
                <p className="text-xs text-muted-foreground">Usually "api.exotel.com"</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-sid">Account SID *</Label>
                <Input
                  id="account-sid"
                  value={exotelCredentials.account_sid}
                  onChange={(e) => setExotelCredentials(prev => ({ ...prev, account_sid: e.target.value }))}
                  placeholder="Enter your Exotel Account SID"
                />
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Need help finding your credentials?</p>
                <p className="text-blue-700 mt-1">
                  Log in to your Exotel dashboard and go to Settings → API Credentials to find your API Key, Token, and Account SID.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Skip for Now
            </Button>
            <Button 
              onClick={handleSaveCredentials} 
              disabled={!isFormValid || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
