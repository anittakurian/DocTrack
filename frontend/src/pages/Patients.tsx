import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card, { CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import { Search, UserPlus, Phone, Mail, Eye, Trash2, ShieldAlert } from 'lucide-react';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  blood_group: string;
  address: string;
  emergency_contact: string;
  created_at: string;
}

export const Patients: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Registration Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Patients List
  const { data: patients = [], isLoading, error } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients/');
      return response.data;
    }
  });

  // Register Patient Mutation
  const registerMutation = useMutation({
    mutationFn: async (newPatient: Partial<Patient>) => {
      const response = await api.post('/patients/', newPatient);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  // Soft Delete Patient Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/patients/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDob('');
    setGender('Male');
    setPhone('');
    setEmail('');
    setBloodGroup('O+');
    setAddress('');
    setEmergencyContact('');
    setFormError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dob || !gender) {
      setFormError('First Name, Last Name, Date of Birth and Gender are required.');
      return;
    }

    setFormError('');
    setFormLoading(true);
    try {
      await registerMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        dob,
        gender,
        phone,
        email,
        blood_group: bloodGroup,
        address,
        emergency_contact: emergencyContact
      });
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to register patient. Please check inputs.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete patient ${name}? This will perform a soft-delete and cancel all their future scheduled appointments.`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  // Client Side Filtering and Searching
  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const phoneMatch = p.phone ? p.phone.includes(searchTerm) : false;
    const emailMatch = p.email ? p.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const nameMatch = fullName.includes(searchTerm.toLowerCase());
    
    const matchesSearch = nameMatch || phoneMatch || emailMatch;
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    
    return matchesSearch && matchesGender;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Directory</h1>
          <p className="text-muted-foreground mt-1">Manage and access demographic EMR files.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 self-start sm:self-auto">
          <UserPlus size={16} />
          <span>Register Patient</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Input
              id="search"
              placeholder="Search by patient name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 bottom-3 text-muted-foreground" size={16} />
          </div>
          <div className="w-full md:w-48">
            <Select
              id="gender-filter"
              options={[
                { value: 'All', label: 'All Genders' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-medical-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-muted-foreground text-sm">Loading directory...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
          <ShieldAlert size={20} />
          <span>Failed to load patient directory. Please reload.</span>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow duration-200 border-border">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[180px]">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-foreground hover:text-medical-600 transition-colors">
                        <Link to={`/patients/${patient.id}`}>
                          {patient.first_name} {patient.last_name}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="bg-secondary px-2 py-0.5 rounded-md font-semibold text-foreground">{patient.gender}</span>
                        <span>•</span>
                        <span>DOB: {patient.dob}</span>
                      </div>
                    </div>
                    {patient.blood_group && (
                      <span className="text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-950/40">
                        {patient.blood_group}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground pt-1">
                    {patient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-muted-foreground/60" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-muted-foreground/60" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                  <span className="text-[11px] text-muted-foreground">Added {new Date(patient.created_at).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <Link to={`/patients/${patient.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 py-1">
                        <Eye size={14} />
                        <span>View EMR</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(patient.id, `${patient.first_name} ${patient.last_name}`)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          No patients found matching the criteria.
        </div>
      )}

      {/* Register Dialog Modal */}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Register New Patient" size="lg">
        <form onSubmit={handleRegister} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="firstName"
              label="First Name *"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              id="lastName"
              label="Last Name *"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              id="dob"
              label="Date of Birth *"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <Select
              id="gender"
              label="Gender *"
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
            <Select
              id="bloodGroup"
              label="Blood Group"
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' }
              ]}
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="phone"
              label="Phone Number"
              placeholder="+1 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="jane.smith@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Address
              </label>
              <textarea
                id="address"
                placeholder="Residential Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm"
              />
            </div>
            <div className="w-full">
              <label htmlFor="emergency" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Emergency Contact Details
              </label>
              <textarea
                id="emergency"
                placeholder="Name, Phone, Relation"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Save Patient File
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default Patients;
