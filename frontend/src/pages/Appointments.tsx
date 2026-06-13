import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card, { CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import { Calendar, Plus, Clock, FileText, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

interface Appointment {
  id: number;
  patient: number;
  patient_detail?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes: string;
}

export const Appointments: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Appointment Form States
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Patients List for dropdown selection
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients-minimal'],
    queryFn: async () => {
      const response = await api.get('/patients/');
      return response.data;
    }
  });

  // Fetch Appointments List
  const { data: appointments = [], isLoading, error } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await api.get('/appointments/');
      return response.data;
    }
  });

  // Schedule Appointment Mutation
  const scheduleMutation = useMutation({
    mutationFn: async (newAppointment: Partial<Appointment>) => {
      const response = await api.post('/appointments/', newAppointment);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/appointments/${id}/`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  const resetForm = () => {
    setSelectedPatientId('');
    setAppointmentDate('');
    setAppointmentTime('');
    setNotes('');
    setFormError('');
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !appointmentDate || !appointmentTime) {
      setFormError('Patient, Date, and Time are required fields.');
      return;
    }

    setFormError('');
    setFormLoading(true);
    try {
      await scheduleMutation.mutateAsync({
        patient: Number(selectedPatientId),
        date: appointmentDate,
        time: appointmentTime,
        status: 'Scheduled',
        notes
      });
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to book appointment. Please verify details.');
    } finally {
      setFormLoading(false);
    }
  };

  // Filter appointments client-side
  const filteredAppointments = appointments.filter((apt) => {
    return statusFilter === 'All' || apt.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      Scheduled: "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
      Completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
      Cancelled: "bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200 dark:border-slate-800"
    };
    return (
      <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${badges[status as keyof typeof badges]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments Calendar</h1>
          <p className="text-muted-foreground mt-1">Book and coordinate consultation timetables.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus size={16} />
          <span>Schedule Visit</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border">
        <CardContent className="p-4 flex gap-4">
          <div className="w-48">
            <Select
              id="status-filter"
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointment Listings */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-medical-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-muted-foreground text-sm">Loading appointment queue...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
          <ShieldAlert size={20} />
          <span>Failed to load appointments log. Please refresh.</span>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => (
            <Card key={apt.id} className="border-border hover:shadow-sm transition-all duration-150">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[160px]">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-foreground">
                        <Link 
                          to={`/patients/${apt.patient}`} 
                          className="hover:text-medical-600 transition-colors"
                        >
                          {apt.patient_detail?.first_name} {apt.patient_detail?.last_name}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar size={12} />
                        <span>{apt.date}</span>
                        <span>•</span>
                        <Clock size={12} />
                        <span>{apt.time}</span>
                      </div>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>

                  {apt.notes && (
                    <div className="text-xs text-muted-foreground bg-secondary/35 p-2 rounded-lg border border-border/15 font-sans italic">
                      Notes: {apt.notes}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-border mt-4">
                  <Link to={`/patients/${apt.patient}`}>
                    <Button variant="ghost" size="sm" className="gap-1.5 p-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <FileText size={14} />
                      <span>Patient File</span>
                    </Button>
                  </Link>
                  
                  {apt.status === 'Scheduled' && (
                    <div className="flex gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'Cancelled' })}
                        className="text-destructive hover:bg-destructive/10 gap-1 px-2.5 py-1 text-xs"
                      >
                        <XCircle size={14} />
                        <span>Cancel</span>
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'Completed' })}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-1 px-2.5 py-1 text-xs"
                      >
                        <CheckCircle2 size={14} />
                        <span>Complete</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          No appointments recorded matching this status.
        </div>
      )}

      {/* Book Appointment Dialog Modal */}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Schedule Consultation Visit">
        <form onSubmit={handleSchedule} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="w-full">
            <label htmlFor="patient-select" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Select Patient *
            </label>
            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm"
            >
              <option value="">-- Choose Registered Patient --</option>
              {patients.map((pat) => (
                <option key={pat.id} value={pat.id}>
                  {pat.first_name} {pat.last_name} (ID: #{pat.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="date"
              label="Visit Date *"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
            <Input
              id="time"
              label="Consultation Time *"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </div>

          <div className="w-full">
            <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Notes
            </label>
            <textarea
              id="notes"
              placeholder="Visit intent notes (e.g. general checkout, follow-up scan review)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Schedule Appointment
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default Appointments;
