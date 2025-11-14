import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Phone, 
  TrendingUp, 
  BarChart3,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  User,
  Target,
  Award,
  Activity
} from "lucide-react";

interface Manager {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  employees?: Employee[];
}

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  manager_id: string;
}

interface CallStats {
  total_calls: number;
  completed_calls: number;
  follow_up_calls: number;
  not_interested: number;
  conversion_rate: number;
}

interface AnalysisStats {
  avg_sentiment: number;
  avg_engagement: number;
  avg_confidence: number;
  total_analyses: number;
}

export default function AdminReportsPage() {
  const { userRole, company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managerStats, setManagerStats] = useState<Map<string, any>>(new Map());
  const [employeeStats, setEmployeeStats] = useState<Map<string, any>>(new Map());
  const [companyOverview, setCompanyOverview] = useState<any>(null);

  useEffect(() => {
    if (userRole) {
      fetchReportData();
    }
  }, [userRole, timePeriod, selectedDate]);

  const getDateRange = () => {
    const date = new Date(selectedDate);
    let startDate: Date;
    let endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    if (timePeriod === 'daily') {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
    } else if (timePeriod === 'weekly') {
      startDate = new Date(date);
      startDate.setDate(date.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(date);
      startDate.setDate(date.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchReportData = async () => {
    if (!userRole) {
      console.log('No userRole found');
      return;
    }

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      console.log('==================== ADMIN REPORTS DATA FETCH ====================');
      console.log('Fetching report data');
      console.log('Time Period:', timePeriod);
      console.log('Selected Date:', selectedDate);
      console.log('Date range:', { 
        startDate, 
        endDate,
        startDateLocal: new Date(startDate).toLocaleString(),
        endDateLocal: new Date(endDate).toLocaleString()
      });

      // Fetch all managers (removed is_active filter to see all managers)
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
;

      if (managersError) {
        console.error('Error fetching managers:', managersError);
        throw managersError;
      }
      
      console.log('Managers fetched:', managersData?.length || 0, managersData);

      // Fetch all employees (removed is_active filter to see all employees)
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
;

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }
      
      console.log('Employees fetched:', employeesData?.length || 0, employeesData);

      setManagers(managersData || []);
      setEmployees(employeesData || []);

      // Fetch calls for the period
      // Note: employee_id in call_history is actually the user_id from employees table
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (callsError) {
        console.error('Error fetching calls:', callsError);
        throw callsError;
      }
      
      console.log('Calls fetched:', callsData?.length || 0);
      console.log('Call details:', callsData?.map(c => ({
        id: c.id,
        employee_id: c.employee_id,
        outcome: c.outcome,
        created_at: c.created_at,
        created_at_local: new Date(c.created_at).toLocaleString()
      })));

      // Fetch analyses for the period
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
        throw analysesError;
      }
      
      console.log('Analyses fetched:', analysesData?.length || 0, analysesData);

      // Create a map of call_id to employee_id for quick lookup
      const callIdToEmployeeMap = new Map();
      callsData?.forEach(call => {
        callIdToEmployeeMap.set(call.id, call.employee_id);
      });

      // Calculate stats for each manager
      const managerStatsMap = new Map();
      managersData?.forEach(manager => {
        const managerEmployees = employeesData?.filter(emp => emp.manager_id === manager.id) || [];
        // Get user_ids of employees under this manager
        const employeeUserIds = managerEmployees.map(emp => emp.user_id);
        
        // Match calls by employee_id (which is actually user_id in call_history)
        const managerCalls = callsData?.filter(call => 
          call.employee_id && employeeUserIds.includes(call.employee_id)
        ) || [];
        
        // Match analyses by checking if the call_id belongs to employees under this manager
        const managerAnalyses = analysesData?.filter(analysis => {
          const employeeId = callIdToEmployeeMap.get(analysis.call_id);
          return employeeId && employeeUserIds.includes(employeeId);
        }) || [];

        const completedAnalyses = managerAnalyses.filter(a => a.status?.toLowerCase() === 'completed');

        managerStatsMap.set(manager.id, {
          total_employees: managerEmployees.length,
          total_calls: managerCalls.length,
          completed_calls: managerCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length,
          follow_up_calls: managerCalls.filter(c => c.outcome === 'follow_up').length,
          not_interested: managerCalls.filter(c => c.outcome === 'not_interested').length,
          conversion_rate: managerCalls.length > 0 ? 
            ((managerCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / managerCalls.length) * 100).toFixed(1) : 0,
          avg_sentiment: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_engagement: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_confidence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + ((parseFloat(a.confidence_score_executive) + parseFloat(a.confidence_score_person)) / 2 || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          total_analyses: completedAnalyses.length,
          employees: managerEmployees
        });
      });

      setManagerStats(managerStatsMap);

      // Calculate stats for each employee
      const employeeStatsMap = new Map();
      employeesData?.forEach(employee => {
        const employeeCalls = callsData?.filter(call => call.employee_id === employee.user_id) || [];
        // Match analyses by checking if the call_id belongs to this employee
        const employeeAnalyses = analysesData?.filter(analysis => {
          const employeeId = callIdToEmployeeMap.get(analysis.call_id);
          return employeeId === employee.user_id;
        }) || [];

        const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');

        employeeStatsMap.set(employee.id, {
          total_calls: employeeCalls.length,
          completed_calls: employeeCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length,
          follow_up_calls: employeeCalls.filter(c => c.outcome === 'follow_up').length,
          not_interested: employeeCalls.filter(c => c.outcome === 'not_interested').length,
          conversion_rate: employeeCalls.length > 0 ? 
            ((employeeCalls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / employeeCalls.length) * 100).toFixed(1) : 0,
          avg_sentiment: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_engagement: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          avg_confidence: completedAnalyses.length > 0 ?
            (completedAnalyses.reduce((sum, a) => sum + ((parseFloat(a.confidence_score_executive) + parseFloat(a.confidence_score_person)) / 2 || 0), 0) / completedAnalyses.length).toFixed(1) : 0,
          total_analyses: completedAnalyses.length
        });
      });

      setEmployeeStats(employeeStatsMap);

      // Company overview (filter only active managers and employees for overview)
      const activeManagers = managersData?.filter(m => m.is_active === true) || [];
      const activeEmployees = employeesData?.filter(e => e.is_active === true) || [];
      
      console.log('Active managers count:', activeManagers.length);
      console.log('Active employees count:', activeEmployees.length);
      
      const totalCalls = callsData?.length || 0;
      const completedCalls = callsData?.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length || 0;
      const allCompletedAnalyses = analysesData?.filter(a => a.status?.toLowerCase() === 'completed') || [];

      console.log('Total calls in period:', totalCalls);
      console.log('Completed calls:', completedCalls);
      console.log('All calls outcomes:', callsData?.map(c => c.outcome));

      const overview = {
        total_managers: activeManagers.length,
        total_employees: activeEmployees.length,
        total_calls: totalCalls,
        completed_calls: completedCalls,
        conversion_rate: totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0,
        avg_sentiment: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        avg_engagement: allCompletedAnalyses.length > 0 ?
          (allCompletedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / allCompletedAnalyses.length).toFixed(1) : 0,
        total_analyses: allCompletedAnalyses.length
      };
      
      console.log('==================== COMPANY OVERVIEW ====================');
      console.log('Company Overview:', overview);
      console.log('==========================================================');
      setCompanyOverview(overview);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Simple CSV export
    let csv = `Company Report - ${company?.name}\n`;
    csv += `Period: ${timePeriod.toUpperCase()}\n`;
    csv += `Date: ${selectedDate}\n\n`;
    
    csv += `Company Overview\n`;
    csv += `Total Managers,${companyOverview?.total_managers}\n`;
    csv += `Total Employees,${companyOverview?.total_employees}\n`;
    csv += `Total Calls,${companyOverview?.total_calls}\n`;
    csv += `Conversion Rate,${companyOverview?.conversion_rate}%\n\n`;

    csv += `Manager Performance\n`;
    csv += `Manager Name,Email,Employees,Total Calls,Completed,Conversion Rate,Avg Sentiment\n`;
    managers.forEach(manager => {
      const stats = managerStats.get(manager.id);
      csv += `${manager.full_name},${manager.email},${stats?.total_employees || 0},${stats?.total_calls || 0},${stats?.completed_calls || 0},${stats?.conversion_rate || 0}%,${stats?.avg_sentiment || 0}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${timePeriod}-${selectedDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Admin Reports</h2>
          <p className="text-muted-foreground">Comprehensive performance reports for all managers and employees</p>
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
                  <SelectItem value="weekly">Weekly (Last 7 days)</SelectItem>
                  <SelectItem value="monthly">Monthly (Last 30 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.total_managers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.total_employees || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.total_calls || 0}</div>
            <p className="text-xs text-green-600 font-medium">
              {companyOverview?.completed_calls || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyOverview?.conversion_rate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Sentiment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{companyOverview?.avg_sentiment || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{companyOverview?.avg_engagement || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{companyOverview?.total_analyses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed analyses</p>
          </CardContent>
        </Card>
      </div>

      {/* Manager Performance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manager Performance
          </CardTitle>
          <CardDescription>Detailed performance metrics for each manager and their team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {managers.filter(m => m.is_active === true).map(manager => {
              const stats = managerStats.get(manager.id);
              const managerEmployees = employees.filter(emp => emp.manager_id === manager.id && emp.is_active === true);

              return (
                <div key={manager.id} className="border rounded-lg p-4">
                  {/* Manager Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{manager.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                    <Badge variant="outline">{stats?.total_employees || 0} Employees</Badge>
                  </div>

                  {/* Manager Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats?.total_calls || 0}</div>
                      <p className="text-xs text-blue-600 font-medium">Total Calls</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats?.completed_calls || 0}</div>
                      <p className="text-xs text-green-600 font-medium">Completed</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats?.conversion_rate || 0}%</div>
                      <p className="text-xs text-purple-600 font-medium">Conversion Rate</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats?.avg_sentiment || 0}%</div>
                      <p className="text-xs text-orange-600 font-medium">Avg Sentiment</p>
                    </div>
                  </div>

                  {/* Employee List for this Manager */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-3">Team Members Performance</h4>
                    <div className="space-y-2">
                      {managerEmployees.map(employee => {
                        const empStats = employeeStats.get(employee.id);
                        return (
                          <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{employee.full_name}</p>
                                <p className="text-xs text-muted-foreground">{employee.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold">{empStats?.total_calls || 0}</div>
                                <div className="text-xs text-muted-foreground">Calls</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-green-600">{empStats?.completed_calls || 0}</div>
                                <div className="text-xs text-muted-foreground">Completed</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-purple-600">{empStats?.conversion_rate || 0}%</div>
                                <div className="text-xs text-muted-foreground">Conv. Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-blue-600">{empStats?.avg_sentiment || 0}%</div>
                                <div className="text-xs text-muted-foreground">Sentiment</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-orange-600">{empStats?.avg_engagement || 0}%</div>
                                <div className="text-xs text-muted-foreground">Engagement</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {managerEmployees.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No employees under this manager</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {managers.filter(m => m.is_active === true).length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active managers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

