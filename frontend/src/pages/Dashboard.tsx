import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  Users, Calendar, CheckCircle2, Clock, 
  ArrowRight, Plus, AlertCircle, FileText 
} from 'lucide-react';

interface StatsResponse {
  metrics: {
    total_patients: number;
    total_appointments: number;
    appointments_today: number;
    completed_consultations: number;
  };
  recent_patients: any[];
  upcoming_appointments: any[];
}

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats/');
      return response.data;
    },
    refetchInterval: 10000 // poll every 10 seconds for real-time updates
  });

  // Mutation to update appointment status to Completed
  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/appointments/${id}/`, { status: 'Completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <svg className="animate-spin h-8 w-8 text-medical-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-muted-foreground">Syncing clinic analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
        <AlertCircle size={20} />
        <span>Failed to load dashboard metrics. Please reload page.</span>
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_patients: 0,
    total_appointments: 0,
    appointments_today: 0,
    completed_consultations: 0,
  };

  const statCards = [
    {
      title: "Total Patients",
      value: metrics.total_patients,
      description: "Active clinical files",
      icon: <Users className="text-medical-600 dark:text-medical-400" size={24} />,
      color: "bg-medical-50 dark:bg-medical-950/20"
    },
    {
      title: "Appointments Today",
      value: metrics.appointments_today,
      description: "Booked consultations",
      icon: <Calendar className="text-blue-600 dark:text-blue-400" size={24} />,
      color: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Completed Today",
      value: metrics.completed_consultations,
      description: "Finished consultations",
      icon: <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />,
      color: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      title: "Scheduled Pending",
      value: metrics.total_appointments - metrics.completed_consultations,
      description: "Future sessions in log",
      icon: <Clock className="text-purple-600 dark:text-purple-400" size={24} />,
      color: "bg-purple-50 dark:bg-purple-950/20"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time indicators and scheduling logs.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/patients">
            <Button className="gap-2">
              <Plus size={16} />
              <span>Register Patient</span>
            </Button>
          </Link>
          <Link to="/appointments">
            <Button variant="outline" className="gap-2">
              <Calendar size={16} />
              <span>Schedule Visit</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</span>
                <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <div className={`p-3.5 rounded-xl ${card.color}`}>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Consultations</CardTitle>
              <CardDescription>Scheduled queue for today and future days</CardDescription>
            </div>
            <Link to="/appointments" className="text-xs font-semibold text-medical-600 hover:text-medical-700 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border -mx-5 -my-5 px-5">
            {data?.upcoming_appointments && data.upcoming_appointments.length > 0 ? (
              data.upcoming_appointments.map((apt) => (
                <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-5 last:pb-5">
                  <div className="space-y-1">
                    <Link 
                      to={`/patients/${apt.patient}`} 
                      className="font-semibold text-foreground hover:text-medical-600 transition-colors"
                    >
                      {apt.patient_detail?.first_name} {apt.patient_detail?.last_name}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded-md font-medium text-foreground">{apt.date}</span>
                      <span>•</span>
                      <span>{apt.time}</span>
                      {apt.notes && (
                        <>
                          <span>•</span>
                          <span className="italic truncate max-w-[150px]">{apt.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/patients/${apt.patient}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <FileText size={14} />
                        <span>EMR</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => completeMutation.mutate(apt.id)}
                      loading={completeMutation.isPending && completeMutation.variables === apt.id}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No upcoming appointments scheduled.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Registered Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Recently registered entries</CardDescription>
            </div>
            <Link to="/patients" className="text-xs font-semibold text-medical-600 hover:text-medical-700 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border -mx-5 -my-5 px-5">
            {data?.recent_patients && data.recent_patients.length > 0 ? (
              data.recent_patients.map((pat) => (
                <div key={pat.id} className="py-4 flex items-center justify-between first:pt-5 last:pb-5">
                  <div>
                    <Link 
                      to={`/patients/${pat.id}`} 
                      className="font-semibold text-foreground hover:text-medical-600 transition-colors block"
                    >
                      {pat.first_name} {pat.last_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{pat.phone || pat.email || 'No contact'}</span>
                  </div>
                  <Link to={`/patients/${pat.id}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No patients registered yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
