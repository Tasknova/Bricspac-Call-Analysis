import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  TrendingUp, 
  BarChart3,
  Download,
  Target,
  Activity,
  ThumbsUp,
  MessageSquare,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function EmployeeReportsPage() {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly' | 'custom'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [customFromDate, setCustomFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [customToDate, setCustomToDate] = useState(new Date().toISOString().split('T')[0]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [callsBreakdown, setCallsBreakdown] = useState<any[]>([]);

  useEffect(() => {
    if (userRole?.user_id) {
      fetchReportData();
    }
  }, [userRole, timePeriod, selectedDate, customFromDate, customToDate]);

  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    if (timePeriod === 'custom') {
      // Use custom date range
      startDate = new Date(customFromDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customToDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (timePeriod === 'daily') {
      // Single day
      const date = new Date(selectedDate);
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Monthly - last 30 days
      const date = new Date(selectedDate);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(date);
      startDate.setDate(date.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchReportData = async () => {
    if (!userRole?.user_id) {
      console.log('No user_id found in userRole:', userRole);
      return;
    }

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      console.log('==================== EMPLOYEE REPORTS DATA FETCH ====================');
      console.log('User Role:', userRole);
      console.log('Fetching report data for employee user_id:', userRole.user_id);
      console.log('Time Period:', timePeriod);
      console.log('Selected Date:', selectedDate);
      console.log('Date range:', { 
        startDate, 
        endDate,
        startDateLocal: new Date(startDate).toLocaleString(),
        endDateLocal: new Date(endDate).toLocaleString()
      });
      
      // Verify employee exists in database
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('id, user_id, full_name, email, manager_id, is_active')
        .eq('user_id', userRole.user_id)
        .single();
      
      if (empError) {
        console.error('Error fetching employee data:', empError);
      } else {
        console.log('Employee data:', employeeData);
      }

      // Fetch calls for the period (without leads join first)
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*')
        .eq('employee_id', userRole.user_id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Error fetching calls:', callsError);
        throw callsError;
      }
      
      console.log('Calls fetched:', callsData?.length || 0);
      console.log('Call details:', callsData?.map(c => ({
        id: c.id,
        lead_id: c.lead_id,
        outcome: c.outcome,
        created_at: c.created_at,
        created_at_local: new Date(c.created_at).toLocaleString()
      })));
      
      // Fetch lead details separately for better error handling
      const leadIds = callsData?.map(c => c.lead_id).filter(Boolean) || [];
      let leadsMap = new Map();
      
      if (leadIds.length > 0) {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, email, contact')
          .in('id', leadIds);
        
        if (leadsError) {
          console.error('Error fetching leads:', leadsError);
        } else if (leadsData) {
          leadsData.forEach(lead => {
            leadsMap.set(lead.id, lead);
          });
          console.log('Leads fetched:', leadsData.length);
        }
      }
      
      // Attach lead info to calls
      const callsWithLeads = callsData?.map(call => ({
        ...call,
        leads: call.lead_id ? leadsMap.get(call.lead_id) : null
      })) || [];

      // Fetch analyses for the period
      const callIds = (callsData || []).map(call => call.id);
      let analysesData = [];
      
      if (callIds.length > 0) {
        const { data: analyses, error: analysesError } = await supabase
          .from('analyses')
          .select('*')
          .in('call_id', callIds);

        if (analysesError) {
          console.error('Error fetching analyses:', analysesError);
          // Don't throw, just log and continue with empty analyses
        } else {
          analysesData = analyses || [];
        }
      }
      
      console.log('Analyses fetched:', analysesData?.length || 0);

      // Calculate performance metrics
      const totalCalls = callsWithLeads?.length || 0;
      const completedCalls = callsWithLeads?.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length || 0;
      const followUpCalls = callsWithLeads?.filter(c => c.outcome === 'follow_up').length || 0;
      const notInterestedCalls = callsWithLeads?.filter(c => c.outcome === 'not_interested').length || 0;
      const notAnsweredCalls = callsWithLeads?.filter(c => c.outcome === 'not_answered').length || 0;

      console.log('Total calls in period:', totalCalls);
      console.log('Completed calls:', completedCalls);
      console.log('Follow-up calls:', followUpCalls);
      console.log('Not interested calls:', notInterestedCalls);
      console.log('Not answered calls:', notAnsweredCalls);
      console.log('All calls outcomes:', callsWithLeads?.map(c => c.outcome));

      const completedAnalyses = (analysesData || []).filter(a => a && a.status?.toLowerCase() === 'completed');
      
      console.log('Completed analyses:', completedAnalyses.length);

      const avgSentiment = completedAnalyses.length > 0 ?
        (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / completedAnalyses.length).toFixed(1) : '0';
      
      const avgEngagement = completedAnalyses.length > 0 ?
        (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / completedAnalyses.length).toFixed(1) : '0';
      
      const avgConfidence = completedAnalyses.length > 0 ?
        (completedAnalyses.reduce((sum, a) => {
          const execScore = parseFloat(a.confidence_score_executive) || 0;
          const personScore = parseFloat(a.confidence_score_person) || 0;
          return sum + ((execScore + personScore) / 2);
        }, 0) / completedAnalyses.length).toFixed(1) : '0';

      const perfData = {
        total_calls: totalCalls,
        completed_calls: completedCalls,
        follow_up_calls: followUpCalls,
        not_interested_calls: notInterestedCalls,
        not_answered_calls: notAnsweredCalls,
        conversion_rate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0,
        avg_sentiment: avgSentiment,
        avg_engagement: avgEngagement,
        avg_confidence: avgConfidence,
        total_analyses: completedAnalyses.length,
        calls: callsWithLeads || []
      };
      
      console.log('==================== EMPLOYEE PERFORMANCE DATA ====================');
      console.log('Performance Data:', perfData);
      console.log('===================================================================');
      
      setPerformanceData(perfData);

      // Set calls breakdown for detailed view
      setCallsBreakdown(callsWithLeads || []);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    let csv = `Employee Performance Report\n`;
    csv += `Period: ${timePeriod.toUpperCase()}\n`;
    csv += `Date: ${selectedDate}\n\n`;
    
    csv += `Performance Summary\n`;
    csv += `Total Calls,${performanceData?.total_calls}\n`;
    csv += `Completed Calls,${performanceData?.completed_calls}\n`;
    csv += `Conversion Rate,${performanceData?.conversion_rate}%\n`;
    csv += `Avg Sentiment,${performanceData?.avg_sentiment}%\n`;
    csv += `Avg Engagement,${performanceData?.avg_engagement}%\n\n`;

    csv += `Call Details\n`;
    csv += `Date,Lead Name,Lead Contact,Outcome,Notes\n`;
    callsBreakdown.forEach(call => {
      csv += `${new Date(call.created_at).toLocaleDateString()},${call.leads?.name || 'N/A'},${call.leads?.contact || 'N/A'},${call.outcome},${call.notes?.replace(/,/g, ';') || 'N/A'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-performance-report-${timePeriod}-${selectedDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const performanceScore = parseFloat(performanceData?.conversion_rate || '0');
  const performanceLevel = performanceScore >= 70 ? 'Excellent' : performanceScore >= 50 ? 'Good' : performanceScore >= 30 ? 'Average' : 'Needs Improvement';
  const performanceColor = performanceScore >= 70 ? 'text-green-600' : performanceScore >= 50 ? 'text-blue-600' : performanceScore >= 30 ? 'text-orange-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Performance Reports</h2>
          <p className="text-muted-foreground">Track your call performance and improvement areas</p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly (Last 30 days)</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timePeriod === 'custom' ? (
              <>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    max={customToDate}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    min={customFromDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  {timePeriod === 'daily' ? 'Select Date' : 'End Date (Last 30 days)'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-5xl font-bold ${performanceColor}`}>
                {performanceData?.conversion_rate || 0}%
              </div>
              <p className="text-lg text-muted-foreground mt-2">Conversion Rate</p>
            </div>
            <div className="text-right">
              <Badge variant={performanceScore >= 50 ? "default" : "secondary"} className="text-lg px-4 py-2">
                {performanceLevel}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">Performance Level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.total_calls || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All calls made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{performanceData?.completed_calls || 0}</div>
            <p className="text-xs text-green-600 mt-1">Successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Answered</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{performanceData?.not_answered_calls || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Missed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{performanceData?.follow_up_calls || 0}</div>
            <p className="text-xs text-orange-600 mt-1">Need retry</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Interested</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{performanceData?.not_interested_calls || 0}</div>
            <p className="text-xs text-red-600 mt-1">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Call Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Call Quality Metrics
          </CardTitle>
          <CardDescription>AI-analyzed metrics from your completed calls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <ThumbsUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600">{performanceData?.avg_sentiment || 0}%</div>
              <p className="text-sm text-blue-600 font-medium mt-1">Avg Sentiment</p>
              <p className="text-xs text-muted-foreground mt-1">Customer positivity</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600">{performanceData?.avg_engagement || 0}%</div>
              <p className="text-sm text-green-600 font-medium mt-1">Avg Engagement</p>
              <p className="text-xs text-muted-foreground mt-1">Conversation quality</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600">{performanceData?.avg_confidence || 0}/10</div>
              <p className="text-sm text-purple-600 font-medium mt-1">Avg Confidence</p>
              <p className="text-xs text-muted-foreground mt-1">Speaking confidence</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-orange-600">{performanceData?.total_analyses || 0}</div>
              <p className="text-sm text-orange-600 font-medium mt-1">Total Analyses</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Breakdown Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Call Outcomes Breakdown</CardTitle>
          <CardDescription>Visual representation of your call outcomes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Completed / Converted</span>
              <span className="text-sm text-green-600 font-bold">{performanceData?.completed_calls || 0} ({performanceData?.conversion_rate || 0}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all" 
                style={{ width: `${performanceData?.conversion_rate || 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Follow-up Required</span>
              <span className="text-sm text-orange-600 font-bold">
                {performanceData?.follow_up_calls || 0} 
                ({performanceData?.total_calls > 0 ? ((performanceData.follow_up_calls / performanceData.total_calls) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-orange-600 h-3 rounded-full transition-all" 
                style={{ width: `${performanceData?.total_calls > 0 ? ((performanceData.follow_up_calls / performanceData.total_calls) * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Not Interested</span>
              <span className="text-sm text-red-600 font-bold">
                {performanceData?.not_interested_calls || 0} 
                ({performanceData?.total_calls > 0 ? ((performanceData.not_interested_calls / performanceData.total_calls) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-600 h-3 rounded-full transition-all" 
                style={{ width: `${performanceData?.total_calls > 0 ? ((performanceData.not_interested_calls / performanceData.total_calls) * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Not Answered</span>
              <span className="text-sm text-gray-600 font-bold">
                {performanceData?.not_answered_calls || 0} 
                ({performanceData?.total_calls > 0 ? ((performanceData.not_answered_calls / performanceData.total_calls) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gray-600 h-3 rounded-full transition-all" 
                style={{ width: `${performanceData?.total_calls > 0 ? ((performanceData.not_answered_calls / performanceData.total_calls) * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Call Activity
          </CardTitle>
          <CardDescription>Your latest call records in this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {callsBreakdown.slice(0, 10).map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{call.leads?.name || 'Lead'}</p>
                  <p className="text-sm text-muted-foreground">{call.leads?.contact}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(call.created_at).toLocaleDateString()} at {new Date(call.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant={
                  call.outcome === 'completed' || call.outcome === 'converted' ? 'default' :
                  call.outcome === 'follow_up' ? 'secondary' :
                  'destructive'
                }>
                  {call.outcome?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}
            {callsBreakdown.length === 0 && (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No calls found for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

