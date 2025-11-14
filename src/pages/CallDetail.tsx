import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, User as UserIcon, Calendar, Clock, Headphones, FileText, ArrowLeft, PhoneCall, PlayCircle, Link as LinkIcon, Edit, Save } from "lucide-react";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function CallDetail() {
  const query = useQuery();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any | null>(null);
  const [isEditingRecordingUrl, setIsEditingRecordingUrl] = useState(false);
  const [recordingUrlInput, setRecordingUrlInput] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  const callHistoryId = query.get("id");
  const leadId = query.get("leadId");
  const employeeId = query.get("employeeId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let resp;
        if (callHistoryId) {
          resp = await supabase
            .from("call_history")
            .select(`
              *,
              leads (name, email, contact),
              employees (full_name, email)
            `)
            .eq("id", callHistoryId)
            .single();
        } else if (leadId && employeeId) {
          resp = await supabase
            .from("call_history")
            .select(`
              *,
              leads (name, email, contact),
              employees (full_name, email)
            `)
            .eq("lead_id", leadId)
            .eq("employee_id", employeeId)
            .order("created_at", { ascending: false })
            .limit(1);
          if (!resp.error && Array.isArray(resp.data)) {
            resp = { data: resp.data[0], error: null } as any;
          }
        } else {
          throw new Error("Missing identifiers. Provide id or leadId and employeeId.");
        }

        if (resp.error) throw resp.error;
        setRecord(resp.data || null);
      } catch (error: any) {
        console.error("Failed to fetch call details:", error);
        toast({ title: "Error", description: error.message || "Failed to load details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [callHistoryId, leadId, employeeId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground">Loading call details…</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>No details found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">We couldn't locate a matching record in `call_history`.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = record.created_at ? new Date(record.created_at).toLocaleString() : undefined;
  const followUpDate = record.next_follow_up ? new Date(record.next_follow_up).toLocaleString() : undefined;
  
  // Format call start and end times
  const formatCallDateTime = (dateString: string | null) => {
    if (!dateString) return '—';
    if (dateString === '1970-01-01T05:30:00+00:00' || dateString === '1970-01-01 05:30:00+00') return '—';
    
    // For Exotel API format (YYYY-MM-DD HH:mm:ss or YYYY-MM-DD HH:mm:ss+00)
    if (dateString.includes(' ') && !dateString.includes('T')) {
      return dateString.replace(/\+00$/, '');
    }
    
    return new Date(dateString).toLocaleString();
  };
  
  const startTime = formatCallDateTime(record.exotel_start_time);
  const endTime = formatCallDateTime(record.exotel_end_time);

  const handleSaveRecordingUrl = async () => {
    if (!record?.id || !recordingUrlInput.trim()) {
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
        .eq('id', record.id);

      if (error) throw error;

      // Update local state
      setRecord((prev: any) => prev ? { ...prev, exotel_recording_url: recordingUrlInput.trim() } : null);
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
    if (record) {
      setRecordingUrlInput(record.exotel_recording_url || '');
    }
  }, [record]);

  return (
    <div className="min-h-screen p-6">
      {/* Hero */}
      <div className="mb-6 rounded-xl border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">Call with {record.leads?.name || 'Lead'}</div>
              <div className="text-xs opacity-90 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formattedDate || '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {record.outcome && (
              <Badge variant="secondary" className="bg-white/10 border-white/20 text-white">
                {String(record.outcome).replace('_',' ').toUpperCase()}
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-white text-gray-800 hover:bg-white/90">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-blue-600" /><span className="font-medium">Name:</span> <span className="text-muted-foreground">{record.leads?.name || '—'}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /><span className="font-medium">Email:</span> <span className="text-muted-foreground">{record.leads?.email || '—'}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600" /><span className="font-medium">Contact:</span> <span className="text-muted-foreground">{record.leads?.contact || '—'}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Headphones className="h-4 w-4" /> Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-indigo-600" /><span className="font-medium">Name:</span> <span className="text-muted-foreground">{record.employees?.full_name || '—'}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-indigo-600" /><span className="font-medium">Email:</span> <span className="text-muted-foreground">{record.employees?.email || '—'}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Call Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Badge variant="outline">Outcome</Badge> <span className="text-muted-foreground">{record.outcome ? String(record.outcome).replace('_',' ') : '—'}</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline">Provider Status</Badge> <span className="text-muted-foreground">{record.exotel_status || '—'}</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline">Direction</Badge> <span className="text-muted-foreground">{record.exotel_direction || '—'}</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline">Duration</Badge> <span className="text-muted-foreground">{record.exotel_duration ? `${record.exotel_duration}s` : '—'}</span></div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-green-600" /><span className="font-medium">Start Time:</span> <span className="text-muted-foreground">{startTime}</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-red-600" /><span className="font-medium">End Time:</span> <span className="text-muted-foreground">{endTime}</span></div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="font-medium text-sm">Notes:</span>
              <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">{record.notes || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /><span className="font-medium">Next Follow-up:</span> <span className="text-muted-foreground">{followUpDate || '—'}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Call Recording</CardTitle>
          </CardHeader>
          <CardContent>
            {record.exotel_recording_url && !isEditingRecordingUrl ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <LinkIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">Recording URL:</span>
                    <div className="mt-1 p-2 bg-muted rounded border text-xs break-all">
                      {record.exotel_recording_url}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.open(record.exotel_recording_url, '_blank')} 
                    className="gap-2 flex-1"
                    size="sm"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Play Recording
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(record.exotel_recording_url);
                      toast({ title: "Copied!", description: "Recording URL copied to clipboard" });
                    }}
                    size="sm"
                    className="gap-2 flex-1"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Copy URL
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditingRecordingUrl(true);
                      setRecordingUrlInput(record.exotel_recording_url || '');
                    }}
                    size="sm"
                    className="gap-2 flex-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
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
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                    {savingUrl ? 'Saving...' : 'Save URL'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingRecordingUrl(false);
                      setRecordingUrlInput(record.exotel_recording_url || '');
                    }}
                    disabled={savingUrl}
                    className="flex-1"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No recording available for this call</p>
                <Button
                  onClick={() => setIsEditingRecordingUrl(true)}
                  className="gap-2"
                  size="sm"
                >
                  <Edit className="h-4 w-4" />
                  Add Recording URL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


