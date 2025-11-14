import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Phone, Clock, User, Calendar, FileText, Play, Download, Save, Edit } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface CallHistoryRecord {
  id: string;
  lead_id: string;
  employee_id: string;
  company_id: string;
  call_date: string;
  outcome: string;
  notes: string;
  next_follow_up: string | null;
  exotel_response: any;
  exotel_call_sid: string;
  exotel_from_number: string;
  exotel_to_number: string;
  exotel_caller_id: string;
  exotel_status: string;
  exotel_duration: number | null;
  exotel_recording_url: string | null;
  exotel_start_time: string;
  exotel_end_time: string;
  exotel_answered_by: string | null;
  exotel_direction: string;
  created_at: string;
  updated_at: string;
  leads: {
    name: string;
    email: string;
    contact: string;
  };
  employees: {
    full_name: string;
    email: string;
  };
}

const CallDetails: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [callData, setCallData] = useState<CallHistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingRecordingUrl, setIsEditingRecordingUrl] = useState(false);
  const [recordingUrlInput, setRecordingUrlInput] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    if (callId) {
      fetchCallDetails();
    }
  }, [callId]);

  const fetchCallDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('call_history')
        .select(`
          *,
          leads:lead_id(name, email, contact),
          employees:employee_id(full_name, email)
        `)
        .eq('id', callId)
        .single();

      if (error) throw error;

      setCallData(data);
    } catch (error: any) {
      console.error('Error fetching call details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load call details. Please try again.',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === '1970-01-01T05:30:00+00:00' || dateString === '1970-01-01 05:30:00+00') return 'N/A';
    
    // For Exotel API format (YYYY-MM-DD HH:mm:ss or YYYY-MM-DD HH:mm:ss+00), display as-is
    if (dateString.includes(' ') && !dateString.includes('T')) {
      // Remove timezone info if present to show clean format
      return dateString.replace(/\+00$/, ''); // Remove +00 at the end
    }
    
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'no-answer':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'follow_up':
        return 'bg-blue-100 text-blue-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      case 'interested':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveRecordingUrl = async () => {
    if (!callId || !recordingUrlInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid recording URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingUrl(true);
      const { error } = await supabase
        .from('call_history')
        .update({ exotel_recording_url: recordingUrlInput.trim() })
        .eq('id', callId);

      if (error) throw error;

      // Update local state
      setCallData(prev => prev ? { ...prev, exotel_recording_url: recordingUrlInput.trim() } : null);
      setIsEditingRecordingUrl(false);
      
      toast({
        title: 'Success',
        description: 'Recording URL saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving recording URL:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save recording URL. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingUrl(false);
    }
  };

  useEffect(() => {
    if (callData) {
      setRecordingUrlInput(callData.exotel_recording_url || '');
    }
  }, [callData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading call details...</p>
        </div>
      </div>
    );
  }

  if (!callData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Call details not found</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call Details</h1>
              <p className="text-gray-600">Complete call information and Exotel response</p>
            </div>
          </div>
          <Badge className={`${getStatusColor(callData.exotel_status)} px-3 py-1`}>
            {callData.exotel_status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Call ID</label>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">{callData.exotel_call_sid}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="text-sm">{formatDuration(callData.exotel_duration)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">From</label>
                  <p className="text-sm">{callData.exotel_from_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">To</label>
                  <p className="text-sm">{callData.exotel_to_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Caller ID</label>
                  <p className="text-sm">{callData.exotel_caller_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Direction</label>
                  <p className="text-sm">{callData.exotel_direction}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Time</label>
                  <p className="text-sm">{callData.exotel_start_time ? new Date(callData.exotel_start_time).toISOString().slice(0, 16).replace('T', ' ') : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Time</label>
                  <p className="text-sm">{callData.exotel_end_time ? new Date(callData.exotel_end_time).toISOString().slice(0, 16).replace('T', ' ') : 'N/A'}</p>
                </div>
              </div>

              {callData.exotel_answered_by && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Answered By</label>
                  <p className="text-sm">{callData.exotel_answered_by}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Lead Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Lead Name</label>
                <p className="text-sm font-medium">{callData.leads.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{callData.leads.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact</label>
                <p className="text-sm">{callData.leads.contact}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Employee</label>
                <p className="text-sm">{callData.employees.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Call Outcome</label>
                <Badge className={`${getOutcomeColor(callData.outcome)} px-3 py-1`}>
                  {callData.outcome.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recording */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Call Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {callData.exotel_recording_url && !isEditingRecordingUrl ? (
                  <>
                    <audio controls className="w-full">
                      <source src={callData.exotel_recording_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(callData.exotel_recording_url, '_blank')}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Recording
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingRecordingUrl(true);
                          setRecordingUrlInput(callData.exotel_recording_url || '');
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit URL
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <strong>Recording URL:</strong> {callData.exotel_recording_url}
                    </div>
                  </>
                ) : isEditingRecordingUrl ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="recordingUrl">Recording URL</Label>
                      <Input
                        id="recordingUrl"
                        type="url"
                        value={recordingUrlInput}
                        onChange={(e) => setRecordingUrlInput(e.target.value)}
                        placeholder="https://example.com/recording.mp3"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveRecordingUrl}
                        disabled={savingUrl || !recordingUrlInput.trim()}
                        className="flex-1 gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {savingUrl ? 'Saving...' : 'Save URL'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingRecordingUrl(false);
                          setRecordingUrlInput(callData.exotel_recording_url || '');
                        }}
                        disabled={savingUrl}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No recording available</p>
                    <p className="text-xs text-gray-400 mb-4">
                      This could be due to Exotel configuration or call type settings.
                    </p>
                    <Button
                      onClick={() => setIsEditingRecordingUrl(true)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Add Recording URL
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes & Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Call Notes</label>
                <p className="text-sm bg-gray-50 p-3 rounded min-h-[80px]">
                  {callData.notes || 'No notes available'}
                </p>
              </div>
              {callData.next_follow_up && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Follow-up</label>
                  <p className="text-sm">{new Date(callData.next_follow_up).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Complete Exotel Response */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complete Exotel API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {JSON.stringify(callData.exotel_response, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallDetails;
