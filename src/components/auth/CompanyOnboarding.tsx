import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Phone, MapPin, Globe, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanyOnboardingProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function CompanyOnboarding({ onComplete, onBack }: CompanyOnboardingProps) {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    industry: '',
    phone: '',
    address: '',
    website: '',
  });

  // Get the current user session on component mount and keep it updated
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
      } else if (user) {
        // Fallback to user from AuthContext
        setAuthUser(user);
      }
    };
    getUserSession();
  }, [user]);

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Real Estate',
    'Consulting',
    'Marketing',
    'Sales',
    'Customer Service',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use authUser state first, fallback to fresh session check
    let currentUser = authUser;
    
    if (!currentUser) {
      // Try to get session as fallback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a company. Please try signing in again.',
          variant: 'destructive',
        });
        return;
      }
      currentUser = session.user;
      setAuthUser(currentUser); // Update state for next time
    }
    
    console.log('Current authenticated user:', currentUser.id, currentUser.email);
    
    // Verify the user is properly authenticated by checking the session
    if (!currentUser.id || !currentUser.email) {
      console.error('Invalid user data:', currentUser);
      toast({
        title: 'Authentication Error',
        description: 'Your session is invalid. Please sign in again.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('User authentication verified:', currentUser.id, currentUser.email);
    
    // Check if the user is properly authenticated
    if (!currentUser.id || !currentUser.email) {
      console.error('Invalid user data:', currentUser);
      toast({
        title: 'Authentication Error',
        description: 'Your session is invalid. Please sign out and sign in again.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('Using current user for company creation:', currentUser.id, currentUser.email);
    
    // Check if this is a known problematic user ID
    if (currentUser.id === 'af1d1587-4098-4e52-a992-7868ed611f60' || 
        currentUser.id === '1c583b4c-0b4a-4b0e-98bc-2db8a08053c7') {
      console.error('Using a known problematic user ID. This suggests the user was not properly created in auth.users.');
      toast({
        title: 'Authentication Error',
        description: 'Your account was not created properly. Please try signing up again with a different email.',
        variant: 'destructive',
      });
      return;
    }
    
    const validUser = currentUser;
      
    try {
      setLoading(true);

      // Create company
      console.log('Creating company with data:', {
        name: formData.companyName,
        email: formData.companyEmail,
        industry: formData.industry,
        phone: formData.phone || null,
        address: formData.address || null,
        website: formData.website || null,
      });
      
      // Create admin role for the user (no company needed - single company system)
      console.log('Creating user role with data:', {
        user_id: validUser.id,
        role: 'admin',
        is_active: true,
      });
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: validUser.id,
          role: 'admin',
          is_active: true,
        });

      if (roleError) {
        console.error('User role creation error:', roleError);
        throw roleError;
      }
      
      console.log('User role created successfully');

      // Create user profile with company info
      console.log('Creating user profile with data:', {
        user_id: validUser.id,
        email: validUser.email!,
        full_name: validUser.user_metadata?.full_name || '',
        avatar_url: validUser.user_metadata?.avatar_url,
        company_name: formData.companyName,
        company_email: formData.companyEmail,
        company_industry: formData.industry,
        onboarding_completed: true,
      });
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: validUser.id,
          email: validUser.email!,
          full_name: validUser.user_metadata?.full_name || '',
          avatar_url: validUser.user_metadata?.avatar_url,
          company_name: formData.companyName,
          company_email: formData.companyEmail,
          company_industry: formData.industry,
          onboarding_completed: true,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here as the main company creation was successful
      } else {
        console.log('User profile created successfully');
      }

      toast({
        title: 'Success',
        description: 'Company created successfully! You can now start adding managers and employees.',
      });

      // Refresh user data to get the new role and company information
      await refreshUserData();

      onComplete();
    } catch (error: any) {
      console.error('Company creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            {onBack && (
              <div className="flex justify-start mb-4">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            )}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Company Setup</CardTitle>
            <CardDescription className="text-base">
              Tell us about your company to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName" className="text-base font-medium">
                    Company Name *
                  </Label>
                  <div className="relative mt-2">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter company name"
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="companyEmail" className="text-base font-medium">
                    Company Email *
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyEmail"
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                      placeholder="Enter company email"
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="industry" className="text-base font-medium">
                    Industry *
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger className="mt-2 h-12 text-base">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-medium">
                    Phone Number
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-base font-medium">
                  Address
                </Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter company address"
                    className="pl-10 h-20 text-base resize-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website" className="text-base font-medium">
                  Website
                </Label>
                <div className="relative mt-2">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Enter website URL"
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.companyName || !formData.companyEmail || !formData.industry}
                className="w-full h-12 text-base bg-green-500 hover:bg-green-600"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
