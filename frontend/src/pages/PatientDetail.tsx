import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dialog from '../components/ui/Dialog';
import { 
  ArrowLeft, Calendar, FileText, Sparkles, Upload, 
  Paperclip, Trash2, Eye, Cpu, Brain, CheckSquare, 
  User, ShieldAlert, Check, Copy
} from 'lucide-react';

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

interface MedicalRecord {
  id: number;
  visit_date: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
}

interface Attachment {
  id: number;
  file_url: string;
  uploaded_at: string;
}

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  
  // EMR Record form states
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // File Upload states
  const [uploading, setUploading] = useState(false);
  
  // AI Summary states
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  // OCR states
  const [ocrText, setOcrText] = useState('');
  const [runningOcr, setRunningOcr] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch Patient Details
  const { data: patient, isLoading: loadingPatient } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}/`);
      return response.data;
    }
  });

  // Fetch Medical History
  const { data: records = [], isLoading: loadingRecords } = useQuery<MedicalRecord[]>({
    queryKey: ['records', id],
    queryFn: async () => {
      const response = await api.get(`/records/?patient=${id}`);
      return response.data;
    }
  });

  // Fetch Attachments
  const { data: attachments = [], isLoading: loadingAttachments } = useQuery<Attachment[]>({
    queryKey: ['attachments', id],
    queryFn: async () => {
      const response = await api.get(`/files/?patient=${id}`);
      return response.data;
    }
  });

  // Create Record Mutation
  const createRecordMutation = useMutation({
    mutationFn: async (newRecord: Partial<MedicalRecord>) => {
      const response = await api.post('/records/', {
        patient: id,
        ...newRecord
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsRecordDialogOpen(false);
      resetRecordForm();
    }
  });

  // Delete Record Mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: number) => {
      await api.delete(`/records/${recordId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', id] });
    }
  });

  // Delete Attachment Mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await api.delete(`/files/${fileId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', id] });
    }
  });

  const resetRecordForm = () => {
    setVisitDate(new Date().toISOString().split('T')[0]);
    setSymptoms('');
    setDiagnosis('');
    setPrescription('');
    setNotes('');
    setFormError('');
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate || !symptoms) {
      setFormError('Visit Date and Symptoms fields are required.');
      return;
    }

    setFormError('');
    setFormLoading(true);
    try {
      await createRecordMutation.mutateAsync({
        visit_date: visitDate,
        symptoms,
        diagnosis,
        prescription,
        notes
      });
    } catch (err: any) {
      console.error(err);
      setFormError('Failed to create EMR log. Try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (window.confirm("Are you sure you want to remove this medical record permanently?")) {
      try {
        await deleteRecordMutation.mutateAsync(recordId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Trigger AI note formatter
  const handleAIFormatNote = async () => {
    if (!symptoms.trim()) {
      alert("Please enter some symptoms scribbles to format.");
      return;
    }
    
    setIsFormatting(true);
    try {
      const response = await api.post('/ai/format-note/', { raw_text: symptoms });
      setSymptoms(response.data.formatted_text);
    } catch (err) {
      console.error("AI format failed", err);
      alert("AI service formatting failed. Falling back to original notes.");
    } finally {
      setIsFormatting(false);
    }
  };

  // Trigger AI patient summary
  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await api.get(`/ai/patient-summary/${id}/`);
      setAiSummary(response.data.summary);
    } catch (err) {
      console.error("AI summary failed", err);
      setAiSummary("Could not generate clinical history summary at this time.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Trigger File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient', id || '');

    setUploading(true);
    try {
      await api.post('/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      queryClient.invalidateQueries({ queryKey: ['attachments', id] });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file. Support formats are PDF, PNG, JPG, JPEG.");
    } finally {
      setUploading(false);
    }
  };

  // Run AI OCR on uploaded attachment
  const handleRunOCR = async (fileUrl: string) => {
    setRunningOcr(true);
    setIsOcrDialogOpen(true);
    setOcrText('');
    
    try {
      // Fetch the file bytes from the URL to send to Django
      const fileRes = await fetch(fileUrl);
      const blob = await fileRes.blob();
      
      const formData = new FormData();
      // Use original filename or placeholder
      const filename = fileUrl.split('/').pop() || 'report.jpg';
      formData.append('file', blob, filename);
      
      const response = await api.post('/ai/ocr/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setOcrText(response.data.extracted_text);
    } catch (err) {
      console.error("OCR API failed", err);
      setOcrText("OCR Extraction failed. Verify API connection.");
    } finally {
      setRunningOcr(false);
    }
  };

  const copyOcrToClipboard = () => {
    navigator.clipboard.writeText(ocrText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const applyOcrToComposer = () => {
    // Populate clinical findings into symptoms/notes and open composer
    setSymptoms((prev) => `${prev}\n\n[Extracted Report Findings]:\n${ocrText}`.trim());
    setIsOcrDialogOpen(false);
    setIsRecordDialogOpen(true);
  };

  if (loadingPatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <svg className="animate-spin h-8 w-8 text-medical-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-muted-foreground text-sm">Accessing EMR file...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
        <ShieldAlert size={20} />
        <span>Patient record not found. Go back to <Link to="/patients" className="underline font-bold">Directory</Link></span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-4">
        <Link to="/patients" className="p-2 rounded-lg bg-secondary hover:bg-secondary-hover text-foreground transition-all duration-200">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patient.first_name} {patient.last_name}</h1>
          <p className="text-xs text-muted-foreground mt-1">EMR File ID: #{patient.id} • Registered on {new Date(patient.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Demographic Card, AI Summarizer, Document Vault */}
        <div className="space-y-6">
          
          {/* Demographic Card */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 bg-secondary/30">
              <div className="h-9 w-9 rounded-full bg-medical-100 dark:bg-medical-900/40 text-medical-600 dark:text-medical-300 flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <CardTitle className="text-sm">Demographics</CardTitle>
                <CardDescription className="text-xs">Patient identification file</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Gender</span>
                  <span className="font-semibold text-foreground">{patient.gender}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Blood Group</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{patient.blood_group || 'Not Tested'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Date of Birth</span>
                <span className="font-semibold text-foreground">{patient.dob}</span>
              </div>
              {patient.phone && (
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Phone Contact</span>
                  <span className="font-medium text-foreground">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Email Address</span>
                  <span className="font-medium text-foreground truncate block">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Address</span>
                  <span className="text-xs text-foreground block bg-secondary/30 p-2 rounded-lg border border-border/20 mt-1">{patient.address}</span>
                </div>
              )}
              {patient.emergency_contact && (
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Emergency Details</span>
                  <span className="text-xs text-foreground block bg-secondary/30 p-2 rounded-lg border border-border/20 mt-1 italic">{patient.emergency_contact}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Clinical Summary Card */}
          <Card className="border-medical-500/20 shadow-sm relative overflow-hidden bg-card">
            <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-medical-500/10 to-transparent pointer-events-none rounded-bl-full" />
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-medical-100 dark:bg-medical-950/40 text-medical-600 dark:text-medical-400 flex items-center justify-center">
                <Brain size={18} />
              </div>
              <div>
                <CardTitle className="text-sm">Clinical AI Summary</CardTitle>
                <CardDescription className="text-xs">Generated from EMR record history</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {aiSummary ? (
                <div className="text-xs text-foreground bg-secondary/40 border border-border/40 p-3 rounded-lg leading-relaxed whitespace-pre-line animate-fade-in font-sans">
                  {aiSummary}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Click below to synthesize history into a clinical summary.
                </div>
              )}
              <Button 
                onClick={handleGenerateSummary} 
                loading={loadingSummary} 
                variant="outline" 
                className="w-full gap-2 border-medical-500/30 text-medical-600 hover:bg-medical-50 dark:hover:bg-medical-950/20 text-xs py-2"
              >
                <Sparkles size={14} />
                <span>{aiSummary ? 'Refresh AI Summary' : 'Generate AI Summary'}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Attachment Vault */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-secondary text-foreground flex items-center justify-center">
                <Paperclip size={18} />
              </div>
              <div>
                <CardTitle className="text-sm">Medical Document Vault</CardTitle>
                <CardDescription className="text-xs">Upload prescriptions, labs, or reports</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Drag-n-drop simulated area */}
              <label className="border-2 border-dashed border-border hover:border-medical-500/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-all duration-200">
                <Upload size={24} className="text-muted-foreground/80 mb-2" />
                <span className="text-xs font-semibold">Upload Document File</span>
                <span className="text-[10px] text-muted-foreground mt-1">PDF, PNG, JPG, JPEG (Max 10MB)</span>
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                  className="hidden" 
                />
              </label>

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <svg className="animate-spin h-3.5 w-3.5 text-medical-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Uploading to Cloudinary vault...</span>
                </div>
              )}

              {/* Uploaded Files list */}
              {loadingAttachments ? (
                <div className="text-center py-4 text-xs text-muted-foreground">Loading vault files...</div>
              ) : attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((file) => {
                    const isImage = file.file_url?.match(/\.(jpeg|jpg|png|gif)/i);
                    return (
                      <div key={file.id} className="p-2.5 rounded-lg border border-border flex items-center justify-between text-xs bg-card hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                          <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-foreground font-medium">Attachment #{file.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isImage && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRunOCR(file.file_url)}
                              className="p-1 text-medical-600 hover:bg-medical-50 dark:hover:bg-medical-950/20"
                              title="Run AI OCR Extraction"
                            >
                              <Cpu size={14} />
                            </Button>
                          )}
                          <a href={file.file_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="p-1">
                              <Eye size={14} />
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteAttachmentMutation.mutate(file.id)}
                            className="p-1 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground border border-border rounded-lg bg-secondary/10">
                  No attachments logged.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: EMR Consultations Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>EMR Consultation Timeline</CardTitle>
                <CardDescription>Historical clinical records log</CardDescription>
              </div>
              <Button onClick={() => setIsRecordDialogOpen(true)} className="gap-2 text-xs py-2">
                <FileText size={14} />
                <span>Log Visit Note</span>
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {loadingRecords ? (
                <div className="py-20 text-center space-y-4">
                  <svg className="animate-spin h-8 w-8 text-medical-600 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-muted-foreground text-sm">Accessing EMR timeline...</span>
                </div>
              ) : records.length > 0 ? (
                <div className="relative border-l border-border pl-6 space-y-8 ml-3 py-2">
                  {records.map((record) => (
                    <div key={record.id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-border bg-background group-hover:border-medical-500 transition-colors" />
                      
                      <div className="space-y-3 p-4 rounded-xl border border-border bg-card group-hover:shadow-sm transition-all duration-200">
                        {/* Record Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-muted-foreground" />
                            <span className="text-xs font-semibold text-foreground bg-secondary px-2.5 py-0.5 rounded-md">{record.visit_date}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-1 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        {/* Record Content */}
                        <div className="space-y-3.5 text-sm leading-relaxed">
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Symptoms / Chief Complaint</span>
                            <div className="text-foreground whitespace-pre-line bg-secondary/20 p-2.5 rounded-lg border border-border/10 mt-1 font-sans">
                              {record.symptoms}
                            </div>
                          </div>
                          
                          {record.diagnosis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Diagnosis</span>
                                <div className="text-foreground font-semibold bg-medical-50/30 dark:bg-medical-950/20 text-medical-800 dark:text-medical-300 p-2.5 rounded-lg border border-medical-500/10 mt-1">
                                  {record.diagnosis}
                                </div>
                              </div>
                              {record.prescription && (
                                <div>
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Rx Prescription</span>
                                  <div className="text-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/20 mt-1 font-mono text-xs whitespace-pre-line leading-loose">
                                    {record.prescription}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {record.notes && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Clinical Notes</span>
                              <p className="text-muted-foreground text-xs bg-secondary/20 p-2.5 rounded-lg mt-1 italic">{record.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  No medical consultations logged yet. Click visit note composer to create.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Log Visit Note Composer Dialog */}
      <Dialog isOpen={isRecordDialogOpen} onClose={() => setIsRecordDialogOpen(false)} title="Log Consultation Visit" size="lg">
        <form onSubmit={handleCreateRecord} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="w-1/2">
            <Input
              id="visitDate"
              label="Visit Consultation Date *"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="symptoms" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Symptoms & Chief Complaint *
              </label>
              <Button 
                type="button" 
                onClick={handleAIFormatNote} 
                loading={isFormatting}
                variant="outline" 
                className="gap-1.5 text-xs py-1 border-medical-500/20 text-medical-600 hover:bg-medical-50 dark:hover:bg-medical-950/20"
              >
                <Sparkles size={12} />
                <span>AI Auto-Format</span>
              </Button>
            </div>
            <textarea
              id="symptoms"
              placeholder="Enter symptoms scribbles (e.g. fever 3 days, body pain, dry cough). Click AI Auto-Format to clean up..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm ${isFormatting ? 'pulse-glow' : ''}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label htmlFor="diagnosis" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Diagnosis
              </label>
              <textarea
                id="diagnosis"
                placeholder="Enter clinical assessment / primary condition"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm"
              />
            </div>
            <div className="w-full">
              <label htmlFor="prescription" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Rx Prescription
              </label>
              <textarea
                id="prescription"
                placeholder="List medications with dosages and durations (e.g. Paracetamol 650mg TDS x 3 days)"
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm font-mono text-xs"
              />
            </div>
          </div>

          <div className="w-full">
            <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              General Clinical Notes
            </label>
            <textarea
              id="notes"
              placeholder="Notes on dietary recommendations, check-ups, follow-up timelines"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Log Consultation
            </Button>
          </div>
        </form>
      </Dialog>

      {/* AI OCR Extraction Viewer Modal */}
      <Dialog isOpen={isOcrDialogOpen} onClose={() => setIsOcrDialogOpen(false)} title="Clinical AI OCR Report Extractor" size="md">
        <div className="space-y-5">
          {runningOcr ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <svg className="animate-spin h-8 w-8 text-medical-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs text-muted-foreground">Gemini parsing prescription image...</span>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="text-xs text-foreground bg-secondary/40 border border-border/40 p-4 rounded-lg leading-relaxed whitespace-pre-line font-mono select-text max-h-[40vh] overflow-y-auto">
                {ocrText}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={copyOcrToClipboard}
                  className="gap-1.5 text-xs py-1"
                >
                  {copySuccess ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOcrDialogOpen(false)}>
                    Close
                  </Button>
                  <Button type="button" onClick={applyOcrToComposer} className="gap-1.5 text-xs py-1">
                    <CheckSquare size={14} />
                    <span>Apply to Composer</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default PatientDetail;
