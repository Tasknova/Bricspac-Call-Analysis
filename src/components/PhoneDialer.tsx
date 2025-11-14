import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Delete, 
  PhoneCall,
  Loader2,
  User,
  CheckCircle
} from "lucide-react";

interface PhoneDialerProps {
  onCallComplete?: () => void;
}

export default function PhoneDialer({ onCallComplete }: PhoneDialerProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [currentCallSid, setCurrentCallSid] = useState("");
  const [callPollingInterval, setCallPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showCallOutcomeModal, setShowCallOutcomeModal] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<any>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  
  // Company settings
  const [companySettings, setCompanySettings] = useState({
    caller_id: "09513886363",
    from_numbers: ["7887766008"],
  });
  const [fromNumber, setFromNumber] = useState("");
  const [callerId, setCallerId] = useState("");

  // Lead details state
  const [leadDetails, setLeadDetails] = useState({
    name: "",
    email: "",
    company: "",
  });

  // Call outcome state
  const [callOutcome, setCallOutcome] = useState("");
  const [callOutcomeStatus, setCallOutcomeStatus] = useState<'follow_up' | 'completed' | 'not_interested'>('follow_up');
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");

  useEffect(() => {
    if (userRole) {
      fetchCompanySettings();
    }
  }, [userRole]);

  const fetchCompanySettings = async () => {
    if (!userRole) return;

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company settings:', error);
        return;
      }

      if (data) {
        setCompanySettings({
          caller_id: data.caller_id || "09513886363",
          from_numbers: data.from_numbers || ["7887766008"],
        });
        
        if (data.from_numbers && data.from_numbers.length > 0) {
          setFromNumber(data.from_numbers[0]);
        }
        if (data.caller_id) {
          setCallerId(data.caller_id);
        }
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const handleNumberClick = (num: string) => {
    setPhoneNumber(prev => prev + num);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber("");
  };

  const initiateExotelCall = async (from: string, to: string, callerId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hueohfwgqzvwwimqakxn.supabase.co'
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZW9oZndncXp2d3dpbXFha3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzQ5NzgsImV4cCI6MjA3ODUxMDk3OH0.v_1TKhYFXDsWlw-Z3MeiFDco3zLQETIpAQhpqyTv1Ic'
      const response = await fetch(`${supabaseUrl}/functions/v1/exotel-proxy/calls/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          from: from,
          to: to,
          callerId: callerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error initiating Exotel call:', error);
      throw error;
    }
  };

  const getExotelCallDetails = async (callSid: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hueohfwgqzvwwimqakxn.supabase.co'
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZW9oZndncXp2d3dpbXFha3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzQ5NzgsImV4cCI6MjA3ODUxMDk3OH0.v_1TKhYFXDsWlw-Z3MeiFDco3zLQETIpAQhpqyTv1Ic'
      const response = await fetch(`${supabaseUrl}/functions/v1/exotel-proxy/calls/${callSid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Exotel call details:', error);
      throw error;
    }
  };

  const startCallPolling = (callSid: string) => {
    const interval = setInterval(async () => {
      try {
        const callDetails = await getExotelCallDetails(callSid);
        const status = callDetails.Call.Status;
        setCallStatus(status);

        console.log(`📞 Call Status: ${status} for SID: ${callSid}`);

        if (status === 'completed') {
          clearInterval(interval);
          setCallPollingInterval(null);
          setIsCallInProgress(false);
          
          console.log('📞 Call completed! Recording URL:', callDetails.Call.RecordingUrl);
          
          // Store call data for later use
          setCurrentCallData(callDetails.Call);
          
          toast({
            title: 'Call Completed',
            description: 'Please provide lead details.',
          });

          // Show lead details modal
          setShowLeadModal(true);
          
        } else if (status === 'failed' || status === 'busy' || status === 'no-answer') {
          clearInterval(interval);
          setCallPollingInterval(null);
          setIsCallInProgress(false);
          
          console.log(`📞 Call not answered with status: ${status}`);
          
          // Save to call history with "Not Answered" status
          try {
            const { error: insertError } = await supabase.from('call_history').insert({
              employee_id: userRole?.user_id,
              outcome: 'not_answered',
              notes: `Call was not answered by the recipient. Dialed number: ${phoneNumber}`,
              exotel_call_sid: currentCallSid,
              exotel_status: status,
              exotel_from_number: fromNumber,
              exotel_to_number: phoneNumber,
              exotel_caller_id: callerId,
              exotel_response: {},
            });
            
            if (insertError) {
              console.error('❌ Error saving call to history:', insertError);
            } else {
              console.log('✅ Call recorded in history as "not_answered"');
              if (onCallComplete) onCallComplete();
            }
          } catch (error) {
            console.error('❌ Error saving call to history:', error);
          }
          
          toast({
            title: 'Call Not Answered',
            description: 'The call was not answered by the recipient.',
            variant: 'destructive',
          });

          // Reset
          setPhoneNumber("");
        }
      } catch (error) {
        console.error('Error polling call status:', error);
      }
    }, 2000);

    setCallPollingInterval(interval);
  };

  const handleMakeCall = async () => {
    if (!phoneNumber.trim() || !fromNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCallInProgress(true);
      setCallStatus('initiating');

      console.log('📞 Initiating call with:', { from: fromNumber, to: phoneNumber, callerId });

      const callResponse = await initiateExotelCall(fromNumber, phoneNumber, callerId);
      console.log('📞 Call Initiation Response:', callResponse);
      
      const callSid = callResponse.Call.Sid;
      console.log('📞 Call SID:', callSid);
      
      setCurrentCallSid(callSid);
      setCallStatus('in-progress');

      startCallPolling(callSid);

      toast({
        title: 'Call Initiated',
        description: 'Call has been initiated successfully!',
      });

    } catch (error: any) {
      console.error('Error initiating call:', error);
      setIsCallInProgress(false);
      setCallStatus('');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLeadSubmit = async () => {
    if (!leadDetails.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter lead name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create lead in database
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          user_id: userRole?.user_id,
          name: leadDetails.name,
          email: leadDetails.email || null,
          contact: phoneNumber,
          company: leadDetails.company || null,
          status: 'contacted',
          assigned_to: userRole?.user_id,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      setCreatedLeadId(leadData.id);
      setShowLeadModal(false);
      setShowCallOutcomeModal(true);

      toast({
        title: 'Success',
        description: 'Lead details saved!',
      });

    } catch (error: any) {
      console.error('Error saving lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save lead details.',
        variant: 'destructive',
      });
    }
  };

  const handleCallOutcomeSubmit = async () => {
    if (!callOutcome.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide call notes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Prepare next follow-up datetime
      let nextFollowUpDateTime = null;
      if (callOutcomeStatus === 'follow_up' && nextFollowUpDate && nextFollowUpTime) {
        nextFollowUpDateTime = new Date(`${nextFollowUpDate}T${nextFollowUpTime}`).toISOString();
      }

      // Save to call history with complete Exotel response
      const callHistoryData = {
        lead_id: createdLeadId,
        employee_id: userRole?.user_id,
        outcome: callOutcomeStatus,
        notes: callOutcome,
        next_follow_up: nextFollowUpDateTime,
        exotel_response: currentCallData,
        exotel_call_sid: currentCallData.Sid,
        exotel_from_number: currentCallData.From,
        exotel_to_number: currentCallData.To,
        exotel_caller_id: currentCallData.PhoneNumberSid,
        exotel_status: currentCallData.Status,
        exotel_duration: currentCallData.Duration,
        exotel_recording_url: currentCallData.RecordingUrl,
        exotel_start_time: currentCallData.StartTime,
        exotel_end_time: currentCallData.EndTime,
        exotel_answered_by: currentCallData.AnsweredBy,
        exotel_direction: currentCallData.Direction,
      };

      const { error: historyError } = await supabase
        .from('call_history')
        .insert(callHistoryData);

      if (historyError) throw historyError;

      // Update lead status
      let newLeadStatus = 'contacted';
      if (callOutcomeStatus === 'completed') {
        newLeadStatus = 'converted';
      } else if (callOutcomeStatus === 'not_interested') {
        newLeadStatus = 'not_interested';
      } else if (callOutcomeStatus === 'follow_up') {
        newLeadStatus = 'follow_up';
      }

      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          status: newLeadStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', createdLeadId);

      if (leadError) {
        console.warn('Failed to update lead status:', leadError);
      }

      toast({
        title: 'Success',
        description: 'Call recorded successfully!',
      });

      // Reset everything
      setShowCallOutcomeModal(false);
      setPhoneNumber("");
      setLeadDetails({ name: "", email: "", company: "" });
      setCallOutcome("");
      setCallOutcomeStatus('follow_up');
      setNextFollowUpDate("");
      setNextFollowUpTime("");
      setCurrentCallData(null);
      setCreatedLeadId(null);

      if (onCallComplete) onCallComplete();

    } catch (error: any) {
      console.error('Error saving call outcome:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save call outcome.',
        variant: 'destructive',
      });
    }
  };

  const dialPadButtons = [
    { label: "1", subLabel: "" },
    { label: "2", subLabel: "ABC" },
    { label: "3", subLabel: "DEF" },
    { label: "4", subLabel: "GHI" },
    { label: "5", subLabel: "JKL" },
    { label: "6", subLabel: "MNO" },
    { label: "7", subLabel: "PQRS" },
    { label: "8", subLabel: "TUV" },
    { label: "9", subLabel: "WXYZ" },
    { label: "*", subLabel: "" },
    { label: "0", subLabel: "+" },
    { label: "#", subLabel: "" },
  ];

  return (
    <>
      <div className="space-y-4">
          {/* From Number Selection */}
          <div>
            <Label htmlFor="fromNumber" className="text-sm">Calling From</Label>
            <Select value={fromNumber} onValueChange={setFromNumber}>
              <SelectTrigger>
                <SelectValue placeholder="Select number" />
              </SelectTrigger>
              <SelectContent>
                {companySettings.from_numbers.map((number) => (
                  <SelectItem key={number} value={number}>
                    {number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display */}
          <div className="relative">
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="text-2xl h-16 text-center font-semibold"
              disabled={isCallInProgress}
            />
            {phoneNumber && !isCallInProgress && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={handleBackspace}
              >
                <Delete className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Call Status */}
          {isCallInProgress && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {callStatus === 'initiating' ? 'Initiating call...' : 
                   callStatus === 'in-progress' ? 'Call in progress...' : 
                   callStatus}
                </span>
              </div>
            </div>
          )}

          {/* Dial Pad */}
          <div className="grid grid-cols-3 gap-3">
            {dialPadButtons.map((btn) => (
              <Button
                key={btn.label}
                variant="outline"
                className="h-16 text-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleNumberClick(btn.label)}
                disabled={isCallInProgress}
              >
                <div className="flex flex-col items-center">
                  <span>{btn.label}</span>
                  {btn.subLabel && (
                    <span className="text-xs font-normal opacity-60">{btn.subLabel}</span>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isCallInProgress || !phoneNumber}
              className="h-12"
            >
              Clear
            </Button>
            <Button
              onClick={handleMakeCall}
              disabled={isCallInProgress || !phoneNumber || !fromNumber}
              className="h-12 bg-green-600 hover:bg-green-700"
            >
              {isCallInProgress ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <PhoneCall className="h-5 w-5 mr-2" />
                  Call
                </>
              )}
            </Button>
          </div>
        </div>

      {/* Lead Details Modal */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Lead Details
            </DialogTitle>
            <DialogDescription>
              Please provide details about the person you just called.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leadName">Name *</Label>
              <Input
                id="leadName"
                value={leadDetails.name}
                onChange={(e) => setLeadDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter lead name"
              />
            </div>
            <div>
              <Label htmlFor="leadEmail">Email</Label>
              <Input
                id="leadEmail"
                type="email"
                value={leadDetails.email}
                onChange={(e) => setLeadDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="leadCompany">Company</Label>
              <Input
                id="leadCompany"
                value={leadDetails.company}
                onChange={(e) => setLeadDetails(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <Label className="text-sm font-medium">Phone Number</Label>
              <p className="text-lg font-semibold">{phoneNumber}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowLeadModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleLeadSubmit} disabled={!leadDetails.name.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Outcome Modal */}
      <Dialog open={showCallOutcomeModal} onOpenChange={setShowCallOutcomeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              Call Outcome
            </DialogTitle>
            <DialogDescription>
              How did the call go? Please provide feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="callOutcomeStatus">Call Outcome *</Label>
              <Select value={callOutcomeStatus} onValueChange={(value: any) => setCallOutcomeStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select call outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="callNotes">Call Notes *</Label>
              <Input
                id="callNotes"
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                placeholder="How was the call? What was discussed?"
              />
            </div>
            {callOutcomeStatus === 'follow_up' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="followUpDate">Follow-up Date *</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="followUpTime">Follow-up Time *</Label>
                  <Input
                    id="followUpTime"
                    type="time"
                    value={nextFollowUpTime}
                    onChange={(e) => setNextFollowUpTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCallOutcomeModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCallOutcomeSubmit} 
                disabled={!callOutcome.trim() || (callOutcomeStatus === 'follow_up' && (!nextFollowUpDate || !nextFollowUpTime))}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

