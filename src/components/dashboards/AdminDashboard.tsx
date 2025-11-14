import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import CallHistoryManager from "@/components/CallHistoryManager";
import AdminReportsPage from "@/components/AdminReportsPage";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { 
  Building, 
  Users, 
  UserPlus, 
  Phone, 
  TrendingUp, 
  Settings, 
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  LogOut,
  User,
  Mail,
  PhoneCall,
  Calendar,
  Shield,
  AlertTriangle,
  Save,
  X,
  RefreshCw,
  Edit2,
  History,
  BarChart3,
  Clock,
  Upload,
  FileText,
  ArrowLeft,
  CheckCircle,
  UserCog,
  Brain,
  PlayCircle,
  ExternalLink,
  Plug
} from "lucide-react";

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: string;
  phone?: string;
  profile?: { full_name: string; email: string; department?: string; password?: string } | null;
}

interface Manager extends User {
  employees: User[];
}

interface UserCredentials {
  email: string;
  password: string;
  role: string;
  name: string;
}

// Department options for managers
const DEPARTMENT_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Customer Support' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'other', label: 'Other' }
];

export default function AdminDashboard() {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadGroups, setLeadGroups] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [analysisTab, setAnalysisTab] = useState<'analyzed' | 'ready'>('analyzed');
  const [analyzedCalls, setAnalyzedCalls] = useState<any[]>([]);
  const [readyToAnalyzeCalls, setReadyToAnalyzeCalls] = useState<any[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isViewingGroupPage, setIsViewingGroupPage] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddLeadGroupModalOpen, setIsAddLeadGroupModalOpen] = useState(false);
  const [isEditLeadGroupModalOpen, setIsEditLeadGroupModalOpen] = useState(false);
  const [isViewLeadGroupModalOpen, setIsViewLeadGroupModalOpen] = useState(false);
  const [isDeleteLeadGroupModalOpen, setIsDeleteLeadGroupModalOpen] = useState(false);
  const [selectedLeadGroup, setSelectedLeadGroup] = useState<any>(null);
  const [isUploadCSVModalOpen, setIsUploadCSVModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLeads, setCsvLeads] = useState<any[]>([]);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvGroupOption, setCsvGroupOption] = useState<'none' | 'existing' | 'new'>('none');
  const [csvSelectedGroupId, setCsvSelectedGroupId] = useState<string>('');
  const [csvNewGroupName, setCsvNewGroupName] = useState<string>('');
  const [csvAssignedTo, setCsvAssignedTo] = useState<string>('unassigned');
  const [isViewLeadModalOpen, setIsViewLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [isDeleteLeadModalOpen, setIsDeleteLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [leadsSection, setLeadsSection] = useState<'leads' | 'groups'>('leads');
  const [addUserType, setAddUserType] = useState<'manager' | 'employee'>('manager');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<UserCredentials | null>(null);
  const [copiedItems, setCopiedItems] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>('all');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [showUserDetailsPassword, setShowUserDetailsPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    contact: '',
  });
  const [clientData, setClientData] = useState<any>(null);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [isEditingIntegrations, setIsEditingIntegrations] = useState(false);
  const [exotelCredentials, setExotelCredentials] = useState({
    exotel_api_key: '',
    exotel_api_token: '',
    exotel_subdomain: 'api.exotel.com',
    exotel_account_sid: '',
  });
  const [showCredentials, setShowCredentials] = useState({
    api_key: false,
    api_token: false,
    account_sid: false,
  });
  
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "manager" as "manager" | "employee",
    managerId: "",
    department: "",
    phone: "",
  });
  const [customDepartment, setCustomDepartment] = useState("");
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    contact: "",
    description: "",
    assignedTo: "",
    groupId: "",
  });
  const [newLeadGroup, setNewLeadGroup] = useState({
    groupName: "",
    assignedTo: "",
  });

  const [editUser, setEditUser] = useState({
    id: "",
    email: "",
    password: "",
    fullName: "",
    role: "manager" as "manager" | "employee",
    managerId: "",
    department: "",
    phone: "",
    is_active: true,
  });

  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    fullName: "",
    managerId: "",
    phone: "",
  });

  // Settings state
  const [companySettings, setCompanySettings] = useState({
    caller_id: "09513886363",
    from_numbers: ["7887766008"],
  });
  const [newFromNumber, setNewFromNumber] = useState("");

  useEffect(() => {
    if (userRole) {
      fetchUsers();
      fetchCompanySettings();
      fetchClientData();
    }
  }, [userRole]);

  const fetchClientData = async () => {
    try {
      // Fetch the first client (since it's single company system)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching client data:', error);
        return;
      }

      if (data) {
        setClientData(data);
        setCompanyData({
          name: data.name || '',
          email: data.email || '',
          contact: data.contact || '',
        });
        // Set Exotel credentials
        setExotelCredentials({
          exotel_api_key: data.exotel_api_key || '',
          exotel_api_token: data.exotel_api_token || '',
          exotel_subdomain: data.exotel_subdomain || 'api.exotel.com',
          exotel_account_sid: data.exotel_account_sid || '',
        });
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
      });
      // Client data will be loaded from clients table
    }
  }, [user]);

  // Track addUserType changes
  useEffect(() => {
    console.log('addUserType changed to:', addUserType);
  }, [addUserType]);

  // Reset form when modal opens
  useEffect(() => {
    if (isAddUserModalOpen) {
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        role: addUserType || "manager",
        managerId: "",
        department: "",
      });
      setShowPassword(false);
      console.log('Modal opened, addUserType should be:', addUserType);
    }
  }, [isAddUserModalOpen, addUserType]);

  const fetchUsers = async () => {
    if (!userRole) return;

    try {
      setLoading(true);
      console.log('Fetching users');

      // Fetch managers from managers table
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .eq('is_active', true);

      if (managersError) {
        console.error('Error fetching managers:', managersError);
        throw managersError;
      }
      
      console.log('Fetched managers data:', managersData);
      console.log('Manager passwords:', managersData?.map(m => ({ name: m.full_name, password: m.password })));

      // Fetch employees from employees table
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          manager:managers!manager_id(full_name, department)
        `)
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      console.log('Managers found:', managersData);
      console.log('Employees found:', employeesData);
      console.log('Employee passwords:', employeesData?.map(e => ({ name: e.full_name, password: e.password })));

      // Transform managers data to match expected format
      const managersWithEmployees = managersData?.map(manager => {
        console.log('Transforming manager:', manager.full_name, 'Password:', manager.password);
        return {
          id: manager.id,
          user_id: manager.user_id,
          role: 'manager',
          manager_id: null,
          is_active: manager.is_active,
          created_at: manager.created_at,
          updated_at: manager.updated_at,
          profile: {
            full_name: manager.full_name,
            email: manager.email,
            department: manager.department,
            password: manager.password
          },
          employees: employeesData?.filter(emp => emp.manager_id === manager.id) || []
        };
      }) || [];

      // Transform employees data to match expected format
      const employeesWithProfiles = employeesData?.map(employee => {
        console.log('Transforming employee:', employee.full_name, 'Password:', employee.password);
        return {
          id: employee.id,
          user_id: employee.user_id,
          role: 'employee',
          manager_id: employee.manager_id,
          is_active: employee.is_active,
          created_at: employee.created_at,
          updated_at: employee.updated_at,
          profile: {
            full_name: employee.full_name,
            email: employee.email,
            department: null,
            password: employee.password
          }
        };
      }) || [];

      setManagers(managersWithEmployees);
      setEmployees(employeesWithProfiles);

      // Fetch all leads for this company
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
;

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      } else {
        // Manually join with employees and managers tables
        const leadsWithAssignments = await Promise.all(
          (leadsData || []).map(async (lead) => {
            let assignedEmployee = null;
            let assignedManager = null;

            // Check if assigned_to exists (employee)
            if (lead.assigned_to) {
              const { data: empData } = await supabase
                .from('employees')
                .select('full_name, email')
                .eq('user_id', lead.assigned_to)
                .single();
              assignedEmployee = empData;
            }

            // Check if user_id exists (manager or creator)
            if (lead.user_id) {
              // Try to find in managers table
              const { data: mgrData } = await supabase
                .from('managers')
                .select('full_name, email')
                .eq('user_id', lead.user_id)
                .single();
              
              if (mgrData) {
                assignedManager = mgrData;
              } else {
                // Try to find in employees table
                const { data: empData } = await supabase
                  .from('employees')
                  .select('full_name, email')
                  .eq('user_id', lead.user_id)
                  .single();
                assignedEmployee = empData;
              }
            }

            return {
              ...lead,
              assigned_employee: assignedEmployee,
              assigned_manager: assignedManager,
            };
          })
        );

        setLeads(leadsWithAssignments);
        console.log('Fetched leads:', leadsWithAssignments);
      }

      // Fetch all lead groups for this company
      const { data: leadGroupsData, error: leadGroupsError } = await supabase
        .from('lead_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadGroupsError) {
        console.error('Error fetching lead groups:', leadGroupsError);
      } else {
        setLeadGroups(leadGroupsData || []);
        console.log('Fetched lead groups:', leadGroupsData);
      }

      // Fetch all calls for this company
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*, leads(name, email, contact), employees(full_name, email)')
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Error fetching calls:', callsError);
      } else {
        setCalls(callsData || []);
        console.log('Fetched calls:', callsData);
      }

      // Fetch all analyses for this company
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .in('call_id', callsData?.map(call => call.id) || []);

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
      } else {
        setAnalyses(analysesData || []);
        console.log('Fetched analyses:', analysesData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async () => {
    try {
      setLoadingAnalysis(true);

      // Fetch all calls with recording URLs
      const { data: allCalls, error: callsError } = await supabase
        .from('call_history')
        .select(`
          *,
          leads (
            name,
            email,
            contact
          ),
          employees (
            full_name,
            email
          )
        `)
        .not('exotel_recording_url', 'is', null)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Error fetching calls:', callsError);
        setAnalyzedCalls([]);
        setReadyToAnalyzeCalls([]);
        return;
      }

      // Separate calls into analyzed and ready to analyze based on is_analyzed column
      const analyzed: any[] = [];
      const readyToAnalyze: any[] = [];

      // Fetch analyses for analyzed calls to get analysis details
      const analyzedCallIds = (allCalls || [])
        .filter((call: any) => call.is_analyzed === true)
        .map((call: any) => call.id);

      let analysesMap = new Map();
      if (analyzedCallIds.length > 0) {
        const { data: analysesData, error: analysesError } = await supabase
          .from('analyses')
          .select('*')
          .in('call_id', analyzedCallIds)
          .order('created_at', { ascending: false });

        if (!analysesError && analysesData) {
          analysesData.forEach((analysis: any) => {
            if (analysis.call_id) {
              // Keep the most recent analysis for each call
              if (!analysesMap.has(analysis.call_id)) {
                analysesMap.set(analysis.call_id, analysis);
              }
            }
          });
        }
      }

      (allCalls || []).forEach((call: any) => {
        if (call.is_analyzed === true) {
          // Get the analysis for this call
          const analysis = analysesMap.get(call.id);
          analyzed.push({ ...call, analysis });
        } else {
          // Only include calls that are not "not_answered" in ready to analyze
          // Calls with outcome "not_answered" should not be shown as ready to analyze
          const outcome = call.outcome?.toLowerCase() || '';
          if (outcome !== 'not_answered' && outcome !== 'not answered') {
            readyToAnalyze.push(call);
          }
        }
      });

      setAnalyzedCalls(analyzed);
      setReadyToAnalyzeCalls(readyToAnalyze);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analysis data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (activeSidebarItem === 'analysis' && userRole) {
      fetchAnalysisData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSidebarItem]);

  const fetchCompanySettings = async () => {
    if (!userRole) return;

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching company settings:', error);
        return;
      }

      if (data) {
        setCompanySettings({
          caller_id: data.caller_id || "09513886363",
          from_numbers: data.from_numbers || ["7887766008"],
        });
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const updateCompanySettings = async () => {
    if (!userRole) return;

    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          caller_id: companySettings.caller_id,
          from_numbers: companySettings.from_numbers,
        });

      if (error) throw error;
      toast({
        title: 'Settings Updated',
        description: 'Company settings have been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating company settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addFromNumber = () => {
    const trimmedNumber = newFromNumber.trim();
    
    if (!trimmedNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number.',
        variant: 'destructive',
      });
      return;
    }
    
    if (companySettings.from_numbers.includes(trimmedNumber)) {
      toast({
        title: 'Number Already Exists',
        description: `The phone number "${trimmedNumber}" is already in your from numbers list.`,
        variant: 'destructive',
      });
      return;
    }
    
    setCompanySettings(prev => ({
      ...prev,
      from_numbers: [...prev.from_numbers, trimmedNumber]
    }));
    setNewFromNumber("");
    toast({
      title: 'Success',
      description: 'From number added successfully!',
    });
  };

  const removeFromNumber = (index: number) => {
    setCompanySettings(prev => ({
      ...prev,
      from_numbers: prev.from_numbers.filter((_, i) => i !== index)
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole) return;

    try {
      // Validate email uniqueness within the SAME role only
      const emailToCheck = newUser.email.toLowerCase().trim();
      
      if (addUserType === 'manager') {
        // Check if email already exists as MANAGER
        const { data: existingManagers } = await supabase
          .from('managers')
          .select('email, full_name')
          .eq('email', emailToCheck)
          .eq('is_active', true);

        if (existingManagers && existingManagers.length > 0) {
          toast({
            title: 'Email Already Exists',
            description: `A manager with email ${newUser.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
      } else if (addUserType === 'employee') {
        // Check if email already exists as EMPLOYEE
        const { data: existingEmployees } = await supabase
          .from('employees')
          .select('email, full_name')
          .eq('email', emailToCheck)
          .eq('is_active', true);

        if (existingEmployees && existingEmployees.length > 0) {
          toast({
            title: 'Email Already Exists',
            description: `An employee with email ${newUser.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Note: Additional validation for admin emails will happen at the database level via triggers

      const demoUserId = crypto.randomUUID();
      
      console.log('Creating user with ID:', demoUserId);

      if (addUserType === 'manager') {
        // Use custom department if "other" is selected, otherwise use the selected department
        const finalDepartment = newUser.department === 'other' ? customDepartment : newUser.department;
        
        // Create manager
        const { error: managerError } = await supabase
          .from('managers')
          .insert({
            user_id: demoUserId,
            full_name: newUser.fullName,
            email: emailToCheck,
            department: finalDepartment,
            phone: newUser.phone,
            password: newUser.password,
            is_active: true,
          });

        if (managerError) {
          // Check if it's a unique constraint violation
          if (managerError.code === '23505') {
            toast({
              title: 'Email Already Exists',
              description: `A manager with email ${newUser.email} already exists in your company.`,
              variant: 'destructive',
            });
            return;
          }
          throw managerError;
        }

        // Create user role for manager
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: demoUserId,
            role: 'manager',
            manager_id: null,
            is_active: true,
          });

        if (roleError) throw roleError;

      } else if (addUserType === 'employee') {
        // Create employee
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            user_id: demoUserId,
            manager_id: newUser.managerId,
            full_name: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            password: newUser.password,
            is_active: true,
          });

        if (employeeError) throw employeeError;

        // Create user role for employee
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: demoUserId,
            role: 'employee',
            manager_id: newUser.managerId,
            is_active: true,
          });

        if (roleError) throw roleError;
      }

      // Show credentials modal
      setGeneratedCredentials({
        email: newUser.email,
        password: newUser.password,
        role: addUserType,
        name: newUser.fullName,
      });
      setCopiedItems({ email: false, password: false });
      setIsCredentialsModalOpen(true);

      // Reset form and close modal
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        role: "manager",
        managerId: "",
        department: "",
        phone: "",
      });
      setCustomDepartment("");
      setShowPassword(false);
      setIsAddUserModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setIsUpdating(true);

      if (editUser.role === 'manager') {
        const { error } = await supabase
          .from('managers')
          .update({
            full_name: editUser.fullName,
            email: editUser.email,
            department: editUser.department,
            phone: editUser.phone,
            is_active: editUser.is_active,
            ...(editUser.password && { password: editUser.password }),
          })
          .eq('id', selectedUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .update({
            full_name: editUser.fullName,
            email: editUser.email,
            phone: editUser.phone,
            manager_id: editUser.managerId,
            is_active: editUser.is_active,
            ...(editUser.password && { password: editUser.password }),
          })
          .eq('id', selectedUser.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'User updated successfully!',
      });

      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.role === 'manager') {
        // Delete the manager record
        const { error } = await supabase
          .from('managers')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Also delete the user_role if it exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id)
;

      } else {
        // Delete the employee record
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Also delete the user_role if it exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id)
;
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully!',
      });

      setIsDeleteUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewUser = (user: User) => {
    console.log('Viewing user:', user);
    console.log('User profile:', user.profile);
    console.log('User password from profile:', user.profile?.password);
    console.log('User password direct:', user.password);
    setSelectedUser(user);
    setShowUserDetailsPassword(false); // Reset password visibility
    setIsViewUserModalOpen(true);
  };

  const handleEditUserClick = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      id: user.id,
      email: user.profile?.email || user.email,
      password: "",
      fullName: user.profile?.full_name || user.full_name,
      role: user.role as "manager" | "employee",
      managerId: user.manager_id || "",
      department: user.profile?.department || user.department || "",
      phone: user.phone || "",
      is_active: user.is_active,
    });
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUserClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserModalOpen(true);
  };

  const handleShowCredentials = (user: User) => {
    setSelectedUser(user);
    setGeneratedCredentials({
      email: user.profile?.email || user.email,
      password: user.profile?.password || user.password || "Not available",
      role: user.role,
      name: user.profile?.full_name || user.full_name,
    });
    setCopiedItems({ email: false, password: false });
    setIsCredentialsModalOpen(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole) return;

    try {
      // Check if email already exists as EMPLOYEE only (same person can be both manager and employee)
      const { data: existingUsers, error: checkError } = await supabase
        .from('employees')
        .select('email, full_name')
        .eq('email', newEmployee.email.toLowerCase().trim())
        .eq('is_active', true);

      if (checkError) {
        console.error('Error checking email:', checkError);
      }

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: 'Email Already Exists',
          description: `An employee with email ${newEmployee.email} already exists in your company.`,
          variant: 'destructive',
        });
        return;
      }

      // Note: Additional validation for admin emails will happen at the database level via triggers

      const demoUserId = crypto.randomUUID();
      
      console.log('Creating employee with ID:', demoUserId);

      // Create employee
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: demoUserId,
          manager_id: newEmployee.managerId,
          full_name: newEmployee.fullName,
          email: newEmployee.email.toLowerCase().trim(),
          phone: newEmployee.phone,
          password: newEmployee.password,
          is_active: true,
        });

      if (employeeError) {
        // Check if it's a unique constraint violation
        if (employeeError.code === '23505') {
          toast({
            title: 'Email Already Exists',
            description: `An employee with email ${newEmployee.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
        throw employeeError;
      }

      // Create user role for employee
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: demoUserId,
          role: 'employee',
          manager_id: newEmployee.managerId,
          is_active: true,
        });

      if (roleError) throw roleError;

      toast({
        title: 'Employee Created',
        description: `${newEmployee.fullName} has been successfully added as an employee.`,
      });

      // Show credentials modal
      setGeneratedCredentials({
        email: newEmployee.email,
        password: newEmployee.password,
        role: 'employee',
        name: newEmployee.fullName,
      });
      setCopiedItems({ email: false, password: false });
      setIsCredentialsModalOpen(true);

      // Reset form and close modal
      setNewEmployee({
        email: "",
        password: "",
        fullName: "",
        managerId: "",
        phone: "",
      });
      setShowEmployeePassword(false);
      setIsAddEmployeeModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredManagers = managers.filter(manager => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      manager.profile?.full_name?.toLowerCase().includes(search) ||
      manager.profile?.email?.toLowerCase().includes(search) ||
      manager.profile?.department?.toLowerCase().includes(search) ||
      manager.user_id?.toLowerCase().includes(search)
    );
    const matchesDepartment = selectedDepartmentFilter === 'all' || manager.profile?.department === selectedDepartmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const filteredEmployees = employees.filter(employee => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      employee.profile?.full_name?.toLowerCase().includes(search) ||
      employee.profile?.email?.toLowerCase().includes(search) ||
      employee.profile?.department?.toLowerCase().includes(search) ||
      employee.user_id?.toLowerCase().includes(search)
    );
    const matchesManager = selectedManagerFilter === 'all' || employee.manager_id === selectedManagerFilter;
    return matchesSearch && matchesManager;
  });

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [type]: true }));
      toast({
        title: 'Copied!',
        description: `${type === 'email' ? 'Email' : 'Password'} copied to clipboard.`,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = () => {
    setIsSignOutDialogOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      await signOut();
      toast({
        title: 'Success',
        description: 'Signed out successfully.',
      });
      setIsSignOutDialogOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
      setIsSignOutDialogOpen(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole) return;

    try {
      // Determine user_id based on group or direct assignment
      let assignedUserId = null;
      let leadStatus = 'unassigned';
      
      if (newLead.groupId && newLead.groupId !== "none") {
        // If a group is selected, get the manager assigned to that group
        const selectedGroup = leadGroups.find(g => g.id === newLead.groupId);
        if (!selectedGroup?.assigned_to) {
          toast({
            title: 'Error',
            description: 'This lead group is not assigned to any manager yet. Please assign the group to a manager first or select a different group.',
            variant: 'destructive',
          });
          return;
        }
        // Get the manager's user_id from the assigned_to (which is manager.id)
        const assignedManager = managers.find(m => m.id === selectedGroup.assigned_to);
        if (assignedManager) {
          assignedUserId = assignedManager.user_id;
          leadStatus = 'assigned';
        } else {
          toast({
            title: 'Error',
            description: 'Could not find the manager assigned to this group. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      } else if (newLead.assignedTo && newLead.assignedTo !== "unassigned") {
        // Direct assignment to a manager
        assignedUserId = newLead.assignedTo;
        leadStatus = 'assigned';
      }

      // Validate that user_id is set (required by database constraint)
      if (!assignedUserId) {
        toast({
          title: 'Error',
          description: 'Please assign the lead to a manager or select a group with an assigned manager.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('leads')
        .insert({
          name: newLead.name,
          email: newLead.email,
          contact: newLead.contact,
          description: newLead.description || null,
          assigned_to: null, // Only employees should be in assigned_to
          user_id: assignedUserId, // Admin assigns to manager (via group or direct)
          status: leadStatus,
          group_id: newLead.groupId || null, // Add group assignment
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead added successfully!',
      });

      // Reset form and close modal
      setNewLead({
        name: "",
        email: "",
        contact: "",
        description: "",
        assignedTo: "",
        groupId: "",
      });
      setIsAddLeadModalOpen(false);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setIsViewLeadModalOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsEditLeadModalOpen(true);
  };

  const handleDeleteLead = (lead: any) => {
    setLeadToDelete(lead);
    setIsDeleteLeadModalOpen(true);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead deleted successfully!',
      });

      setIsDeleteLeadModalOpen(false);
      setLeadToDelete(null);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Bulk Delete Handlers
  const handleToggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAllLeads = (checked: boolean) => {
    if (checked) {
      const allLeadIds = new Set(leads.map(lead => lead.id));
      setSelectedLeadIds(allLeadIds);
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;

    try {
      const idsToDelete = Array.from(selectedLeadIds);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Successfully deleted ${idsToDelete.length} lead${idsToDelete.length > 1 ? 's' : ''}.`,
      });

      setIsBulkDeleteModalOpen(false);
      setSelectedLeadIds(new Set());
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error bulk deleting leads:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete leads. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Lead Group Handlers
  const handleViewLeadGroup = (group: any) => {
    setSelectedLeadGroup(group);
    setIsViewingGroupPage(true);
  };

  const handleEditLeadGroup = (group: any) => {
    setSelectedLeadGroup(group);
    setIsEditLeadGroupModalOpen(true);
  };

  const handleDeleteLeadGroup = (group: any) => {
    setSelectedLeadGroup(group);
    setIsDeleteLeadGroupModalOpen(true);
  };

  const confirmDeleteLeadGroup = async () => {
    if (!selectedLeadGroup) return;

    try {
      // First, delete all leads in this group
      const { data: leadsInGroup, error: fetchError } = await supabase
        .from('leads')
        .select('id')
        .eq('group_id', selectedLeadGroup.id);

      if (fetchError) throw fetchError;

      const leadsCount = leadsInGroup?.length || 0;

      if (leadsCount > 0) {
        const { error: deleteLeadsError } = await supabase
          .from('leads')
          .delete()
          .eq('group_id', selectedLeadGroup.id);

        if (deleteLeadsError) throw deleteLeadsError;
      }

      // Then delete the group itself
      const { error: deleteGroupError } = await supabase
        .from('lead_groups')
        .delete()
        .eq('id', selectedLeadGroup.id);

      if (deleteGroupError) throw deleteGroupError;

      toast({
        title: 'Success',
        description: `Lead group deleted successfully! ${leadsCount > 0 ? `${leadsCount} lead${leadsCount > 1 ? 's' : ''} also deleted.` : ''}`,
      });

      setIsDeleteLeadGroupModalOpen(false);
      setSelectedLeadGroup(null);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting lead group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead group. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // CSV Upload Handlers
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      parseCSVFile(file);
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'Error',
          description: 'CSV file is empty or invalid.',
          variant: 'destructive',
        });
        return;
      }

      // Parse CSV (skip header if present)
      const parsedLeads: any[] = [];
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, handling quoted values
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
        
        if (values.length >= 3) {
          parsedLeads.push({
            name: values[0],
            email: values[1],
            contact: values[2],
            description: values[3] || ''
          });
        }
      }

      if (parsedLeads.length === 0) {
        toast({
          title: 'Error',
          description: 'No valid leads found in CSV file. Please check the format.',
          variant: 'destructive',
        });
        return;
      }

      setCsvLeads(parsedLeads);
      toast({
        title: 'Success',
        description: `Found ${parsedLeads.length} leads in CSV file.`,
      });
    };
    reader.readAsText(file);
  };

  const handleCSVUpload = async () => {
    if (csvLeads.length === 0) return;

    try {
      setIsUploadingCSV(true);

      let groupIdToUse = null;

      // Handle group creation/selection
      if (csvGroupOption === 'new' && csvNewGroupName.trim()) {
        // Create new group
        const { data: newGroup, error: groupError } = await supabase
          .from('lead_groups')
          .insert({
            user_id: user?.id,
            group_name: csvNewGroupName.trim(),
            assigned_to: csvAssignedTo === 'unassigned' ? null : managers.find(m => m.user_id === csvAssignedTo)?.id || null,
          })
          .select()
          .single();

        if (groupError) throw groupError;
        groupIdToUse = newGroup.id;

        toast({
          title: 'Group Created',
          description: `Lead group "${csvNewGroupName}" created successfully.`,
        });
      } else if (csvGroupOption === 'existing' && csvSelectedGroupId) {
        groupIdToUse = csvSelectedGroupId;
      }

      // Determine user_id for leads
      let assignedUserId = null;
      let leadStatus = 'unassigned';

      if (csvGroupOption === 'new' && csvAssignedTo && csvAssignedTo !== 'unassigned') {
        // For newly created group, use the assigned manager directly
        assignedUserId = csvAssignedTo;
        leadStatus = 'assigned';
      } else if (csvGroupOption === 'existing' && groupIdToUse) {
        // For existing group, get the manager assigned to that group
        const selectedGroup = leadGroups.find(g => g.id === groupIdToUse);
        if (selectedGroup?.assigned_to) {
          const assignedManager = managers.find(m => m.id === selectedGroup.assigned_to);
          if (assignedManager) {
            assignedUserId = assignedManager.user_id;
            leadStatus = 'assigned';
          }
        }
      } else if (csvGroupOption === 'none' && csvAssignedTo && csvAssignedTo !== 'unassigned') {
        // Direct assignment without group
        assignedUserId = csvAssignedTo;
        leadStatus = 'assigned';
      }

      // Prepare leads for insertion
      const leadsToInsert = csvLeads.map(lead => ({
        name: lead.name,
        email: lead.email,
        contact: lead.contact,
        description: lead.description || null,
        assigned_to: null,
        user_id: assignedUserId,
        status: leadStatus,
        group_id: groupIdToUse,
      }));

      const { data, error } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select();

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `Successfully uploaded ${data?.length || csvLeads.length} leads from CSV.`,
      });

      // Reset and close
      setCsvFile(null);
      setCsvLeads([]);
      setCsvGroupOption('none');
      setCsvSelectedGroupId('');
      setCsvNewGroupName('');
      setCsvAssignedTo('unassigned');
      setIsUploadCSVModalOpen(false);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload leads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
        }
      });

      if (authError) throw authError;

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });

      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!userRole) return;

    try {
      setIsUpdating(true);

      // Update client data in clients table
      const { error } = await supabase
        .from('clients')
        .update({
          name: companyData.name,
          email: companyData.email,
          contact: companyData.contact,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientData?.id || '00000000-0000-0000-0000-000000000001');

      if (error) throw error;
      
      // Refresh client data
      await fetchClientData();

      toast({
        title: 'Success',
        description: 'Company information updated successfully!',
      });

      setIsEditingCompany(false);
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update company information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveIntegrations = async () => {
    if (!userRole || !clientData) return;

    try {
      setIsUpdating(true);

      // Update Exotel credentials in clients table
      const { error } = await supabase
        .from('clients')
        .update({
          exotel_api_key: exotelCredentials.exotel_api_key,
          exotel_api_token: exotelCredentials.exotel_api_token,
          exotel_subdomain: exotelCredentials.exotel_subdomain,
          exotel_account_sid: exotelCredentials.exotel_account_sid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientData.id);

      if (error) throw error;
      
      // Refresh client data
      await fetchClientData();

      toast({
        title: 'Success',
        description: 'Exotel credentials updated successfully!',
      });

      setIsEditingIntegrations(false);
    } catch (error: any) {
      console.error('Error updating Exotel credentials:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update Exotel credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // Update password using Supabase Auth (since admin uses Supabase Auth)
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) {
        throw error;
      }

      setPasswordData({
        new_password: '',
        confirm_password: '',
      });
      setIsPasswordEditing(false);
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/Bricspac_Logo-tr.png" 
              alt="Bricspac" 
              className="h-12 w-auto cursor-pointer hover:scale-110 transition-transform"
            />
            <div className="border-l-2 border-blue-500/30 pl-4">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  Admin Dashboard
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none font-semibold px-2.5 py-0.5 text-xs shadow-md">
                    <Shield className="h-3 w-3 mr-1" />
                    ADMIN
                  </Badge>
                </h1>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-lg">👋</span>
                  <span className="font-semibold text-foreground">{user?.user_metadata?.full_name || 'Admin'}</span>
                </span>
                <span className="text-blue-500">•</span>
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">Bricspac</span>
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
              onClick={() => setActiveSidebarItem('settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-6">
          <nav className="space-y-2">
            <Button 
              variant={activeSidebarItem === 'overview' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('overview')}
            >
              <Building className="h-4 w-4" />
              Overview
            </Button>
            <Button 
              variant={activeSidebarItem === 'managers' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('managers')}
            >
              <Users className="h-4 w-4" />
              Managers
            </Button>
            <Button 
              variant={activeSidebarItem === 'employees' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('employees')}
            >
              <UserPlus className="h-4 w-4" />
              Employees
            </Button>
            <Button 
              variant={activeSidebarItem === 'leads' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('leads')}
            >
              <Phone className="h-4 w-4" />
              Leads
            </Button>
            <Button 
              variant={activeSidebarItem === 'call-history' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('call-history')}
            >
              <History className="h-4 w-4" />
              Call History
            </Button>
            <Button 
              variant={activeSidebarItem === 'reports' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('reports')}
            >
              <FileText className="h-4 w-4" />
              Reports
            </Button>
            <Button 
              variant={activeSidebarItem === 'analysis' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('analysis')}
            >
              <Brain className="h-4 w-4" />
              Analysis
            </Button>
            <Button 
              variant={activeSidebarItem === 'settings' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant={activeSidebarItem === 'profile' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('profile')}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSidebarItem === 'overview' && (
            <>
              {/* Company Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
                <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{managers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active managers
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-900/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <UserPlus className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{employees.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Phone className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{leads.length}</div>
                <p className="text-xs text-muted-foreground">
                      All time leads
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    <PhoneCall className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{calls.length}</div>
                    <p className="text-xs text-muted-foreground">
                      All time calls
                </p>
              </CardContent>
            </Card>
          </div>

              {/* Team Call Quality Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Team Call Quality Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {analyses.length > 0 
                          ? Math.round(analyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / analyses.length)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average sentiment score
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                      <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {analyses.length > 0 
                          ? Math.round(analyses.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / analyses.length)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average engagement score
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {analyses.length > 0 
                          ? `${Math.round(analyses.reduce((sum, a) => sum + ((a.confidence_score_executive + a.confidence_score_person) / 2 || 0), 0) / analyses.length)}/10`
                          : '0/10'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average confidence score
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Analyses</CardTitle>
                      <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {analyses.filter(a => a.status?.toLowerCase() === 'completed').length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Out of {analyses.length} total
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Lead Management Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Lead Management Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                      <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{leads.length}</div>
                      <p className="text-xs text-muted-foreground">
                        All leads in system
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/20 dark:to-teal-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Called Leads</CardTitle>
                      <PhoneCall className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        {[...new Set(calls.map(call => call.lead_id))].length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Unique leads called
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Calls</CardTitle>
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {leads.length - [...new Set(calls.map(call => call.lead_id))].length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leads not yet called
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {leads.length > 0 
                          ? Math.round((leads.filter(lead => lead.status === 'converted').length / leads.length) * 100)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Lead to customer rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Visual Graphs Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Call Outcomes Distribution - Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Call Outcomes Distribution</CardTitle>
                    <CardDescription>Breakdown of call results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {calls.length === 0 ? (
                      <div className="text-center py-8">
                        <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No calls data available</p>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          completed: { label: "Completed", color: "#0088FE" },
                          follow_up: { label: "Follow-up", color: "#00C49F" },
                          not_answered: { label: "Not Answered", color: "#FFBB28" },
                          not_interested: { label: "Not Interested", color: "#FF8042" },
                          converted: { label: "Converted", color: "#8884d8" },
                        }}
                        className="h-[300px]"
                      >
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={(() => {
                              const outcomeCounts: { [key: string]: number } = {};
                              calls.forEach(call => {
                                const outcome = call.outcome || 'unknown';
                                outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
                              });
                              const colors: { [key: string]: string } = {
                                completed: '#0088FE',
                                follow_up: '#00C49F',
                                not_answered: '#FFBB28',
                                not_interested: '#FF8042',
                                converted: '#8884d8',
                                unknown: '#888888',
                              };
                              return Object.entries(outcomeCounts).map(([name, value]) => ({
                                name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                value,
                                fill: colors[name] || colors.unknown,
                              }));
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(() => {
                              const outcomeCounts: { [key: string]: number } = {};
                              calls.forEach(call => {
                                const outcome = call.outcome || 'unknown';
                                outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
                              });
                              const colors: { [key: string]: string } = {
                                completed: '#0088FE',
                                follow_up: '#00C49F',
                                not_answered: '#FFBB28',
                                not_interested: '#FF8042',
                                converted: '#8884d8',
                                unknown: '#888888',
                              };
                              return Object.entries(outcomeCounts).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[entry[0]] || colors.unknown} />
                              ));
                            })()}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Calls by Day of Week - Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Calls by Day of Week</CardTitle>
                    <CardDescription>Call activity patterns throughout the week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {calls.length === 0 ? (
                      <div className="text-center py-8">
                        <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No calls data available</p>
                      </div>
                    ) : (
                      <ChartContainer
                        config={{
                          calls: { label: "Calls", color: "hsl(var(--chart-1))" },
                        }}
                        className="h-[300px]"
                      >
                        <BarChart data={(() => {
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
                          const dayCounts: { [key: number]: number } = {};
                          
                          calls.forEach(call => {
                            const callDate = new Date(call.created_at);
                            const dayOfWeek = callDate.getDay();
                            dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
                          });
                          
                          return dayNames.map((dayName, index) => ({
                            day: dayName.substring(0, 3), // Short form: Sun, Mon, etc.
                            calls: dayCounts[index] || 0,
                            color: dayColors[index],
                          }));
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="calls" radius={[8, 8, 0, 0]}>
                            {(() => {
                              const dayColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
                              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                              const dayCounts: { [key: number]: number } = {};
                              
                              calls.forEach(call => {
                                const callDate = new Date(call.created_at);
                                const dayOfWeek = callDate.getDay();
                                dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
                              });
                              
                              return dayNames.map((dayName, index) => (
                                <Cell key={`cell-${index}`} fill={dayColors[index]} />
                              ));
                            })()}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Managers Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Managers ({filteredManagers.length})
              </CardTitle>
              <CardDescription>
                Team leaders who manage employees and assign leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredManagers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No managers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredManagers.map((manager) => (
                    <div key={manager.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{manager.profile?.email || `ID: ${manager.user_id}`}</p>
                          {!manager.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          {manager.profile?.department && (
                            <p className="text-xs text-blue-600 font-medium">{manager.profile.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {manager.employees.length} employee{manager.employees.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Manager</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(manager)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(manager)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(manager)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(manager)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employees Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Employees ({filteredEmployees.length})
              </CardTitle>
              <CardDescription>
                Team members who handle assigned leads and make calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No employees found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.profile?.full_name || `Employee ${employee.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{employee.profile?.email || `ID: ${employee.user_id}`}</p>
                          {!employee.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Managed by: {managers.find(m => m.id === employee.manager_id)?.profile?.full_name || 
                                       managers.find(m => m.id === employee.manager_id)?.user_id?.slice(0, 8) || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Employee</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(employee)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(employee)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(employee)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(employee)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            </>
          )}

          {activeSidebarItem === 'managers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Managers</h2>
                  <p className="text-muted-foreground">Manage your team leaders and their responsibilities.</p>
                </div>
                <Button onClick={() => {
                  console.log('Setting addUserType to manager');
                  setAddUserType('manager');
                  setShowPassword(false);
                  // Use setTimeout to ensure state is updated before opening modal
                  setTimeout(() => {
                    console.log('Opening modal with addUserType:', 'manager');
                    setIsAddUserModalOpen(true);
                  }, 100); // Increased timeout to ensure state update
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Manager
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search managers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Select value={selectedDepartmentFilter} onValueChange={setSelectedDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {managers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No managers found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsAddUserModalOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Manager
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredManagers.map((manager) => (
                    <div key={manager.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{manager.profile?.email || `ID: ${manager.user_id}`}</p>
                          {!manager.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          {manager.profile?.department && (
                            <p className="text-xs text-blue-600 font-medium">{manager.profile.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {manager.employees.length} employee{manager.employees.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Manager</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(manager)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(manager)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(manager)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(manager)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSidebarItem === 'employees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Employees</h2>
                  <p className="text-muted-foreground">Manage your team members and their assignments.</p>
                </div>
                <Button onClick={() => {
                  console.log('Opening separate employee modal');
                  console.log('Setting isAddEmployeeModalOpen to true');
                  setIsAddEmployeeModalOpen(true);
                  console.log('Employee modal should now be open');
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Label htmlFor="managerFilter">Filter by Manager</Label>
                  <Select value={selectedManagerFilter} onValueChange={setSelectedManagerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All managers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No employees found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      console.log('Add First Employee clicked - opening separate modal');
                      setIsAddEmployeeModalOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Employee
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.profile?.full_name || `Employee ${employee.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{employee.profile?.email || `ID: ${employee.user_id}`}</p>
                          {!employee.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Managed by: {managers.find(m => m.id === employee.manager_id)?.profile?.full_name || 
                                       managers.find(m => m.id === employee.manager_id)?.user_id?.slice(0, 8) || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Employee</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(employee)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(employee)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(employee)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(employee)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {activeSidebarItem === 'leads' && !isViewingGroupPage && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Lead Management</h2>
                  <p className="text-muted-foreground">Track and manage your company's leads.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddLeadGroupModalOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Add Lead Group
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploadCSVModalOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                <Button onClick={() => setIsAddLeadModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
                </div>
              </div>
              
              {/* Tabs for Leads and Lead Groups */}
              <Tabs value={leadsSection} onValueChange={(value) => setLeadsSection(value as 'leads' | 'groups')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="leads">All Leads</TabsTrigger>
                  <TabsTrigger value="groups">Lead Groups</TabsTrigger>
                </TabsList>
                
                <TabsContent value="leads" className="space-y-6">
              {/* Lead Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.length}</div>
                    <p className="text-xs text-muted-foreground">
                      All time leads
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(lead => lead.status === 'active' || lead.status === 'assigned').length}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Converted</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(lead => lead.status === 'converted').length}</div>
                    <p className="text-xs text-muted-foreground">
                      Successfully converted
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.length > 0 ? Math.round((leads.filter(lead => lead.status === 'converted').length / leads.length) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lead to customer rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* All Leads Section - Now on Top */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                        All Leads ({leads.length})
                  </CardTitle>
                  <CardDescription>
                        Complete list of all leads in your system
                        {selectedLeadIds.size > 0 && (
                          <span className="ml-2 text-blue-600 font-medium">
                            • {selectedLeadIds.size} selected
                          </span>
                        )}
                  </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedLeadIds.size > 0 && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete {selectedLeadIds.size} Lead{selectedLeadIds.size > 1 ? 's' : ''}
                        </Button>
                      )}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search leads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads found</p>
                      <Button className="mt-4" onClick={() => setIsAddLeadModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Select All Checkbox */}
                      {leads.length > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border-2 border-dashed">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.size === leads.length && leads.length > 0}
                            onChange={(e) => handleSelectAllLeads(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                          />
                          <Label className="text-sm font-medium cursor-pointer" onClick={() => handleSelectAllLeads(selectedLeadIds.size !== leads.length)}>
                            Select All ({leads.length} leads)
                          </Label>
                          {selectedLeadIds.size > 0 && selectedLeadIds.size < leads.length && (
                            <span className="text-xs text-muted-foreground">
                              ({selectedLeadIds.size} of {leads.length} selected)
                            </span>
                          )}
                        </div>
                      )}
                      {leads
                        .filter(lead => 
                          lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.contact?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((lead) => (
                        <div key={lead.id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${selectedLeadIds.has(lead.id) ? 'bg-blue-50 border-blue-300' : ''}`}>
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.has(lead.id)}
                              onChange={() => handleToggleLeadSelection(lead.id)}
                              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                            />
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                              <p className="text-sm text-muted-foreground">{lead.contact}</p>
                              {lead.assigned_employee ? (
                                <p className="text-xs text-green-600">Assigned to Employee: {lead.assigned_employee.full_name}</p>
                              ) : lead.assigned_manager ? (
                                <p className="text-xs text-blue-600">Assigned to Manager: {lead.assigned_manager.full_name}</p>
                              ) : (
                                <p className="text-xs text-orange-600">Unassigned</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{lead.status}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteLead(lead)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      {leads.filter(lead => 
                        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.contact?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && searchTerm && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No leads found matching your search.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
                </TabsContent>

                <TabsContent value="groups" className="space-y-6">
                  {/* Lead Groups Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Lead Groups
                      </CardTitle>
                      <CardDescription>
                        Organize your leads into groups for better management
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leadGroups.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No lead groups found</p>
                          <Button className="mt-4" onClick={() => setIsAddLeadGroupModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Lead Group
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {leadGroups.map((group) => (
                            <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <h3 className="font-medium">{group.group_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Created {new Date(group.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {leads.filter(lead => lead.group_id === group.id).length} leads
                                </p>
                                {group.assigned_to && (
                                  <p className="text-sm text-blue-600 font-medium">
                                    Assigned to: {managers.find(m => m.id === group.assigned_to)?.profile?.full_name || 'Manager'}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewLeadGroup(group)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditLeadGroup(group)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteLeadGroup(group)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Lead Group Full Page View */}
          {activeSidebarItem === 'leads' && isViewingGroupPage && selectedLeadGroup && (
            <div className="space-y-6">
              {/* Header with Back Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewingGroupPage(false);
                      setSelectedLeadGroup(null);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Lead Groups
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedLeadGroup.group_name}</h2>
                    <p className="text-muted-foreground">Manage all leads in this group</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEditLeadGroup(selectedLeadGroup)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Group
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteLeadGroup(selectedLeadGroup)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </Button>
                </div>
              </div>

              {/* Group Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.filter(lead => lead.group_id === selectedLeadGroup.id).length}
                    </div>
                    <p className="text-xs text-muted-foreground">In this group</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assigned To</CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {selectedLeadGroup.assigned_to ? 
                        managers.find(m => m.id === selectedLeadGroup.assigned_to)?.profile?.full_name || 'Manager' :
                        'Unassigned'}
                    </div>
                    <p className="text-xs text-muted-foreground">Manager</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.filter(lead => lead.group_id === selectedLeadGroup.id && (lead.status === 'active' || lead.status === 'assigned')).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Active leads</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Converted</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.filter(lead => lead.group_id === selectedLeadGroup.id && lead.status === 'converted').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Successful conversions</p>
                  </CardContent>
                </Card>
              </div>

              {/* All Leads in Group */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Leads in Group</CardTitle>
                      <CardDescription>
                        View, edit, or delete leads in this group
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      // Pre-populate the group ID when adding from group page
                      setNewLead(prev => ({ ...prev, groupId: selectedLeadGroup.id }));
                      setIsAddLeadModalOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead to Group
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads in group..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {leads.filter(lead => lead.group_id === selectedLeadGroup.id).length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads in this group yet</p>
                      <Button className="mt-4" onClick={() => {
                        // Pre-populate the group ID when adding from group page
                        setNewLead(prev => ({ ...prev, groupId: selectedLeadGroup.id }));
                        setIsAddLeadModalOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leads
                        .filter(lead => 
                          lead.group_id === selectedLeadGroup.id &&
                          (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.contact?.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((lead) => (
                          <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium text-lg">{lead.name}</h4>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {lead.email}
                                    </span>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {lead.contact}
                                    </span>
                                  </div>
                                  {lead.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{lead.description}</p>
                                  )}
                                  {lead.user_id && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Assigned to: {managers.find(m => m.user_id === lead.user_id)?.profile?.full_name || 'Manager'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                lead.status === 'converted' ? 'default' :
                                lead.status === 'assigned' ? 'secondary' :
                                lead.status === 'active' ? 'outline' : 'destructive'
                              }>
                                {lead.status}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLead(lead)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditLead(lead)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteLead(lead)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      {leads.filter(lead => 
                        lead.group_id === selectedLeadGroup.id &&
                        (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.contact?.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length === 0 && searchTerm && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No leads found matching your search.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'call-history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Call History</h2>
                <p className="text-muted-foreground">View all calls made by your team members.</p>
              </div>
              <CallHistoryManager 
                managerId={null} // null means show all calls for the company
              />
            </div>
          )}

          {activeSidebarItem === 'reports' && (
            <AdminReportsPage />
          )}

          {activeSidebarItem === 'analysis' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Call Analysis</h2>
                  <p className="text-muted-foreground">View analyzed calls and calls ready for analysis.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={fetchAnalysisData}
                  disabled={loadingAnalysis}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingAnalysis ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <Tabs value={analysisTab} onValueChange={(value) => setAnalysisTab(value as 'analyzed' | 'ready')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analyzed">
                    Analyzed Calls ({analyzedCalls.length})
                  </TabsTrigger>
                  <TabsTrigger value="ready">
                    Ready to Analyze ({readyToAnalyzeCalls.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analyzed" className="space-y-4">
                  {loadingAnalysis ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading analyzed calls...</span>
                    </div>
                  ) : analyzedCalls.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No analyzed calls found.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {analyzedCalls.map((call) => (
                        <Card key={call.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-lg">
                                        {call.leads?.name || 'Unknown Lead'}
                                      </h3>
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Analyzed
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {call.leads?.email} • {call.leads?.contact}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Employee:</span>
                                    <p className="font-medium">{call.employees?.full_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Call Date:</span>
                                    <p className="font-medium">
                                      {call.created_at ? new Date(call.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Outcome:</span>
                                    <p className="font-medium capitalize">{call.outcome || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <p className="font-medium capitalize">{call.analysis?.status || 'N/A'}</p>
                                  </div>
                                </div>

                                {call.analysis?.short_summary && (
                                  <div className="mt-3 p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-1">Summary:</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {call.analysis.short_summary}
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-2 mt-4">
                                  {call.exotel_recording_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(call.exotel_recording_url, '_blank')}
                                    >
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Play Recording
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/analysis/${call.analysis?.id || call.id}`)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Analysis
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ready" className="space-y-4">
                  {loadingAnalysis ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading calls ready to analyze...</span>
                    </div>
                  ) : readyToAnalyzeCalls.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No calls ready for analysis.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Calls with recording URLs will appear here once they're ready.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {readyToAnalyzeCalls.map((call) => (
                        <Card key={call.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-lg">
                                        {call.leads?.name || 'Unknown Lead'}
                                      </h3>
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Ready to Analyze
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {call.leads?.email} • {call.leads?.contact}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Employee:</span>
                                    <p className="font-medium">{call.employees?.full_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Call Date:</span>
                                    <p className="font-medium">
                                      {call.created_at ? new Date(call.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Outcome:</span>
                                    <p className="font-medium capitalize">{call.outcome || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Duration:</span>
                                    <p className="font-medium">
                                      {call.exotel_duration ? `${Math.floor(call.exotel_duration / 60)}m ${call.exotel_duration % 60}s` : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                {call.notes && (
                                  <div className="mt-3 p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-1">Notes:</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {call.notes}
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-2 mt-4">
                                  {call.exotel_recording_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(call.exotel_recording_url, '_blank')}
                                    >
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Play Recording
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/call-details/${call.id}`)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeSidebarItem === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Company Settings</h2>
                <p className="text-muted-foreground">Manage Exotel calling settings for your company.</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Exotel Calling Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure the Caller ID and From Numbers that will be used for all calls made by employees.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Caller ID Setting */}
                  <div className="space-y-2">
                    <Label htmlFor="caller-id">Caller ID</Label>
                    <Input
                      id="caller-id"
                      value={companySettings.caller_id}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, caller_id: e.target.value }))}
                      placeholder="Enter Caller ID (e.g., 09513886363)"
                    />
                    <p className="text-sm text-muted-foreground">
                      This is the number that will appear as the caller ID for all outgoing calls.
                    </p>
                  </div>

                  {/* From Numbers Management */}
                  <div className="space-y-4">
                    <div>
                      <Label>From Numbers</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add phone numbers that employees can select as their "from" number when making calls.
                      </p>
                    </div>

                    {/* Add New From Number */}
                    <div className="flex gap-2">
                      <Input
                        value={newFromNumber}
                        onChange={(e) => setNewFromNumber(e.target.value)}
                        placeholder="Enter phone number (e.g., 7887766008)"
                        className="flex-1"
                      />
                      <Button onClick={addFromNumber} disabled={!newFromNumber.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {/* Display Current From Numbers */}
                    <div className="space-y-2">
                      <Label>Current From Numbers ({companySettings.from_numbers.length})</Label>
                      {companySettings.from_numbers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No from numbers added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {companySettings.from_numbers.map((number, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono">{number}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromNumber(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={updateCompanySettings} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Admin Profile</h2>
                <p className="text-muted-foreground">Manage your admin account settings and information.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Personal Information
                        </CardTitle>
                        <CardDescription>
                          Your basic account information
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                      >
                        {isEditingProfile ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      {isEditingProfile ? (
                        <Input
                          value={profileData.full_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      ) : (
                        <p className="text-lg font-medium">{user?.user_metadata?.full_name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-lg">{user?.email || 'Not provided'}</p>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <Badge variant="secondary" className="capitalize">Admin</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                      <p className="text-lg">{clientData?.name || companyData.name || 'Not provided'}</p>
                    </div>
                    {isEditingProfile && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Company Information
                        </CardTitle>
                        <CardDescription>
                          Your company details
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingCompany(!isEditingCompany)}
                      >
                        {isEditingCompany ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                      {isEditingCompany ? (
                        <Input
                          value={companyData.name}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      ) : (
                        <p className="text-lg font-medium">{clientData?.name || companyData.name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company Email</Label>
                      {isEditingCompany ? (
                        <Input
                          type="email"
                          value={companyData.email}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter company email"
                        />
                      ) : (
                        <p className="text-lg">{clientData?.email || companyData.email || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                      {isEditingCompany ? (
                        <Input
                          value={companyData.contact}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, contact: e.target.value }))}
                          placeholder="Enter contact number"
                        />
                      ) : (
                        <p className="text-lg">{clientData?.contact || companyData.contact || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <p className="text-lg">{clientData?.created_at ? new Date(clientData.created_at).toLocaleDateString() : 'Not available'}</p>
                    </div>
                    {isEditingCompany && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingCompany(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveCompany}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Account Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Account Statistics
                  </CardTitle>
                  <CardDescription>
                    Overview of your admin account activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{managers.length}</div>
                      <div className="text-sm text-muted-foreground">Managers Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{employees.length}</div>
                      <div className="text-sm text-muted-foreground">Employees Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{leads.length}</div>
                      <div className="text-sm text-muted-foreground">Leads Added</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{calls.length}</div>
                      <div className="text-sm text-muted-foreground">Total Calls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Password Management
                    </CardTitle>
                    <CardDescription>
                      Update your account password
                    </CardDescription>
                  </div>
                  {!isPasswordEditing ? (
                    <Button onClick={() => setIsPasswordEditing(true)} size="sm" variant="outline">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handlePasswordChange} size="sm" disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsPasswordEditing(false);
                          setPasswordData({
                            new_password: '',
                            confirm_password: '',
                          });
                        }} 
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                {isPasswordEditing && (
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Integrations */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plug className="h-5 w-5" />
                      Integrations
                    </CardTitle>
                    <CardDescription>
                      Manage your Exotel API credentials
                    </CardDescription>
                  </div>
                  {!isEditingIntegrations ? (
                    <Button onClick={() => setIsEditingIntegrations(true)} size="sm" variant="outline">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Credentials
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveIntegrations} size="sm" disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingIntegrations(false);
                          // Reset to original values
                          if (clientData) {
                            setExotelCredentials({
                              exotel_api_key: clientData.exotel_api_key || '',
                              exotel_api_token: clientData.exotel_api_token || '',
                              exotel_subdomain: clientData.exotel_subdomain || 'api.exotel.com',
                              exotel_account_sid: clientData.exotel_account_sid || '',
                            });
                          }
                        }} 
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="exotel_api_key">Exotel API Key</Label>
                    {isEditingIntegrations ? (
                      <Input
                        id="exotel_api_key"
                        type="text"
                        value={exotelCredentials.exotel_api_key}
                        onChange={(e) => setExotelCredentials(prev => ({ ...prev, exotel_api_key: e.target.value }))}
                        placeholder="Enter Exotel API Key"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono text-muted-foreground flex-1">
                          {exotelCredentials.exotel_api_key 
                            ? (showCredentials.api_key 
                                ? exotelCredentials.exotel_api_key 
                                : '•'.repeat(Math.min(exotelCredentials.exotel_api_key.length, 40)))
                            : 'Not configured'}
                        </p>
                        {exotelCredentials.exotel_api_key && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowCredentials(prev => ({ ...prev, api_key: !prev.api_key }))}
                            >
                              {showCredentials.api_key ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(exotelCredentials.exotel_api_key);
                                toast({
                                  title: 'Copied',
                                  description: 'API Key copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="exotel_api_token">Exotel API Token</Label>
                    {isEditingIntegrations ? (
                      <Input
                        id="exotel_api_token"
                        type="text"
                        value={exotelCredentials.exotel_api_token}
                        onChange={(e) => setExotelCredentials(prev => ({ ...prev, exotel_api_token: e.target.value }))}
                        placeholder="Enter Exotel API Token"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono text-muted-foreground flex-1">
                          {exotelCredentials.exotel_api_token 
                            ? (showCredentials.api_token 
                                ? exotelCredentials.exotel_api_token 
                                : '•'.repeat(Math.min(exotelCredentials.exotel_api_token.length, 40)))
                            : 'Not configured'}
                        </p>
                        {exotelCredentials.exotel_api_token && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowCredentials(prev => ({ ...prev, api_token: !prev.api_token }))}
                            >
                              {showCredentials.api_token ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(exotelCredentials.exotel_api_token);
                                toast({
                                  title: 'Copied',
                                  description: 'API Token copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="exotel_subdomain">Exotel Subdomain</Label>
                    {isEditingIntegrations ? (
                      <Input
                        id="exotel_subdomain"
                        type="text"
                        value={exotelCredentials.exotel_subdomain}
                        onChange={(e) => setExotelCredentials(prev => ({ ...prev, exotel_subdomain: e.target.value }))}
                        placeholder="Enter Exotel Subdomain"
                      />
                    ) : (
                      <p className="text-lg">{exotelCredentials.exotel_subdomain || 'Not configured'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="exotel_account_sid">Exotel Account SID</Label>
                    {isEditingIntegrations ? (
                      <Input
                        id="exotel_account_sid"
                        type="text"
                        value={exotelCredentials.exotel_account_sid}
                        onChange={(e) => setExotelCredentials(prev => ({ ...prev, exotel_account_sid: e.target.value }))}
                        placeholder="Enter Exotel Account SID"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono text-muted-foreground flex-1">
                          {exotelCredentials.exotel_account_sid 
                            ? (showCredentials.account_sid 
                                ? exotelCredentials.exotel_account_sid 
                                : '•'.repeat(Math.min(exotelCredentials.exotel_account_sid.length, 20)))
                            : 'Not configured'}
                        </p>
                        {exotelCredentials.exotel_account_sid && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowCredentials(prev => ({ ...prev, account_sid: !prev.account_sid }))}
                            >
                              {showCredentials.account_sid ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(exotelCredentials.exotel_account_sid);
                                toast({
                                  title: 'Copied',
                                  description: 'Account SID copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Credentials Modal */}
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              User Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Here are the login credentials for the new {generatedCredentials?.role}:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Login Credentials</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-green-800">Name:</label>
                  <p className="text-green-700">{generatedCredentials?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Email:</label>
                  <div className="flex items-center gap-2">
                    <p className="text-green-700 font-mono flex-1">{generatedCredentials?.email}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials?.email || '', 'email')}
                      className="h-8 w-8 p-0"
                    >
                      {copiedItems.email ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Password:</label>
                  <div className="flex items-center gap-2">
                    <p className="text-green-700 font-mono flex-1">{generatedCredentials?.password}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials?.password || '', 'password')}
                      className="h-8 w-8 p-0"
                    >
                      {copiedItems.password ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Role:</label>
                  <p className="text-green-700 capitalize">{generatedCredentials?.role}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Please save these credentials. The {generatedCredentials?.role} will need them to log in.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsCredentialsModalOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen} key={addUserType}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New {addUserType === 'manager' ? 'Manager' : 'Employee'} - OLD SHARED MODAL</DialogTitle>
            <DialogDescription>
              Create a new {addUserType} for your company.
            </DialogDescription>
            {console.log('OLD Modal addUserType:', addUserType)}
            {console.log('OLD Modal is open:', isAddUserModalOpen)}
            {console.log('Modal title should be:', addUserType === 'manager' ? 'Manager' : 'Employee')}
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            {addUserType === 'manager' && (
              <>
                <div>
                  {console.log('Rendering manager department field, addUserType:', addUserType)}
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={newUser.department}
                    onValueChange={(value) => {
                      setNewUser(prev => ({ ...prev, department: value }));
                      if (value !== 'other') {
                        setCustomDepartment('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newUser.department === 'other' && (
                  <div>
                    <Label htmlFor="customDepartment">Specify Department *</Label>
                    <Input
                      id="customDepartment"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      placeholder="Enter department name"
                      required
                    />
                  </div>
                )}
              </>
            )}
            {addUserType === 'employee' && (
              <div>
                {console.log('Rendering employee manager selection, addUserType:', addUserType)}
                <Label htmlFor="managerId">Manager *</Label>
                <Select
                  value={newUser.managerId}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                    <SelectContent>
                      {console.log('Rendering manager dropdown, managers:', managers)}
                      {managers.length === 0 ? (
                        <SelectItem value="no-managers" disabled>
                          No managers available - create a manager first
                        </SelectItem>
                      ) : (
                        managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                </Select>
                {managers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to create a manager first before adding employees.
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddUserModalOpen(false);
                setCustomDepartment("");
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newUser.fullName || !newUser.email || !newUser.password || (addUserType === 'manager' && (!newUser.department || (newUser.department === 'other' && !customDepartment))) || (addUserType === 'employee' && !newUser.managerId)}>
                Create {addUserType === 'manager' ? 'Manager' : 'Employee'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Employee Modal - Separate Form */}
      <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee - SEPARATE FORM</DialogTitle>
            <DialogDescription>
              Create a new employee for your company.
            </DialogDescription>
            {console.log('Employee modal is open:', isAddEmployeeModalOpen)}
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="employeeFullName">Full Name *</Label>
              <Input
                id="employeeFullName"
                value={newEmployee.fullName}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="employeeEmail">Email *</Label>
              <Input
                id="employeeEmail"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="employeePassword">Password *</Label>
              <div className="relative">
                <Input
                  id="employeePassword"
                  type={showEmployeePassword ? "text" : "password"}
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                >
                  {showEmployeePassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="employeePhone">Phone</Label>
              <Input
                id="employeePhone"
                value={newEmployee.phone || ""}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="employeeManagerId">Manager *</Label>
              <Select
                value={newEmployee.managerId}
                onValueChange={(value) => setNewEmployee(prev => ({ ...prev, managerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.length === 0 ? (
                    <SelectItem value="no-managers" disabled>
                      No managers available - create a manager first
                    </SelectItem>
                  ) : (
                    managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {managers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  You need to create a manager first before adding employees.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddEmployeeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newEmployee.fullName || !newEmployee.email || !newEmployee.password || !newEmployee.managerId}>
                Create Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={isViewUserModalOpen} onOpenChange={setIsViewUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Complete information about {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-medium">{selectedUser.profile?.full_name || selectedUser.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-lg">{selectedUser.profile?.email || selectedUser.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Password</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded border">
                        {showUserDetailsPassword ? (selectedUser.profile?.password || selectedUser.password || 'Not available') : '••••••••'}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUserDetailsPassword(!showUserDetailsPassword)}
                        className="h-8"
                      >
                        {showUserDetailsPassword ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showUserDetailsPassword ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <Badge variant="secondary" className="capitalize">{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={selectedUser.is_active ? "default" : "destructive"}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  {(selectedUser.department || selectedUser.profile?.department) && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-lg">{selectedUser.profile?.department || selectedUser.department}</p>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-lg">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-lg">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              {selectedUser.role === 'manager' && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Team Members</Label>
                  <p className="text-lg">{managers.find(m => m.id === selectedUser.id)?.employees.length || 0} employees</p>
                </div>
              )}
              {selectedUser.role === 'employee' && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
                  <p className="text-lg">
                    {managers.find(m => m.id === selectedUser.manager_id)?.profile?.full_name || 'Unassigned'}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsViewUserModalOpen(false);
              setShowUserDetailsPassword(false);
            }}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewUserModalOpen(false);
              setShowUserDetailsPassword(false);
              handleEditUserClick(selectedUser!);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update information for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFullName">Full Name *</Label>
                <Input
                  id="editFullName"
                  value={editUser.fullName}
                  onChange={(e) => setEditUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={selectedUser?.profile?.full_name || selectedUser?.full_name || "Enter full name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={selectedUser?.profile?.email || selectedUser?.email || "Enter email address"}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editUser.phone}
                  onChange={(e) => setEditUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={selectedUser?.phone || "Enter phone number"}
                />
              </div>
              <div>
                <Label htmlFor="editPassword">New Password (optional)</Label>
                <div className="relative">
                  <Input
                    id="editPassword"
                    type={showPassword ? "text" : "password"}
                    value={editUser.password}
                    onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave blank to keep current password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {editUser.role === 'manager' && (
              <div>
                <Label htmlFor="editDepartment">Department *</Label>
                <Input
                  id="editDepartment"
                  value={editUser.department}
                  onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                  placeholder={selectedUser?.profile?.department || selectedUser?.department || "Enter department name"}
                  required
                />
              </div>
            )}

            {editUser.role === 'employee' && (
              <div>
                <Label htmlFor="editManagerId">Manager *</Label>
                <Select
                  value={editUser.managerId}
                  onValueChange={(value) => setEditUser(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editUser.is_active}
                onChange={(e) => setEditUser(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="editIsActive">Active User</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || !editUser.fullName || !editUser.email}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update User
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteUserModalOpen} onOpenChange={setIsDeleteUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This action will permanently remove them from the database and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lead Modal */}
      <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead and assign it to a manager.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4">
            <div>
              <Label htmlFor="leadName">Name *</Label>
              <Input
                id="leadName"
                value={newLead.name}
                onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter lead name"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadEmail">Email *</Label>
              <Input
                id="leadEmail"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadContact">Contact *</Label>
              <Input
                id="leadContact"
                value={newLead.contact}
                onChange={(e) => setNewLead(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="Enter contact number"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadDescription">Description</Label>
              <Textarea
                id="leadDescription"
                value={newLead.description}
                onChange={(e) => setNewLead(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            {/* Show group selection only if not viewing from a specific group page */}
            {isViewingGroupPage && selectedLeadGroup ? (
              <div>
                <Label>Lead Group</Label>
                <div className="p-2 bg-muted rounded-md border">
                  <p className="text-sm font-medium">{selectedLeadGroup.group_name}</p>
                  <p className="text-xs text-muted-foreground">Adding lead to this group</p>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="groupId">Lead Group</Label>
                <Select value={newLead.groupId || "none"} onValueChange={(value) => setNewLead(prev => ({ ...prev, groupId: value === "none" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {leadGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {newLead.groupId && newLead.groupId !== "none" ? (
              (() => {
                const selectedGroup = leadGroups.find(g => g.id === newLead.groupId);
                const hasManagerAssigned = selectedGroup?.assigned_to;
                const assignedManager = hasManagerAssigned ? managers.find(m => m.id === selectedGroup.assigned_to) : null;
                
                return hasManagerAssigned ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This lead will be assigned based on the group's assignment to a manager.
                      <span className="block mt-1">
                        Group assigned to: <strong>{assignedManager?.profile?.full_name || 'Manager'}</strong>
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>⚠️ Warning:</strong> This lead group is not assigned to any manager yet.
                      <span className="block mt-1">
                        Please edit the group and assign it to a manager before adding leads to it.
                      </span>
                    </p>
                  </div>
                );
              })()
            ) : (
              <div>
                <Label htmlFor="assignedTo">Assign to Manager</Label>
                <Select value={newLead.assignedTo} onValueChange={(value) => setNewLead(prev => ({ ...prev, assignedTo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.user_id} value={manager.user_id}>
                        {manager.profile?.full_name || manager.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddLeadModalOpen(false);
                // Reset form when canceling
                setNewLead({
                  name: "",
                  email: "",
                  contact: "",
                  description: "",
                  assignedTo: "",
                  groupId: "",
                });
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={
                !newLead.name || 
                !newLead.email || 
                !newLead.contact ||
                // Disable if group is selected but not assigned to a manager
                (newLead.groupId && newLead.groupId !== "none" && !leadGroups.find(g => g.id === newLead.groupId)?.assigned_to) ||
                // Disable if neither group nor direct assignment is made
                (!newLead.groupId || newLead.groupId === "none") && (!newLead.assignedTo || newLead.assignedTo === "unassigned")
              }>
                Add Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Lead Group Modal */}
      <Dialog open={isAddLeadGroupModalOpen} onOpenChange={setIsAddLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead Group</DialogTitle>
            <DialogDescription>
              Create a new lead group to organize your leads.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!userRole) return;

            try {
              const { error } = await supabase
                .from('lead_groups')
                .insert({
                  user_id: user?.id,
                  group_name: newLeadGroup.groupName,
                  assigned_to: newLeadGroup.assignedTo === "unassigned" ? null : newLeadGroup.assignedTo || null,
                });

              if (error) throw error;

              toast({
                title: 'Success',
                description: 'Lead group created successfully!',
              });

              setNewLeadGroup({
                groupName: '',
                assignedTo: '',
              });
              setIsAddLeadGroupModalOpen(false);
              fetchUsers(); // Refresh data
            } catch (error: any) {
              console.error('Error adding lead group:', error);
              toast({
                title: 'Error',
                description: error.message || 'Failed to create lead group. Please try again.',
                variant: 'destructive',
              });
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={newLeadGroup.groupName}
                  onChange={(e) => setNewLeadGroup(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assign to Manager (Optional)</Label>
                <Select
                  value={newLeadGroup.assignedTo}
                  onValueChange={(value) => setNewLeadGroup(prev => ({ ...prev, assignedTo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddLeadGroupModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newLeadGroup.groupName}>
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Group Modal */}
      <Dialog open={isEditLeadGroupModalOpen} onOpenChange={setIsEditLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead Group</DialogTitle>
            <DialogDescription>
              Update the lead group details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedLeadGroup) return;

            try {
              const { error } = await supabase
                .from('lead_groups')
                .update({
                  group_name: selectedLeadGroup.group_name,
                  assigned_to: selectedLeadGroup.assigned_to === "unassigned" ? null : selectedLeadGroup.assigned_to || null,
                })
                .eq('id', selectedLeadGroup.id);

              if (error) throw error;

              toast({
                title: 'Success',
                description: 'Lead group updated successfully!',
              });

              setIsEditLeadGroupModalOpen(false);
              setSelectedLeadGroup(null);
              fetchUsers(); // Refresh data
            } catch (error: any) {
              console.error('Error updating lead group:', error);
              toast({
                title: 'Error',
                description: error.message || 'Failed to update lead group. Please try again.',
                variant: 'destructive',
              });
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editGroupName">Group Name</Label>
                <Input
                  id="editGroupName"
                  value={selectedLeadGroup?.group_name || ''}
                  onChange={(e) => setSelectedLeadGroup(prev => prev ? { ...prev, group_name: e.target.value } : null)}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editAssignedTo">Assign to Manager (Optional)</Label>
                <Select
                  value={selectedLeadGroup?.assigned_to || 'unassigned'}
                  onValueChange={(value) => setSelectedLeadGroup(prev => prev ? { ...prev, assigned_to: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditLeadGroupModalOpen(false);
                setSelectedLeadGroup(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedLeadGroup?.group_name}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Lead Group Modal */}
      <Dialog open={isViewLeadGroupModalOpen} onOpenChange={setIsViewLeadGroupModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Lead Group: {selectedLeadGroup?.group_name}</DialogTitle>
            <DialogDescription>
              View all leads in this group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-muted-foreground">Group Name</Label>
                <p className="font-medium">{selectedLeadGroup?.group_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Leads</Label>
                <p className="font-medium">{leads.filter(lead => lead.group_id === selectedLeadGroup?.id).length}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">{selectedLeadGroup?.created_at ? new Date(selectedLeadGroup.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Assigned To</Label>
                <p className="font-medium">
                  {selectedLeadGroup?.assigned_to ? 
                    managers.find(m => m.id === selectedLeadGroup.assigned_to)?.profile?.full_name || 'Manager' :
                    'Unassigned'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Leads in this Group</h3>
              {leads.filter(lead => lead.group_id === selectedLeadGroup?.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads in this group yet
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.filter(lead => lead.group_id === selectedLeadGroup?.id).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        <p className="text-sm text-muted-foreground">{lead.contact}</p>
                      </div>
                      <Badge variant={
                        lead.status === 'converted' ? 'default' :
                        lead.status === 'assigned' ? 'secondary' :
                        lead.status === 'active' ? 'outline' : 'destructive'
                      }>
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" onClick={() => {
              setIsViewLeadGroupModalOpen(false);
              setSelectedLeadGroup(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Group Confirmation Modal */}
      <Dialog open={isDeleteLeadGroupModalOpen} onOpenChange={setIsDeleteLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Lead Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedLeadGroup?.group_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLeadGroup && (
              <>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 mb-2">
                    ⚠️ Warning: Cascading Delete
                  </p>
                  <p className="text-sm text-red-800">
                    Deleting this group will also <strong>permanently delete all {leads.filter(l => l.group_id === selectedLeadGroup.id).length} lead{leads.filter(l => l.group_id === selectedLeadGroup.id).length !== 1 ? 's' : ''}</strong> in this group.
                  </p>
                </div>
                {leads.filter(l => l.group_id === selectedLeadGroup.id).length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-xs font-semibold text-amber-900 mb-2">Leads to be deleted:</p>
                    <div className="space-y-1">
                      {leads.filter(l => l.group_id === selectedLeadGroup.id).slice(0, 5).map(lead => (
                        <div key={lead.id} className="text-xs bg-white p-2 rounded border">
                          • {lead.name} - {lead.email}
                        </div>
                      ))}
                      {leads.filter(l => l.group_id === selectedLeadGroup.id).length > 5 && (
                        <p className="text-xs text-amber-700 pt-1">
                          ...and {leads.filter(l => l.group_id === selectedLeadGroup.id).length - 5} more leads
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsDeleteLeadGroupModalOpen(false);
              setSelectedLeadGroup(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLeadGroup}>
              Yes, Delete Group & All Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Confirmation Modal */}
      <Dialog open={isDeleteLeadModalOpen} onOpenChange={setIsDeleteLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Lead
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{leadToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {leadToDelete && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm"><span className="font-medium">Name:</span> {leadToDelete.name}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {leadToDelete.email}</p>
                <p className="text-sm"><span className="font-medium">Contact:</span> {leadToDelete.contact}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsDeleteLeadModalOpen(false);
              setLeadToDelete(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLead}>
              Yes, Delete Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Multiple Leads
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">
                You are about to delete:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {Array.from(selectedLeadIds).slice(0, 10).map(leadId => {
                  const lead = leads.find(l => l.id === leadId);
                  return lead ? (
                    <div key={leadId} className="text-xs bg-white p-2 rounded border">
                      <p><strong>{lead.name}</strong> - {lead.email}</p>
                    </div>
                  ) : null;
                })}
                {selectedLeadIds.size > 10 && (
                  <p className="text-xs text-red-700 pt-2">
                    ...and {selectedLeadIds.size - 10} more leads
                  </p>
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This will permanently delete all selected leads and cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsBulkDeleteModalOpen(false);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Yes, Delete {selectedLeadIds.size} Lead{selectedLeadIds.size > 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload CSV Modal */}
      <Dialog open={isUploadCSVModalOpen} onOpenChange={(open) => {
        setIsUploadCSVModalOpen(open);
        if (!open) {
          // Reset when closing
          setCsvFile(null);
          setCsvLeads([]);
          setCsvGroupOption('none');
          setCsvSelectedGroupId('');
          setCsvNewGroupName('');
          setCsvAssignedTo('unassigned');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple leads at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {csvFile ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600">✓ File selected: {csvFile.name}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvLeads([]);
                    }}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-2">Click to browse and select a CSV file</p>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={handleCSVFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </>
              )}
            </div>

            {csvLeads.length > 0 && (
              <>
                <div className="border rounded-lg p-4 bg-green-50">
                  <h4 className="font-semibold text-sm mb-2 text-green-800">
                    Preview: {csvLeads.length} leads found
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {csvLeads.slice(0, 5).map((lead, index) => (
                      <div key={index} className="text-xs p-2 bg-white rounded border">
                        <p><strong>Name:</strong> {lead.name}</p>
                        <p><strong>Email:</strong> {lead.email}</p>
                        <p><strong>Contact:</strong> {lead.contact}</p>
                        {lead.description && <p><strong>Description:</strong> {lead.description}</p>}
                      </div>
                    ))}
                    {csvLeads.length > 5 && (
                      <p className="text-xs text-gray-600 text-center pt-2">
                        ...and {csvLeads.length - 5} more leads
                      </p>
                    )}
                  </div>
                </div>

                {/* Lead Group Options */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Lead Group (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-3">Organize these leads into a group</p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="csv-group-none"
                          name="csv-group"
                          value="none"
                          checked={csvGroupOption === 'none'}
                          onChange={() => setCsvGroupOption('none')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="csv-group-none" className="font-normal cursor-pointer">
                          No group
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="csv-group-existing"
                          name="csv-group"
                          value="existing"
                          checked={csvGroupOption === 'existing'}
                          onChange={() => setCsvGroupOption('existing')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="csv-group-existing" className="font-normal cursor-pointer">
                          Add to existing group
                        </Label>
                      </div>
                      {csvGroupOption === 'existing' && (
                        <div className="ml-6">
                          <Select value={csvSelectedGroupId} onValueChange={setCsvSelectedGroupId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a group" />
                            </SelectTrigger>
                            <SelectContent>
                              {leadGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.group_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="csv-group-new"
                          name="csv-group"
                          value="new"
                          checked={csvGroupOption === 'new'}
                          onChange={() => setCsvGroupOption('new')}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="csv-group-new" className="font-normal cursor-pointer">
                          Create new group
                        </Label>
                      </div>
                      {csvGroupOption === 'new' && (
                        <div className="ml-6">
                          <Input
                            placeholder="Enter new group name"
                            value={csvNewGroupName}
                            onChange={(e) => setCsvNewGroupName(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment Options */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div>
                    <Label htmlFor="csv-assign" className="text-sm font-semibold">Assign To Manager</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {csvGroupOption === 'new' 
                        ? 'Assign the new group to a manager' 
                        : csvGroupOption === 'existing'
                        ? 'Note: Leads will be assigned based on the selected group\'s manager'
                        : 'Directly assign these leads to a manager'}
                    </p>
                    {(csvGroupOption === 'none' || csvGroupOption === 'new') && (
                      <Select value={csvAssignedTo} onValueChange={setCsvAssignedTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.user_id} value={manager.user_id}>
                              {manager.profile?.full_name || manager.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {csvGroupOption === 'existing' && csvSelectedGroupId && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-800">
                          {leadGroups.find(g => g.id === csvSelectedGroupId)?.assigned_to ? (
                            <>
                              <strong>Assigned to:</strong> {managers.find(m => m.id === leadGroups.find(g => g.id === csvSelectedGroupId)?.assigned_to)?.profile?.full_name || 'Manager'}
                            </>
                          ) : (
                            <span className="text-amber-700">⚠️ This group has no manager assigned yet</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">Required CSV Format:</p>
              <p className="text-blue-800">Name, Email, Contact, Description (optional)</p>
              <p className="mt-2 text-blue-800"><strong>Example:</strong></p>
              <code className="text-xs block bg-white p-2 rounded mt-1 text-blue-900">
                John Doe, john@example.com, +1234567890, Interested in premium plan<br/>
                Jane Smith, jane@example.com, +0987654321, Follow up next week
              </code>
              <p className="mt-2 text-xs text-blue-700">
                ℹ️ First row can be headers (Name, Email, Contact, Description) or data - both formats supported
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsUploadCSVModalOpen(false);
                setCsvFile(null);
                setCsvLeads([]);
                setCsvGroupOption('none');
                setCsvSelectedGroupId('');
                setCsvNewGroupName('');
                setCsvAssignedTo('unassigned');
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCSVUpload}
              disabled={csvLeads.length === 0 || isUploadingCSV}
            >
              {isUploadingCSV ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {csvLeads.length} Leads
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Lead Modal */}
      <Dialog open={isViewLeadModalOpen} onOpenChange={setIsViewLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View details for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm font-medium">{selectedLead.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">{selectedLead.email}</p>
              </div>
              <div>
                <Label>Contact</Label>
                <p className="text-sm font-medium">{selectedLead.contact}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm font-medium">{selectedLead.description || 'No description'}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant="secondary">{selectedLead.status}</Badge>
              </div>
              <div>
                <Label>Assignment</Label>
                {selectedLead.assigned_employee ? (
                  <p className="text-sm text-green-600">Assigned to Employee: {selectedLead.assigned_employee.full_name}</p>
                ) : selectedLead.assigned_manager ? (
                  <p className="text-sm text-blue-600">Assigned to Manager: {selectedLead.assigned_manager.full_name}</p>
                ) : (
                  <p className="text-sm text-orange-600">Unassigned</p>
                )}
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm font-medium">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsViewLeadModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewLeadModalOpen(false);
              handleEditLead(selectedLead);
            }}>
              Edit Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={isEditLeadModalOpen} onOpenChange={setIsEditLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update details for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { error } = await supabase
                  .from('leads')
                  .update({
                    name: selectedLead.name,
                    email: selectedLead.email,
                    contact: selectedLead.contact,
                    description: selectedLead.description,
                    user_id: selectedLead.user_id,
                    status: selectedLead.user_id ? 'assigned' : 'unassigned',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', selectedLead.id);

                if (error) throw error;

                toast({
                  title: 'Success',
                  description: 'Lead updated successfully!',
                });

                setIsEditLeadModalOpen(false);
                fetchUsers(); // Refresh data
              } catch (error: any) {
                console.error('Error updating lead:', error);
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to update lead. Please try again.',
                  variant: 'destructive',
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedLead.name}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedLead.email}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact">Contact</Label>
                  <Input
                    id="edit-contact"
                    value={selectedLead.contact}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, contact: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedLead.description || ''}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter lead description"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-assignment">Assignment</Label>
                  <Select value={selectedLead.user_id || "unassigned"} onValueChange={(value) => setSelectedLead(prev => ({ ...prev, user_id: value === "unassigned" ? null : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No assignment</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.user_id} value={manager.user_id}>
                          {manager.profile?.full_name || manager.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Lead
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Sign Out
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to sign out? You will need to log in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignOutDialogOpen(false)}
              className="font-medium"
            >
              No, Stay
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmSignOut}
              className="font-medium"
            >
              Yes, Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
