import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, addDoc, orderBy, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import Button from '../components/Button';
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Activity, 
  Images, 
  FileText, 
  Settings, 
  Edit,
  Save,
  Camera,
  MapPin,
  Phone,
  User,
  Menu,
  X,
  Clock,
  Clock3,
  Plus,
  Search,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Filter,
  Folder,
  Maximize2,
  Columns,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  FileClock,
  Mail,
  CalendarPlus,
  PlayCircle,
  MessageCircle,
  MoreVertical,
  Wifi,
  BarChart2,
  PieChart,
  UserPlus,
  Printer,
  Share2,
  Download,
  AlertTriangle,
  Database,
  Upload,
  FileJson,
  ShieldAlert
} from 'lucide-react';
import { deleteUser } from 'firebase/auth';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

type TabType = 'dashboard' | 'appointments' | 'patients' | 'evolutions' | 'gallery' | 'reports' | 'settings' | 'profile_edit';

interface UserProfile {
  name: string;
  email: string;
  photoUrl: string;
  whatsapp: string; // Bloqueado
  coren: string;
  specialty: string;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

// Interface do Paciente
interface Patient {
  id?: string;
  professionalId: string;
  name: string;
  photoUrl: string;
  birthDate: string;
  sex: string;
  phone: string;
  email: string;
  status: 'Ativo' | 'Inativo' | 'Finalizado';
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  guardian: {
    name: string;
    phone: string;
  };
  clinical: {
    diagnosis: string;
    comorbidities: string; // Separadas por vírgula
    observations: string;
  };
  logs?: {
    professionalName: string;
    date: string;
    action: string;
  }[];
  createdAt: string;
}

// Interface da Evolução
interface Evolution {
  id?: string;
  professionalId: string;
  patientId: string;
  patientName: string; // Denormalized for gallery display
  patientDiagnosis: string; // Denormalized for gallery display
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  stage: string;
  status: 'Melhora' | 'Estagnação' | 'Piora';
  description: string;
  materials: { name: string; quantity: string }[];
  photoUrl: string;
  createdAt: string;
  professionalName: string; // For Log
}

// Interface de Agendamento
interface Appointment {
  id?: string;
  professionalId: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: 'Agendado' | 'Realizado' | 'Cancelado';
}

// Interfaces de Relatório
type ReportType = 'evolution' | 'general' | 'materials' | null;

interface ReportData {
  generatedAt: string;
  type: ReportType;
  items: any[];
  summary?: any;
  patientInfo?: Patient;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('online');
  const [openAppointmentMenuId, setOpenAppointmentMenuId] = useState<string | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    name: auth.currentUser?.displayName || 'Profissional',
    email: auth.currentUser?.email || '',
    photoUrl: '',
    whatsapp: '',
    coren: '',
    specialty: '',
    address: { street: '', neighborhood: '', city: '', state: '' }
  });

  // Modules State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // View Modes
  const [patientViewMode, setPatientViewMode] = useState<'list' | 'form' | 'details'>('list');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  
  const [evolutionViewMode, setEvolutionViewMode] = useState<'form' | 'details'>('form');
  const [currentEvolution, setCurrentEvolution] = useState<Evolution | null>(null);
  const [tempMaterials, setTempMaterials] = useState<{ name: string; quantity: string }[]>([]);

  // Gallery
  const [galleryViewMode, setGalleryViewMode] = useState<'folders' | 'patient_photos'>('folders');
  const [selectedPatientForGallery, setSelectedPatientForGallery] = useState<Patient | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showSlideShow, setShowSlideShow] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');

  // Report State
  const [reportType, setReportType] = useState<ReportType>(null);
  const [reportConfig, setReportConfig] = useState({
    patientId: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    recordType: 'Todos', // 'Todos', 'Cadastrados', 'Atendidos', 'Agendados'
    patientStatus: 'Todos', // 'Todos', 'Ativo', 'Inativo', 'Finalizado'
  });
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  // Settings / Backup State
  const [backupIncludeProfile, setBackupIncludeProfile] = useState(false);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Filters & Charts
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [visitsHistoryFilter, setVisitsHistoryFilter] = useState<'Hoje' | 'Ontem' | 'Semana'>('Hoje');
  const [lesionChartFilter, setLesionChartFilter] = useState<'Hoje' | 'Semana' | 'Mes'>('Hoje');

  // Modals State
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<Appointment>({
    professionalId: '',
    patientId: '',
    patientName: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    reason: '',
    status: 'Agendado'
  });
  
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedPatientForWA, setSelectedPatientForWA] = useState<Patient | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null; type: 'appointment' | 'patient' }>({
    isOpen: false,
    id: null,
    type: 'appointment'
  });

  // Coren Confirmation
  const [showCorenModal, setShowCorenModal] = useState(false);
  const [saveActionType, setSaveActionType] = useState<'patient' | 'evolution'>('patient');
  const [corenInput, setCorenInput] = useState('');
  const [corenError, setCorenError] = useState('');

  // Initial Form States
  const initialPatientState: Patient = {
    professionalId: '',
    name: '',
    photoUrl: '',
    birthDate: '',
    sex: 'Masculino',
    phone: '',
    email: '',
    status: 'Ativo',
    address: { street: '', number: '', neighborhood: '', city: '', state: '' },
    guardian: { name: '', phone: '' },
    clinical: { diagnosis: '', comorbidities: '', observations: '' },
    createdAt: new Date().toISOString()
  };

  const initialEvolutionState: Evolution = {
    professionalId: '',
    patientId: '',
    patientName: '',
    patientDiagnosis: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
    stage: '',
    status: 'Estagnação',
    description: '',
    materials: [],
    photoUrl: '',
    createdAt: '',
    professionalName: ''
  };

  // --- Real-time Data Listeners ---
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // Listen to Profile
    const unsubProfile = onSnapshot(doc(db, 'users', uid), (doc) => {
        if (doc.exists()) {
           const data = doc.data();
           setProfile(prev => ({ ...prev, ...data, address: { ...prev.address, ...(data.address || {}) } }));
        }
    });

    // Listen to Patients
    const qPatients = query(collection(db, 'patients'), where('professionalId', '==', uid));
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
        const list: Patient[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Patient));
        setPatients(list);
    }, (error) => setDbStatus('offline'));

    // Listen to Evolutions
    const qEvolutions = query(collection(db, 'evolutions'), where('professionalId', '==', uid));
    const unsubEvolutions = onSnapshot(qEvolutions, (snapshot) => {
        const list: Evolution[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Evolution));
        // Sort client side
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEvolutions(list);
    }, (error) => setDbStatus('offline'));

    // Listen to Appointments
    const qAppointments = query(collection(db, 'appointments'), where('professionalId', '==', uid));
    const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
        const list: Appointment[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Appointment));
        // Sort client side by date/time
        list.sort((a, b) => {
           const dateA = new Date(`${a.date}T${a.time}`);
           const dateB = new Date(`${b.date}T${b.time}`);
           return dateA.getTime() - dateB.getTime();
        });
        setAppointments(list);
        setDbStatus('online');
    }, (error) => setDbStatus('offline'));

    return () => {
       unsubProfile();
       unsubPatients();
       unsubEvolutions();
       unsubAppointments();
    };
  }, []);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Se clicar dentro de um modal de deleção, não faz nada
      if ((event.target as HTMLElement).closest('.delete-modal-content')) return;

      if (openAppointmentMenuId && !(event.target as Element).closest('.appointment-menu-trigger')) {
        setOpenAppointmentMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openAppointmentMenuId]);

  // --- Actions ---

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Confirmação direta para evitar bloqueios em dispositivos móveis
    const confirmAction = window.confirm("Tem certeza que deseja sair do sistema?");
    
    if (confirmAction) {
      try {
        await auth.signOut();
      } catch (error) {
        console.error("Erro logout:", error);
      } finally {
        // Força a navegação independentemente de sucesso/erro na API
        onNavigate('home');
      }
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'patient' | 'evolution') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === 'profile') setProfile({ ...profile, photoUrl: result });
        else if (target === 'patient' && currentPatient) setCurrentPatient({ ...currentPatient, photoUrl: result });
        else if (target === 'evolution' && currentEvolution) setCurrentEvolution({ ...currentEvolution, photoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), profile, { merge: true });
      alert('Perfil atualizado!');
      setActiveTab('dashboard');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  // --- BACKUP & DELETE ACCOUNT LOGIC ---

  const handleExportData = () => {
    if (!auth.currentUser) return;
    
    setIsProcessingBackup(true);
    
    try {
      // Prepare Data Object
      const backupData = {
        metadata: {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          exportedBy: auth.currentUser.uid,
          platform: 'ESTOMAPRO'
        },
        profile: backupIncludeProfile ? profile : null,
        patients: patients,
        evolutions: evolutions,
        appointments: appointments
      };

      // Create JSON File
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup_estomapro_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert('Backup gerado com sucesso! O download iniciará automaticamente.');
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar backup.');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!auth.currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmImport = window.confirm("ATENÇÃO: A importação irá adicionar os dados ao seu painel atual. Dados duplicados podem ser criados se você importar o mesmo arquivo duas vezes. Deseja continuar?");
    if (!confirmImport) {
       e.target.value = ''; // Reset input
       return;
    }

    setIsProcessingBackup(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        if (event.target?.result) {
          const json = JSON.parse(event.target.result as string);
          
          // Basic Validation
          if (!json.patients || !Array.isArray(json.patients)) {
             throw new Error("Formato de arquivo inválido.");
          }

          const currentUserId = auth.currentUser!.uid;
          
          // 1. Import Profile (Optional overwrite)
          if (json.profile && backupIncludeProfile) {
             await setDoc(doc(db, 'users', currentUserId), json.profile, { merge: true });
          }

          // 2. Import Patients & Map IDs
          // We need to map Old IDs (from JSON) to New IDs (Firestore) to maintain relationships
          const idMap: Record<string, string> = {}; 

          for (const p of json.patients) {
             const originalId = p.id;
             // Remove ID to auto-generate new one, update professionalId to current user
             const { id, ...patientData } = p;
             const newPatientData = { ...patientData, professionalId: currentUserId };
             
             const docRef = await addDoc(collection(db, 'patients'), newPatientData);
             if (originalId) idMap[originalId] = docRef.id;
          }

          // 3. Import Evolutions (using mapped IDs)
          if (json.evolutions && Array.isArray(json.evolutions)) {
             for (const evo of json.evolutions) {
                const { id, ...evoData } = evo;
                // Update professionalId
                let newEvoData = { ...evoData, professionalId: currentUserId };
                
                // Update patientId if mapped
                if (evoData.patientId && idMap[evoData.patientId]) {
                   newEvoData.patientId = idMap[evoData.patientId];
                }

                await addDoc(collection(db, 'evolutions'), newEvoData);
             }
          }

          // 4. Import Appointments (using mapped IDs)
          if (json.appointments && Array.isArray(json.appointments)) {
             for (const app of json.appointments) {
                const { id, ...appData } = app;
                // Update professionalId
                let newAppData = { ...appData, professionalId: currentUserId };

                // Update patientId if mapped
                if (appData.patientId && idMap[appData.patientId]) {
                   newAppData.patientId = idMap[appData.patientId];
                }

                await addDoc(collection(db, 'appointments'), newAppData);
             }
          }

          alert('Dados importados com sucesso! O sistema foi atualizado.');
          window.location.reload(); // Reload to refresh data
        }
      } catch (error) {
        console.error("Import Error:", error);
        alert('Erro ao importar arquivo. Verifique se o formato está correto.');
      } finally {
        setIsProcessingBackup(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handlePermanentAccountDeletion = async () => {
    if (!auth.currentUser) return;
    
    // Safety check text
    const confirmText = prompt("Esta ação é IRREVERSÍVEL. Todos os seus pacientes, fotos, evoluções e dados serão apagados permanentemente. Para confirmar, digite 'DELETAR' abaixo:");
    
    if (confirmText !== 'DELETAR') {
       alert("Texto de confirmação incorreto. Ação cancelada.");
       return;
    }

    setLoading(true);
    const uid = auth.currentUser.uid;

    try {
      // 1. Delete Patients
      const qPatients = query(collection(db, 'patients'), where('professionalId', '==', uid));
      const pSnaps = await getDocs(qPatients);
      const batch1 = writeBatch(db);
      pSnaps.forEach(doc => batch1.delete(doc.ref));
      await batch1.commit();

      // 2. Delete Evolutions
      const qEvolutions = query(collection(db, 'evolutions'), where('professionalId', '==', uid));
      const eSnaps = await getDocs(qEvolutions);
      const batch2 = writeBatch(db); // New batch (limit 500)
      eSnaps.forEach(doc => batch2.delete(doc.ref));
      await batch2.commit();

      // 3. Delete Appointments
      const qAppointments = query(collection(db, 'appointments'), where('professionalId', '==', uid));
      const aSnaps = await getDocs(qAppointments);
      const batch3 = writeBatch(db);
      aSnaps.forEach(doc => batch3.delete(doc.ref));
      await batch3.commit();

      // 4. Delete User Profile
      await deleteDoc(doc(db, 'users', uid));

      // 5. Delete Auth Account
      await deleteUser(auth.currentUser);

      alert("Conta excluída com sucesso.");
      onNavigate('home');

    } catch (error: any) {
      console.error("Delete Error:", error);
      if (error.code === 'auth/requires-recent-login') {
         alert("Por segurança, é necessário fazer login novamente antes de excluir sua conta. Faça login e tente novamente.");
         await auth.signOut();
         onNavigate('login');
      } else {
         alert("Erro ao excluir conta: " + error.message);
      }
    } finally {
       setLoading(false);
       setShowDeleteAccountModal(false);
    }
  };


  // --- APPOINTMENT LOGIC ---

  const openNewAppointment = () => {
     if(!auth.currentUser) return;
     setAppointmentForm({
        professionalId: auth.currentUser.uid,
        patientId: '',
        patientName: '',
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        reason: '',
        status: 'Agendado'
     });
     setShowAppointmentModal(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!appointmentForm.patientId) return alert("Selecione um paciente");

     // Validação de Data/Hora (Não permitir passado)
     const selectedDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
     const now = new Date();
     
     // Adiciona uma pequena tolerância de 1 minuto para evitar bugs de delay
     if (selectedDateTime.getTime() < now.getTime() - 60000) {
        alert("Não é permitido agendar para datas ou horários que já passaram.");
        return;
     }
     
     // Find patient name
     const p = patients.find(pat => pat.id === appointmentForm.patientId);
     const dataToSave = { ...appointmentForm, patientName: p ? p.name : 'Desconhecido' };

     try {
        if(appointmentForm.id) {
           await setDoc(doc(db, 'appointments', appointmentForm.id), dataToSave);
        } else {
           await addDoc(collection(db, 'appointments'), dataToSave);
        }
        setShowAppointmentModal(false);
        // alert("Agendamento salvo!");
     } catch (err) {
        console.error(err);
        alert("Erro ao salvar agendamento");
     }
  };

  const initiateDeleteAppointment = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Impede fechar menu
      setOpenAppointmentMenuId(null); // Fecha menu propositalmente
      setDeleteConfirmation({ isOpen: true, id, type: 'appointment' });
  };

  const confirmDeleteAction = async () => {
      if (!deleteConfirmation.id) return;
      const id = deleteConfirmation.id;
      
      try {
         if (deleteConfirmation.type === 'appointment') {
             await deleteDoc(doc(db, 'appointments', id));
             console.log("Agendamento excluído com sucesso");
         } else if (deleteConfirmation.type === 'patient') {
             await deleteDoc(doc(db, 'patients', id));
             console.log("Paciente excluído com sucesso");
         }
         
         setDeleteConfirmation({ isOpen: false, id: null, type: 'appointment' });
      } catch (error: any) {
         console.error("Erro ao excluir:", error);
         alert(`ERRO DE PERMISSÃO: Não foi possível excluir. \nDetalhes: ${error.message}\nVerifique sua conexão ou contate o suporte.`);
         setDeleteConfirmation({ isOpen: false, id: null, type: 'appointment' });
      }
  };

  const cancelDeleteAction = () => {
      setDeleteConfirmation({ isOpen: false, id: null, type: 'appointment' });
  };

  const handleReschedule = (app: Appointment) => {
     setAppointmentForm(app);
     setShowAppointmentModal(true);
     setOpenAppointmentMenuId(null);
  };

  const handleStartEvolution = async (app: Appointment) => {
      const patient = patients.find(p => p.id === app.patientId);
      if(patient) {
          // Atualiza o status do agendamento para 'Realizado' para sair da agenda
          if (app.id) {
             try {
                await updateDoc(doc(db, 'appointments', app.id), { status: 'Realizado' });
             } catch (error) {
                console.error("Erro ao atualizar status do agendamento:", error);
             }
          }

          // Redirect to Evolution Form
          setActiveTab('evolutions');
          if (auth.currentUser) {
            setCurrentEvolution({ 
                ...initialEvolutionState, 
                professionalId: auth.currentUser.uid,
                patientId: patient.id!,
                patientName: patient.name,
                patientDiagnosis: patient.clinical.diagnosis 
            });
          }
          setEvolutionViewMode('form');
          setTempMaterials([]);
      } else {
         alert("Paciente não encontrado na base de dados.");
      }
  };

  const isLate = (dateStr: string, timeStr: string) => {
     const appDate = new Date(`${dateStr}T${timeStr}`);
     const now = new Date();
     return appDate < now;
  };

  const toggleAppointmentMenu = (id: string) => {
     if (openAppointmentMenuId === id) {
        setOpenAppointmentMenuId(null);
     } else {
        setOpenAppointmentMenuId(id);
     }
  };

  // --- WHATSAPP LOGIC ---
  const handleOpenWhatsAppModal = (patientId: string) => {
      const p = patients.find(pat => pat.id === patientId);
      if(p) {
         setSelectedPatientForWA(p);
         setShowWhatsAppModal(true);
      }
  };

  const sendWhatsApp = (phone: string) => {
      const clean = phone.replace(/\D/g, '');
      if(clean.length < 10) return alert("Número inválido");
      window.open(`https://wa.me/55${clean}`, '_blank');
      setShowWhatsAppModal(false);
  };

  // --- PATIENTS LOGIC ---
  const handleNewPatient = () => {
    if (!auth.currentUser) return;
    setCurrentPatient({ ...initialPatientState, professionalId: auth.currentUser.uid });
    setPatientViewMode('form');
  };

  const handleEditPatient = (patient: Patient) => {
    setCurrentPatient(patient);
    setPatientViewMode('form');
  };

  const handleViewPatientDetails = (patient: Patient) => {
    setCurrentPatient(patient);
    setPatientViewMode('details');
  };

  const handleDeletePatient = async (patientId: string) => {
     setDeleteConfirmation({ isOpen: true, id: patientId, type: 'patient' });
  };

  // --- EVOLUTIONS LOGIC ---
  const initiateNewEvolution = () => {
      if (!auth.currentUser) return;
      setCurrentEvolution({ ...initialEvolutionState, professionalId: auth.currentUser.uid });
      setTempMaterials([]);
      setEvolutionViewMode('form');
      setActiveTab('evolutions');
  };

  const handleAddMaterial = () => setTempMaterials([...tempMaterials, { name: '', quantity: '' }]);
  const handleRemoveMaterial = (i: number) => {
    const list = [...tempMaterials];
    list.splice(i, 1);
    setTempMaterials(list);
  };
  const handleMaterialChange = (i: number, f: 'name'|'quantity', v: string) => {
    const list = [...tempMaterials];
    list[i][f] = v;
    setTempMaterials(list);
  };

  const handleOpenEvolutionFromHistory = (evo: Evolution) => {
    setCurrentEvolution(evo);
    setActiveTab('evolutions');
    setEvolutionViewMode('details');
  };

  // --- REPORT LOGIC ---

  const handleGenerateReport = () => {
    const { startDate, endDate, patientId, recordType, patientStatus } = reportConfig;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59); // Include full end day

    if (reportType === 'evolution') {
       if (!patientId) return alert('Selecione um paciente');
       const patient = patients.find(p => p.id === patientId);
       if (!patient) return;

       // Filter Evolutions
       const filteredEvolutions = evolutions.filter(e => {
          const d = new Date(e.date);
          return e.patientId === patientId; // Usually evolution report is full history, or could use dates
       });

       setGeneratedReport({
          generatedAt: new Date().toLocaleString('pt-BR'),
          type: 'evolution',
          patientInfo: patient,
          items: filteredEvolutions
       });

    } else if (reportType === 'general') {
       let items: any[] = [];
       
       // 1. Cadastrados (Patients)
       if (recordType === 'Todos' || recordType === 'Cadastrados') {
          const filteredPatients = patients.filter(p => {
             const created = new Date(p.createdAt);
             const matchesStatus = patientStatus === 'Todos' || p.status === patientStatus;
             return created >= start && created <= end && matchesStatus;
          }).map(p => ({
             date: p.createdAt,
             type: 'Cadastro de Paciente',
             description: p.name,
             status: p.status
          }));
          items = [...items, ...filteredPatients];
       }

       // 2. Atendidos (Evoluções) e Agendamentos Realizados
       if (recordType === 'Todos' || recordType === 'Atendidos') {
         // Evoluções
         const filteredEvolutions = evolutions.filter(e => {
            const date = new Date(`${e.date}T${e.time}`);
            const pat = patients.find(p => p.id === e.patientId);
            const matchesStatus = patientStatus === 'Todos' || (pat && pat.status === patientStatus);
            return date >= start && date <= end && matchesStatus;
         }).map(e => ({
            date: `${e.date}T${e.time}`,
            type: 'Evolução Realizada',
            description: e.patientName,
            status: e.status
         }));
         items = [...items, ...filteredEvolutions];
       }

       // 3. Agendados (Appointments)
       if (recordType === 'Todos' || recordType === 'Agendados') {
         const filteredAppointments = appointments.filter(a => {
            const date = new Date(`${a.date}T${a.time}`);
            const pat = patients.find(p => p.id === a.patientId);
            const matchesStatus = patientStatus === 'Todos' || (pat && pat.status === patientStatus);
            return date >= start && date <= end && matchesStatus;
         }).map(a => ({
            date: `${a.date}T${a.time}`,
            type: 'Agendamento',
            description: a.patientName,
            status: a.status
         }));
         items = [...items, ...filteredAppointments];
       }

       // Sort by date
       items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

       setGeneratedReport({
          generatedAt: new Date().toLocaleString('pt-BR'),
          type: 'general',
          items: items,
          summary: { startDate: start.toLocaleDateString(), endDate: end.toLocaleDateString() }
       });

    } else if (reportType === 'materials') {
       // Filter Evolutions in Range
       const filteredEvolutions = evolutions.filter(e => {
         const date = new Date(e.date);
         return date >= start && date <= end;
       });

       const materialStats: Record<string, number> = {};
       
       filteredEvolutions.forEach(e => {
          if (e.materials) {
             e.materials.forEach(m => {
                const qty = parseFloat(m.quantity) || 0; // Try to parse quantity if it's "2", "2.5". If "2ml", parseFloat gets 2.
                if (materialStats[m.name]) {
                   materialStats[m.name] += qty;
                } else {
                   materialStats[m.name] = qty;
                }
             });
          }
       });

       const items = Object.entries(materialStats).map(([name, qty]) => ({ name, qty }));

       setGeneratedReport({
          generatedAt: new Date().toLocaleString('pt-BR'),
          type: 'materials',
          items: items,
          summary: { 
             totalEvolutions: filteredEvolutions.length,
             startDate: start.toLocaleDateString(), 
             endDate: end.toLocaleDateString() 
          }
       });
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleShareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Relatório ESTOMAPRO',
          text: `Relatório gerado em ${new Date().toLocaleString()}`,
          url: window.location.href, // Sharing URL as fallback
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      alert('Compartilhamento não suportado neste navegador. Use a opção de imprimir para salvar como PDF.');
    }
  };


  // --- GALLERY LOGIC ---
  const handleOpenPatientGallery = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        setSelectedPatientForGallery(patient);
        setGalleryViewMode('patient_photos');
        setCompareList([]);
    }
  };

  const toggleCompare = (evolutionId: string) => {
    if (compareList.includes(evolutionId)) {
        setCompareList(compareList.filter(id => id !== evolutionId));
    } else {
        if (compareList.length < 4) setCompareList([...compareList, evolutionId]);
        else alert("Máximo de 4 fotos.");
    }
  };

  // --- SAVE LOGIC (AUTH) ---
  const initiateSave = (e: React.FormEvent, type: 'patient' | 'evolution') => {
    e.preventDefault();
    setCorenError('');
    setCorenInput('');
    setSaveActionType(type);
    setShowCorenModal(true);
  };

  const confirmCorenAuth = async () => {
    if (!auth.currentUser) return;
    if (corenInput.trim() !== profile.coren.trim()) {
      setCorenError('O COREN digitado não confere.');
      return;
    }
    setLoading(true);
    setShowCorenModal(false);

    try {
      if (saveActionType === 'patient' && currentPatient) {
          const now = new Date().toISOString();
          const logEntry = { professionalName: profile.name, date: now, action: currentPatient.id ? 'Atualização' : 'Novo Cadastro' };
          const patientData = { ...currentPatient, logs: currentPatient.logs ? [...currentPatient.logs, logEntry] : [logEntry] };

          if (currentPatient.id) await setDoc(doc(db, 'patients', currentPatient.id), patientData);
          else await addDoc(collection(db, 'patients'), patientData);
          
          alert('Paciente salvo com sucesso!');
          setPatientViewMode('list');

      } else if (saveActionType === 'evolution' && currentEvolution) {
          const selectedPatient = patients.find(p => p.id === currentEvolution.patientId);
          if (!selectedPatient) throw new Error("Paciente não selecionado");

          const evolutionData: Evolution = {
              ...currentEvolution,
              patientName: selectedPatient.name,
              patientDiagnosis: selectedPatient.clinical.diagnosis,
              professionalName: profile.name,
              materials: tempMaterials,
              createdAt: new Date().toISOString()
          };
          
          await addDoc(collection(db, 'evolutions'), evolutionData);
          alert('Evolução registrada com sucesso!');
          setActiveTab('dashboard');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    if (tab === 'patients') setPatientViewMode('list');
    if (tab === 'evolutions') {
       if (auth.currentUser) setCurrentEvolution({ ...initialEvolutionState, professionalId: auth.currentUser.uid });
       setTempMaterials([]);
       setEvolutionViewMode('form');
    }
    if (tab === 'gallery') {
      setGalleryViewMode('folders');
      setGallerySearchTerm('');
    }
    if (tab === 'reports') {
      setGeneratedReport(null);
      setReportType(null);
    }
  };

  // --- Helpers for Charts/Lists ---
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = currentTime.toLocaleDateString('pt-BR', dateOptions);
  const formattedTime = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Filter Logic
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-500';
      case 'Inativo': return 'bg-red-500';
      case 'Finalizado': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  // Calculated Stats
  // Ajuste para usar a data local, evitando UTC que pode mostrar "dia seguinte" dependendo do fuso
  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');

  const stats = {
    totalPatients: patients.length,
    evolutionsToday: evolutions.filter(e => e.date === todayStr).length,
    appointmentsToday: appointments.filter(a => a.date === todayStr && a.status === 'Agendado').length,
  };

  // Charts Helpers
  const getWeeklyVisits = () => {
      // Last 7 days
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const counts = [0,0,0,0,0,0,0];
      const today = new Date();
      
      evolutions.forEach(evo => {
          const d = new Date(evo.date);
          const diffTime = Math.abs(today.getTime() - d.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if(diffDays <= 7) {
             counts[d.getDay()]++;
          }
      });
      return days.map((day, idx) => ({ day, count: counts[idx] }));
  };

  const getFilteredPerformedVisits = () => {
      let filtered = evolutions;
      if (visitsHistoryFilter === 'Hoje') {
         filtered = evolutions.filter(e => e.date === todayStr);
      } else if (visitsHistoryFilter === 'Ontem') {
         const yesterday = new Date();
         yesterday.setDate(yesterday.getDate() - 1);
         const yStr = [
            yesterday.getFullYear(),
            String(yesterday.getMonth() + 1).padStart(2, '0'),
            String(yesterday.getDate()).padStart(2, '0')
         ].join('-');
         filtered = evolutions.filter(e => e.date === yStr);
      } else { // Semana
         // Last 7 days logic simplified
         filtered = evolutions.slice(0, 20); // Just showing last 20 for "Last Week" demo
      }
      return filtered;
  };

  const getLesionTypes = () => {
      // Filter logic can be applied here. For now, aggregate all or filtered by date.
      const types: Record<string, number> = {};
      evolutions.forEach(e => {
         const diag = e.patientDiagnosis || 'Não informado';
         types[diag] = (types[diag] || 0) + 1;
      });
      return Object.entries(types).map(([name, count]) => ({ name, count }));
  };

  // Gallery
  const patientsWithPhotos = patients.filter(p => {
    const hasPhotos = evolutions.some(e => e.patientId === p.id && e.photoUrl);
    const matchesGallerySearch = p.name.toLowerCase().includes(gallerySearchTerm.toLowerCase());
    return hasPhotos && matchesGallerySearch;
  });
  const galleryPhotos = selectedPatientForGallery 
     ? evolutions.filter(e => e.patientId === selectedPatientForGallery.id && e.photoUrl)
     : [];


  return (
    <div className="flex min-h-screen bg-gray-50 font-sans overflow-hidden">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; -webkit-print-color-adjust: exact; }
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          .print-only { display: block !important; width: 210mm; min-height: 297mm; margin: 0 auto; background: white; padding: 10mm; }
          .shadow-soft, .shadow-2xl, .shadow-lg, .shadow-sm { box-shadow: none !important; }
          .bg-gray-50, .bg-brand-surface { background-color: white !important; }
          /* Reset scroll for print */
          .overflow-y-auto, .overflow-x-hidden { overflow: visible !important; height: auto !important; }
        }
        .print-only { display: none; }
      `}</style>
      
      {/* --- MODALS --- */}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-up delete-modal-content">
               <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                     <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h3>
                  <p className="text-sm text-gray-500 mt-2">
                     Tem certeza que deseja excluir este {deleteConfirmation.type === 'appointment' ? 'agendamento' : 'paciente'}? <br/>
                     <span className="font-bold text-red-500">Esta ação não pode ser desfeita.</span>
                  </p>
               </div>
               <div className="flex gap-3">
                  <Button variant="ghost" className="w-full border border-gray-200" onClick={cancelDeleteAction}>Cancelar</Button>
                  <Button variant="primary" className="w-full bg-red-500 hover:bg-red-600 border-transparent" onClick={confirmDeleteAction}>
                     Excluir Agora
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* Delete Account Modal (Zona de Perigo) */}
      {showDeleteAccountModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-up">
               <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 animate-pulse">
                     <ShieldAlert size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Zona de Perigo</h3>
                  <p className="text-base text-gray-600 mt-4 leading-relaxed">
                     Você está prestes a excluir <span className="font-bold text-red-600">permanentemente</span> sua conta e todos os dados associados (pacientes, evoluções, fotos).
                  </p>
                  <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg text-sm text-red-800 text-left w-full">
                     <ul className="list-disc pl-5 space-y-1">
                        <li>Esta ação não pode ser desfeita.</li>
                        <li>Seus dados não poderão ser recuperados.</li>
                        <li>Seu acesso será revogado imediatamente.</li>
                     </ul>
                  </div>
               </div>
               <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    className="w-full bg-red-600 hover:bg-red-700 border-transparent text-white font-bold py-4 shadow-lg shadow-red-200" 
                    onClick={handlePermanentAccountDeletion}
                    disabled={loading}
                  >
                     {loading ? 'Processando...' : 'SIM, EXCLUIR MINHA CONTA'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full border border-gray-200 py-3" 
                    onClick={() => setShowDeleteAccountModal(false)}
                    disabled={loading}
                  >
                     Cancelar e Manter Conta
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* COREN Modal */}
      {showCorenModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-up">
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-4 text-brand-dark"><Activity size={32} /></div>
               <h3 className="text-xl font-bold text-gray-800">Autenticação Profissional</h3>
               <p className="text-sm text-gray-500 mt-2">Informe seu COREN para assinar.</p>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Seu COREN</label>
                  <input type="text" value={corenInput} onChange={(e) => setCorenInput(e.target.value)} placeholder="Ex: 000.000-ENF" className="w-full p-3 border border-gray-300 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none text-center font-mono font-bold uppercase" />
               </div>
               {corenError && <div className="text-red-500 text-xs flex items-center gap-1 justify-center bg-red-50 p-2 rounded"><AlertCircle size={12} /> {corenError}</div>}
            </div>
            <div className="flex gap-3 mt-8">
               <Button variant="ghost" className="w-full" onClick={() => setShowCorenModal(false)}>Cancelar</Button>
               <Button variant="primary" className="w-full" onClick={confirmCorenAuth}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-up">
               <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <CalendarPlus size={24} className="text-brand-vivid" />
                  {appointmentForm.id ? 'Editar Agendamento' : 'Novo Agendamento'}
               </h3>
               <form onSubmit={handleSaveAppointment} className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Paciente</label>
                     <select 
                        required
                        value={appointmentForm.patientId} 
                        onChange={e => setAppointmentForm({...appointmentForm, patientId: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        disabled={!!appointmentForm.id}
                     >
                        <option value="">Selecione...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                        <input type="date" required value={appointmentForm.date} onChange={e => setAppointmentForm({...appointmentForm, date: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Hora</label>
                        <input type="time" required value={appointmentForm.time} onChange={e => setAppointmentForm({...appointmentForm, time: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" />
                     </div>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Motivo</label>
                     <input type="text" required value={appointmentForm.reason} onChange={e => setAppointmentForm({...appointmentForm, reason: e.target.value})} placeholder="Ex: Curativo, Avaliação..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" />
                  </div>
                  <div className="flex gap-3 pt-4">
                     <Button type="button" variant="ghost" className="w-full" onClick={() => setShowAppointmentModal(false)}>Cancelar</Button>
                     <Button type="submit" variant="primary" className="w-full">Salvar</Button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* WhatsApp Selection Modal */}
      {showWhatsAppModal && selectedPatientForWA && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-up">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-500" /> Contatar via WhatsApp
               </h3>
               <p className="text-sm text-gray-500 mb-6">Selecione quem deseja contatar:</p>
               <div className="space-y-3">
                  <button onClick={() => sendWhatsApp(selectedPatientForWA.phone)} className="w-full p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl flex items-center justify-between transition-colors">
                     <div className="text-left">
                        <p className="font-bold text-green-800">Paciente</p>
                        <p className="text-xs text-green-600">{selectedPatientForWA.name}</p>
                     </div>
                     <MessageCircle size={20} className="text-green-600" />
                  </button>
                  {selectedPatientForWA.guardian.phone && (
                     <button onClick={() => sendWhatsApp(selectedPatientForWA.guardian.phone)} className="w-full p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl flex items-center justify-between transition-colors">
                        <div className="text-left">
                           <p className="font-bold text-green-800">Responsável</p>
                           <p className="text-xs text-green-600">{selectedPatientForWA.guardian.name}</p>
                        </div>
                        <MessageCircle size={20} className="text-green-600" />
                     </button>
                  )}
               </div>
               <button onClick={() => setShowWhatsAppModal(false)} className="mt-6 w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-800">Cancelar</button>
            </div>
         </div>
      )}

      {/* Gallery Modals (SlideShow / Compare) */}
      {showSlideShow && galleryPhotos.length > 0 && (
          <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center no-print">
             <button className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2" onClick={() => setShowSlideShow(false)}><X size={32} /></button>
             <div className="relative w-full h-full flex items-center justify-center p-4">
                <button className="absolute left-4 text-white hover:bg-white/10 p-2 rounded-full" onClick={() => setCurrentSlideIndex(prev => prev === 0 ? galleryPhotos.length - 1 : prev - 1)}><ChevronLeft size={40} /></button>
                <div className="max-h-[90vh] max-w-4xl flex flex-col items-center">
                   <img src={galleryPhotos[currentSlideIndex].photoUrl} className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl" />
                   <div className="mt-4 text-center text-white">
                      <p className="font-bold text-lg">{new Date(galleryPhotos[currentSlideIndex].date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-sm opacity-80">{galleryPhotos[currentSlideIndex].patientDiagnosis}</p>
                      <p className="text-xs mt-1 opacity-50">{currentSlideIndex + 1} de {galleryPhotos.length}</p>
                   </div>
                </div>
                <button className="absolute right-4 text-white hover:bg-white/10 p-2 rounded-full" onClick={() => setCurrentSlideIndex(prev => prev === galleryPhotos.length - 1 ? 0 : prev + 1)}><ChevronRight size={40} /></button>
             </div>
          </div>
      )}
      {showComparisonModal && compareList.length > 0 && (
        <div className="fixed inset-0 z-[80] bg-brand-black/95 backdrop-blur flex flex-col animate-fade-up no-print">
           <header className="flex justify-between items-center p-4 bg-black/50 border-b border-white/10 text-white">
              <div className="flex items-center gap-3">
                 <Columns size={20} className="text-brand-vivid" />
                 <h3 className="font-bold text-lg">Comparativo</h3>
                 <span className="bg-white/10 text-xs px-2 py-1 rounded-full">{compareList.length} imagens</span>
              </div>
              <button onClick={() => setShowComparisonModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
           </header>
           <div className={`flex-1 p-4 grid gap-4 overflow-auto ${compareList.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {compareList.map(id => {
                 const item = evolutions.find(e => e.id === id);
                 if (!item) return null;
                 return (
                    <div key={id} className="relative bg-black rounded-xl overflow-hidden border border-white/20 group">
                       <img src={item.photoUrl} className="w-full h-full object-contain" />
                       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12 text-white">
                          <p className="font-bold text-brand-vivid text-lg">{new Date(item.date).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm text-gray-300">{item.stage}</p>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-1 inline-block ${item.status === 'Melhora' ? 'bg-green-500/20 text-green-400' : item.status === 'Piora' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{item.status}</span>
                       </div>
                    </div>
                 )
              })}
           </div>
        </div>
      )}
      
      {/* Compare Footer Bar */}
      {compareList.length > 0 && activeTab === 'gallery' && !showSlideShow && !showComparisonModal && (
         <div className="fixed bottom-0 left-0 md:left-72 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 z-40 animate-fade-up border-t border-brand-mid/20 no-print">
             <div className="flex justify-between items-center max-w-6xl mx-auto">
                 <div className="flex -space-x-2">
                    {compareList.map(id => (<div key={id} className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden bg-gray-200 shadow-sm"><img src={evolutions.find(e => e.id === id)?.photoUrl} className="w-full h-full object-cover" /></div>))}
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setCompareList([])} className="h-10 text-xs font-bold" type="button">Limpar</Button>
                    <Button variant="primary" onClick={() => setShowComparisonModal(true)} className="flex items-center gap-2 h-10 text-xs font-bold" type="button"><Columns size={16} /> Comparar</Button>
                 </div>
             </div>
         </div>
      )}

      {/* --- SIDEBAR --- */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm no-print" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`w-72 bg-white h-screen fixed left-0 top-0 shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 no-print`}>
        <div>
           <div className="p-6 md:p-8 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded bg-brand-vivid flex items-center justify-center text-brand-black shadow-lg shadow-brand-vivid/20"><Activity size={24} /></div>
                 <span className="text-xl font-bold text-brand-black tracking-tight">ESTOMA<span className="text-brand-mid">PRO</span></span>
              </div>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-brand-dark"><X size={24} /></button>
           </div>
           <div className="px-8 mt-[-10px] text-xs text-gray-400 font-medium uppercase tracking-wider">Painel do Profissional</div>
           <nav className="mt-8 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
              <SidebarItem icon={Calendar} label="Agendamentos" active={activeTab === 'appointments'} onClick={() => handleTabChange('appointments')} />
              <SidebarItem icon={Users} label="Pacientes" active={activeTab === 'patients'} onClick={() => handleTabChange('patients')} />
              <SidebarItem icon={Activity} label="Evoluções" active={activeTab === 'evolutions'} onClick={() => handleTabChange('evolutions')} />
              <SidebarItem icon={Images} label="Galeria de Lesões" active={activeTab === 'gallery'} onClick={() => handleTabChange('gallery')} />
              <SidebarItem icon={FileText} label="Relatórios" active={activeTab === 'reports'} onClick={() => handleTabChange('reports')} />
              <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
           </nav>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-surface border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                 {profile.photoUrl ? <img src={profile.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brand-mid text-white"><User size={20} /></div>}
              </div>
              <div className="overflow-hidden">
                 <h4 className="text-sm font-bold text-gray-800 truncate">{profile.name}</h4>
                 <p className="text-xs text-gray-500 truncate" title={profile.email}>{profile.email}</p>
                 {profile.coren && <p className="text-[10px] text-brand-dark font-bold mt-0.5 truncate uppercase tracking-wider">COREN: {profile.coren}</p>}
              </div>
           </div>
           <div className="grid grid-cols-2 gap-2">
             <button type="button" onClick={() => handleTabChange('profile_edit')} className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-brand-dark hover:border-brand-mid/50 transition-colors shadow-sm"><Edit size={14} /> Editar</button>
             <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"><LogOut size={14} /> Sair</button>
           </div>
        </div>
      </aside>

      {/* --- MAIN --- */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-72 ml-0`}>
        
        {/* Header */}
        <header className="h-20 bg-brand-dark shadow-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 no-print">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"><Menu size={24} /></button>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-brand-vivid flex items-center justify-center text-brand-black shadow-lg"><Activity size={20} /></div>
                <span className="text-lg md:text-xl font-bold text-white tracking-tight hidden sm:block">ESTOMA<span className="text-brand-vivid">PRO</span></span>
             </div>
           </div>
           <div className="flex items-center gap-2">
               <div className="p-2 bg-white/10 rounded-lg text-white hidden sm:block"><Clock size={18} /></div>
               <div className="flex flex-col justify-center h-full text-right sm:text-left">
                  <div className="flex items-center gap-2 text-white font-bold text-xl md:text-2xl font-mono leading-none">{formattedTime}</div>
                  <p className="text-xs md:text-sm text-white/70 font-medium capitalize mt-0.5">{formattedDate}</p>
               </div>
           </div>
        </header>

        {/* Content Body */}
        <div className="p-4 md:p-8 overflow-x-hidden pb-20 print:p-0 print:pb-0">
           
           {/* --- DASHBOARD TAB --- */}
           {activeTab === 'dashboard' && (
             <div className="animate-fade-up space-y-8">
                
                {/* 1. Quick Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                   <Button variant="primary" onClick={() => { setActiveTab('patients'); handleNewPatient(); }} className="flex items-center gap-2 py-4 px-8 text-base shadow-xl hover:-translate-y-1 bg-brand-dark text-white hover:bg-brand-black border-none">
                      <UserPlus size={24} /> Cadastro
                   </Button>
                   <Button variant="primary" onClick={openNewAppointment} className="flex items-center gap-2 py-4 px-8 text-base shadow-xl hover:-translate-y-1 bg-brand-mid text-white border-none">
                      <CalendarPlus size={24} /> Agendamento
                   </Button>
                   <Button variant="primary" onClick={initiateNewEvolution} className="flex items-center gap-2 py-4 px-8 text-base shadow-xl hover:-translate-y-1 bg-white !text-brand-dark hover:bg-gray-50 border-none">
                      <Activity size={24} /> Evolução
                   </Button>
                </div>

                {/* 2. Metrics (Moved above Agenda) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex items-center justify-between">
                      <div><p className="text-sm text-gray-500 font-bold mb-1">Pacientes Cadastrados</p><h3 className="text-4xl font-bold text-brand-black">{stats.totalPatients}</h3></div>
                      <div className="p-4 bg-brand-surface rounded-xl text-brand-vivid"><Users size={32} /></div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex items-center justify-between">
                      <div><p className="text-sm text-gray-500 font-bold mb-1">Evoluções Hoje</p><h3 className="text-4xl font-bold text-brand-black">{stats.evolutionsToday}</h3></div>
                      <div className="p-4 bg-blue-50 rounded-xl text-blue-500"><Activity size={32} /></div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex items-center justify-between">
                      <div><p className="text-sm text-gray-500 font-bold mb-1">Agendamentos Hoje</p><h3 className="text-4xl font-bold text-brand-black">{stats.appointmentsToday}</h3></div>
                      <div className="p-4 bg-purple-50 rounded-xl text-purple-500"><Calendar size={32} /></div>
                   </div>
                </div>

                {/* 3. Agenda Card (Today) MOVED IMMEDIATELY ABOVE WEEKLY VISITS */}
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                   <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-brand-mid" /> Agenda do Dia</h3>
                   <div className="space-y-4">
                      {appointments.filter(a => a.date === todayStr && a.status === 'Agendado').length === 0 ? (
                         <div className="text-center py-8 text-gray-400">Nenhum agendamento pendente para hoje.</div>
                      ) : (
                         appointments.filter(a => a.date === todayStr && a.status === 'Agendado').map(app => {
                            const late = isLate(app.date, app.time) && app.status === 'Agendado';
                            return (
                               <div key={app.id} className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow relative ${openAppointmentMenuId === app.id ? 'z-50' : 'z-0'}`}>
                                  <div className="flex items-center gap-4">
                                     <div className={`text-xl font-bold font-mono ${late ? 'text-red-500' : 'text-gray-700'}`}>{app.time}</div>
                                     <div>
                                        <h4 className={`font-bold ${late ? 'text-red-600' : 'text-gray-800'}`}>{app.patientName} {late && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">ATRASADO</span>}</h4>
                                        <p className="text-xs text-gray-500">{app.reason}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <button onClick={() => handleStartEvolution(app)} title="Iniciar Evolução" className="p-2 bg-brand-vivid text-brand-black rounded-lg hover:bg-brand-mid hover:text-white transition-colors"><PlayCircle size={20} /></button>
                                     <button onClick={() => handleOpenWhatsAppModal(app.patientId)} title="WhatsApp" className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><MessageCircle size={20} /></button>
                                     <div className="relative appointment-menu-trigger">
                                         <button 
                                          onMouseDown={(e) => {
                                             e.stopPropagation();
                                             // If menu is closed, open it. If open, close it.
                                             // Using onMouseDown to trigger before blur/click elsewhere
                                             toggleAppointmentMenu(app.id!);
                                          }}
                                          className="p-2 text-gray-400 hover:bg-gray-200 rounded-lg"
                                         >
                                          <MoreVertical size={20} />
                                         </button>
                                         
                                         {/* Dropdown Menu */}
                                         {openAppointmentMenuId === app.id && (
                                            <div className="absolute right-0 top-10 bg-white shadow-xl border border-gray-100 rounded-lg p-2 w-32 z-50 animate-fade-in-down">
                                                <button onClick={() => handleReschedule(app)} className="w-full text-left text-xs font-bold text-gray-600 hover:bg-gray-50 p-2 rounded flex items-center gap-2">
                                                   <Edit size={14} /> Reagendar
                                                </button>
                                                {/* Botão de Excluir que apenas abre o modal */}
                                                <button 
                                                   type="button"
                                                   onClick={(e) => initiateDeleteAppointment(app.id!, e)} 
                                                   className="w-full text-left text-xs font-bold text-red-500 hover:bg-red-50 p-2 rounded flex items-center gap-2 btn-delete-action"
                                                >
                                                   <Trash2 size={14} /> Excluir
                                                </button>
                                            </div>
                                         )}
                                     </div>
                                  </div>
                               </div>
                            );
                         })
                      )}
                   </div>
                </div>

                {/* 4. Weekly Visits Chart (Animated Bars) */}
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                   <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><BarChart2 size={20} className="text-brand-mid" /> Atendimentos da Semana</h3>
                   <div className="flex items-end justify-between h-48 gap-2">
                      {getWeeklyVisits().map((d, i) => (
                         <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer">
                            <div className="text-xs font-bold text-brand-dark mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</div>
                            <div 
                              className="w-full bg-brand-surface rounded-t-lg relative overflow-hidden group-hover:bg-brand-mid/20 transition-colors" 
                              style={{ height: '100%' }}
                            >
                                <div 
                                  className="absolute bottom-0 left-0 right-0 bg-brand-mid rounded-t-lg transition-all duration-1000 ease-out"
                                  style={{ height: `${d.count > 0 ? (d.count / 10) * 100 : 2}%`, maxHeight: '100%' }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-400 font-bold mt-2 uppercase">{d.day}</div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* 5. Performed Visits Card (History) */}
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileClock size={20} className="text-brand-mid" /> Histórico de Atendimentos</h3>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                         {['Hoje', 'Ontem', 'Semana'].map(f => (
                            <button 
                              key={f} 
                              onClick={() => setVisitsHistoryFilter(f as any)} 
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${visitsHistoryFilter === f ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                               {f}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-3 max-h-60 overflow-y-auto">
                      {getFilteredPerformedVisits().length === 0 ? <p className="text-center text-gray-400 text-sm py-4">Nenhum registro.</p> : getFilteredPerformedVisits().map(evo => (
                         <div key={evo.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                               <p className="font-bold text-gray-800 text-sm">{evo.patientName}</p>
                               <p className="text-xs text-gray-500">{new Date(evo.date).toLocaleDateString('pt-BR')} às {evo.time}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${evo.status === 'Melhora' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{evo.status}</span>
                         </div>
                      ))}
                   </div>
                </div>

                {/* 6. Lesion Types Chart */}
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><PieChart size={20} className="text-brand-mid" /> Tipos de Lesões</h3>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                         {['Hoje', 'Semana', 'Mes'].map(f => (
                            <button 
                              key={f} 
                              onClick={() => setLesionChartFilter(f as any)} 
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${lesionChartFilter === f ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                               {f}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-3">
                      {getLesionTypes().map((type, idx) => (
                         <div key={idx} className="group">
                             <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                <span>{type.name}</span>
                                <span>{type.count}</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-brand-vivid h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(type.count / 10) * 100}%` }}></div>
                             </div>
                         </div>
                      ))}
                      {getLesionTypes().length === 0 && <p className="text-center text-gray-400 text-sm py-4">Sem dados.</p>}
                   </div>
                </div>

                {/* 7. System Status */}
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 mt-8 pb-4">
                   <Wifi size={14} className={dbStatus === 'online' ? 'text-green-500' : 'text-red-500'} />
                   Status do Sistema: <span className={dbStatus === 'online' ? 'text-green-600' : 'text-red-600'}>{dbStatus === 'online' ? 'Conectado' : 'Offline'}</span>
                </div>
             </div>
           )}

           {/* --- APPOINTMENTS TAB (New) --- */}
           {activeTab === 'appointments' && (
              <div className="animate-fade-up">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Agendamentos</h2>
                    <Button variant="primary" onClick={openNewAppointment} className="flex items-center gap-2 py-2 px-4 shadow-sm text-xs md:text-sm">
                       <Plus size={16} /> Novo Agendamento
                    </Button>
                 </div>

                 <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden p-6">
                    {/* Filtro: Agendado E Futuro (até 6 meses) */}
                    {appointments.filter(a => {
                       if (a.status !== 'Agendado') return false;
                       const appDate = new Date(`${a.date}T${a.time}`);
                       const now = new Date();
                       const sixMonthsFromNow = new Date();
                       sixMonthsFromNow.setMonth(now.getMonth() + 6);
                       
                       // Permite apenas agendamentos futuros ou do momento atual em diante
                       return appDate >= now && appDate <= sixMonthsFromNow;
                    }).length === 0 ? <p className="text-center text-gray-400">Nenhum agendamento futuro para os próximos 6 meses.</p> : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {appointments.filter(a => {
                              if (a.status !== 'Agendado') return false;
                              const appDate = new Date(`${a.date}T${a.time}`);
                              const now = new Date();
                              const sixMonthsFromNow = new Date();
                              sixMonthsFromNow.setMonth(now.getMonth() + 6);
                              return appDate >= now && appDate <= sixMonthsFromNow;
                          }).map(app => (
                             <div key={app.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all relative group">
                                {/* Delete/Edit Buttons: Always visible on touch devices, opacity hover on desktop */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                   <button onClick={() => handleReschedule(app)} className="p-1.5 bg-white text-gray-600 rounded shadow-sm hover:text-brand-dark transition-colors"><Edit size={14} /></button>
                                   <button 
                                      type="button"
                                      onClick={(e) => initiateDeleteAppointment(app.id!, e)} 
                                      className="p-1.5 bg-white text-red-500 rounded shadow-sm hover:bg-red-50 transition-colors"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                   <div className="w-10 h-10 bg-brand-surface rounded-lg flex items-center justify-center text-brand-dark font-bold">
                                      {app.date.split('-')[2]}
                                   </div>
                                   <div>
                                      <p className="text-xs text-gray-400 font-bold uppercase">{new Date(app.date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                                      <p className="text-lg font-bold text-gray-800 leading-none">{app.time}</p>
                                   </div>
                                </div>
                                <h4 className="font-bold text-gray-900 truncate pr-16">{app.patientName}</h4>
                                <p className="text-sm text-gray-500 truncate">{app.reason}</p>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* --- OTHER TABS (Maintained) --- */}
           
           {/* PATIENTS TAB */}
           {activeTab === 'patients' && (
             <div className="animate-fade-up">
               {patientViewMode === 'list' ? (
                 <>
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-gray-800">Meus Pacientes</h2>
                     <Button variant="primary" onClick={handleNewPatient} className="flex items-center gap-2 py-2 px-4 shadow-lg hover:shadow-xl hover:-translate-y-1">
                        <Plus size={18} /> Novo Paciente
                     </Button>
                   </div>
                   <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
                      <div className="relative flex-grow w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Buscar paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all" />
                      </div>
                      <div className="relative w-full md:w-56 flex-shrink-0">
                         <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none appearance-none cursor-pointer transition-all font-medium text-gray-600">
                            <option value="Todos">Todos os Status</option>
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                            <option value="Finalizado">Finalizado</option>
                         </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                      </div>
                   </div>
                   <div className="hidden md:flex items-center justify-between px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-2xl text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <div>Paciente / Diagnóstico</div>
                      <div>Ações</div>
                   </div>
                   <div className="bg-white rounded-b-2xl md:rounded-t-none rounded-t-2xl shadow-soft border border-gray-100 overflow-hidden">
                     {loading ? <div className="p-12 text-center text-gray-400">Carregando...</div> : filteredPatients.length === 0 ? <div className="p-16 text-center text-gray-500">Nenhum paciente encontrado.</div> : (
                       <div className="divide-y divide-gray-100">
                         {filteredPatients.map((patient) => (
                           <div key={patient.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-all duration-200 group">
                             <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                                <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                  {patient.photoUrl ? <img src={patient.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brand-surface text-brand-dark font-bold">{patient.name.charAt(0)}</div>}
                                </div>
                             </div>
                             <div className="flex-grow min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2 flex-wrap">
                                   <h3 
                                     onClick={() => handleViewPatientDetails(patient)}
                                     className="font-bold text-gray-900 text-sm md:text-base truncate cursor-pointer hover:text-brand-dark hover:underline transition-colors"
                                     title="Ver prontuário"
                                   >
                                      {patient.name}
                                   </h3>
                                   <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusDotColor(patient.status)}`} title={`Status: ${patient.status}`}></div>
                                   <div className="flex flex-wrap gap-1 items-center">
                                      {patient.clinical.comorbidities && patient.clinical.comorbidities.split(',').slice(0, 3).map((tag, i) => (
                                         <span key={i} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{tag.trim()}</span>
                                      ))}
                                   </div>
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">{patient.clinical.diagnosis || 'Diagnóstico não informado'}</p>
                             </div>
                             <div className="flex items-center gap-2 flex-shrink-0">
                               <button onClick={() => handleEditPatient(patient)} className="p-2 text-gray-400 hover:text-brand-mid hover:bg-brand-surface rounded-full transition-colors"><Edit size={18} /></button>
                               <button onClick={() => handleDeletePatient(patient.id!)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </>
               ) : patientViewMode === 'details' ? (
                  // PATIENT DETAILS / PRONTUÁRIO VIEW
                  <div className="max-w-4xl mx-auto pb-10 animate-fade-up">
                      <div className="flex items-center gap-4 mb-6">
                         <button onClick={() => setPatientViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-600" /></button>
                         <h2 className="text-2xl font-bold text-gray-800">Prontuário Digital</h2>
                      </div>
                      <div className="space-y-6">
                          {/* Profile Card */}
                          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 relative overflow-hidden">
                             <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                                <div className="w-32 h-32 rounded-full border-4 border-gray-100 shadow-md overflow-hidden flex-shrink-0">
                                   {currentPatient?.photoUrl ? <img src={currentPatient.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><User size={48} /></div>}
                                </div>
                                <div className="flex-grow text-center md:text-left space-y-2">
                                   <div><h3 className="text-2xl font-bold text-gray-900">{currentPatient?.name}</h3><p className="text-gray-500">{currentPatient?.email}</p></div>
                                   <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusDotColor(currentPatient?.status!)} bg-opacity-80`}>{currentPatient?.status}</span>
                                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{currentPatient?.sex}</span>
                                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 flex items-center gap-1"><Phone size={12} /> {currentPatient?.phone}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                          {/* Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Endereço</h4>
                                  <p className="text-sm font-bold text-gray-800">{currentPatient?.address.street}, {currentPatient?.address.number}</p>
                                  <p className="text-sm text-gray-600">{currentPatient?.address.neighborhood}</p>
                                  <p className="text-sm text-gray-600">{currentPatient?.address.city} - {currentPatient?.address.state}</p>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Responsável Legal</h4>
                                  {currentPatient?.guardian.name ? (
                                    <><p className="text-sm font-bold text-gray-800">{currentPatient.guardian.name}</p><p className="text-sm text-gray-600 flex items-center gap-1"><Phone size={12} /> {currentPatient.guardian.phone}</p></>
                                  ) : <p className="text-sm text-gray-400 italic">Não informado</p>}
                              </div>
                          </div>
                          {/* Clinical Data */}
                          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dados Clínicos</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div><p className="text-xs text-gray-500 mb-1">Diagnóstico Principal</p><p className="font-bold text-brand-dark bg-brand-surface p-2 rounded-lg border border-brand-mid/20">{currentPatient?.clinical.diagnosis}</p></div>
                                 <div><p className="text-xs text-gray-500 mb-1">Comorbidades</p><div className="flex flex-wrap gap-2">{currentPatient?.clinical.comorbidities ? currentPatient.clinical.comorbidities.split(',').map((tag, i) => (<span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium">{tag.trim()}</span>)) : <span className="text-gray-400 italic text-sm">Nenhuma</span>}</div></div>
                                 <div className="md:col-span-2"><p className="text-xs text-gray-500 mb-1">Observações Gerais</p><p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">{currentPatient?.clinical.observations || 'Sem observações.'}</p></div>
                              </div>
                          </div>
                          {/* Evolution History Timeline */}
                          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2 flex items-center gap-2"><FileClock size={16} /> Histórico de Evoluções</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {evolutions.filter(e => e.patientId === currentPatient?.id).map((evo) => (
                                   <button key={evo.id} onClick={() => handleOpenEvolutionFromHistory(evo)} className="group flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-brand-mid rounded-xl transition-all duration-300 hover:shadow-md">
                                      <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center text-brand-dark group-hover:bg-brand-dark group-hover:text-white transition-colors mb-2"><FileText size={18} /></div>
                                      <span className="font-bold text-gray-800 text-sm">{new Date(evo.date).toLocaleDateString('pt-BR')}</span>
                                      <span className="text-xs text-gray-500">{evo.time}</span>
                                      <div className={`mt-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${evo.status === 'Melhora' ? 'bg-green-100 text-green-700' : evo.status === 'Piora' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{evo.status}</div>
                                   </button>
                                ))}
                                {evolutions.filter(e => e.patientId === currentPatient?.id).length === 0 && <div className="col-span-full py-8 text-center text-gray-400 text-sm italic">Nenhuma evolução registrada para este paciente.</div>}
                             </div>
                          </div>
                          {/* Creation Log */}
                          {currentPatient?.logs && currentPatient.logs.length > 0 && (
                             <div className="text-center text-xs text-gray-400 pt-4"><p>Cadastro realizado por <strong>{currentPatient.logs[0].professionalName}</strong> em {new Date(currentPatient.logs[0].date).toLocaleString('pt-BR')}</p></div>
                          )}
                      </div>
                  </div>
               ) : (
                 // FULL PATIENT FORM
                 <div className="max-w-4xl mx-auto pb-10">
                    <div className="flex items-center gap-4 mb-6">
                       <button onClick={() => setPatientViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-600" /></button>
                       <h2 className="text-2xl font-bold text-gray-800">{currentPatient?.id ? 'Editar Paciente' : 'Novo Paciente'}</h2>
                    </div>
                    <form onSubmit={(e) => initiateSave(e, 'patient')} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden p-6 md:p-8 space-y-8">
                       {/* 1. DADOS PESSOAIS */}
                       <div className="flex flex-col md:flex-row gap-8 items-start">
                          <div className="relative group cursor-pointer w-32 h-32 mx-auto md:mx-0 flex-shrink-0">
                             <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg flex items-center justify-center">
                                {currentPatient?.photoUrl ? <img src={currentPatient.photoUrl} className="w-full h-full object-cover" /> : <User size={48} className="text-gray-400" />}
                             </div>
                             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
                             <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'patient')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                             <p className="text-xs text-gray-500 text-center mt-2">Alterar Foto</p>
                          </div>
                          <div className="flex-grow w-full">
                             <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dados Pessoais</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label><input type="text" required value={currentPatient?.name} onChange={e => setCurrentPatient({...currentPatient!, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Data de Nascimento</label><input type="date" required value={currentPatient?.birthDate} onChange={e => setCurrentPatient({...currentPatient!, birthDate: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Sexo</label><select value={currentPatient?.sex} onChange={e => setCurrentPatient({...currentPatient!, sex: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"><option>Masculino</option><option>Feminino</option><option>Outro</option></select></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Telefone / WhatsApp</label><input type="tel" value={currentPatient?.phone} onChange={e => setCurrentPatient({...currentPatient!, phone: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={currentPatient?.email} onChange={e => setCurrentPatient({...currentPatient!, email: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                                <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Situação</label><select value={currentPatient?.status} onChange={e => setCurrentPatient({...currentPatient!, status: e.target.value as any})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"><option>Ativo</option><option>Inativo</option><option>Finalizado</option></select></div>
                             </div>
                          </div>
                       </div>
                       {/* 2. ENDEREÇO */}
                       <div>
                          <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><MapPin size={16} /> Endereço</h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                             <div className="md:col-span-3 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Rua / Logradouro</label><input type="text" value={currentPatient?.address.street} onChange={e => setCurrentPatient({...currentPatient!, address: {...currentPatient!.address, street: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Número</label><input type="text" value={currentPatient?.address.number} onChange={e => setCurrentPatient({...currentPatient!, address: {...currentPatient!.address, number: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                             <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Bairro</label><input type="text" value={currentPatient?.address.neighborhood} onChange={e => setCurrentPatient({...currentPatient!, address: {...currentPatient!.address, neighborhood: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Cidade</label><input type="text" value={currentPatient?.address.city} onChange={e => setCurrentPatient({...currentPatient!, address: {...currentPatient!.address, city: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">UF</label><input type="text" value={currentPatient?.address.state} onChange={e => setCurrentPatient({...currentPatient!, address: {...currentPatient!.address, state: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                          </div>
                       </div>
                       {/* 3. RESPONSÁVEL LEGAL */}
                       <div>
                          <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Responsável Legal (Opcional)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nome do Responsável</label><input type="text" value={currentPatient?.guardian.name} onChange={e => setCurrentPatient({...currentPatient!, guardian: {...currentPatient!.guardian, name: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Telefone do Responsável</label><input type="tel" value={currentPatient?.guardian.phone} onChange={e => setCurrentPatient({...currentPatient!, guardian: {...currentPatient!.guardian, phone: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                          </div>
                       </div>
                       {/* 4. DADOS CLÍNICOS */}
                       <div>
                          <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><Activity size={16} /> Dados Clínicos</h3>
                          <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Diagnóstico Clínico Principal</label><input type="text" required value={currentPatient?.clinical.diagnosis} onChange={e => setCurrentPatient({...currentPatient!, clinical: {...currentPatient!.clinical, diagnosis: e.target.value}})} placeholder="Ex: Lesão por Pressão em região sacral" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Comorbidades (Tags)</label><input type="text" value={currentPatient?.clinical.comorbidities} onChange={e => setCurrentPatient({...currentPatient!, clinical: {...currentPatient!.clinical, comorbidities: e.target.value}})} placeholder="Ex: Diabetes, Hipertensão, Obesidade (separe por vírgula)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /><p className="text-[10px] text-gray-400">Digite separado por vírgulas para criar as etiquetas.</p></div>
                             <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Observações Gerais</label><textarea rows={3} value={currentPatient?.clinical.observations} onChange={e => setCurrentPatient({...currentPatient!, clinical: {...currentPatient!.clinical, observations: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg resize-none"></textarea></div>
                          </div>
                       </div>
                       <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                          <Button type="button" variant="ghost" onClick={() => setPatientViewMode('list')}>Cancelar</Button>
                          <Button type="submit" variant="primary">Autenticar e Salvar</Button>
                       </div>
                    </form>
                 </div>
               )}
             </div>
           )}

           {/* EVOLUTIONS TAB */}
           {activeTab === 'evolutions' && (
             <div className="animate-fade-up">
                {evolutionViewMode === 'details' ? (
                   // Read Only Details View
                   <div className="max-w-3xl mx-auto pb-10">
                       <div className="flex items-center gap-4 mb-6">
                         <button onClick={() => setActiveTab('patients')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-600" /></button>
                         <h2 className="text-2xl font-bold text-gray-800">Relatório de Evolução</h2>
                       </div>
                       <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-200 print:shadow-none print:border-none">
                          <div className="bg-brand-dark p-6 text-white flex justify-between items-center">
                             <div><h3 className="text-xl font-bold">{currentEvolution?.patientName}</h3><p className="text-white/80 text-sm">Realizado em {new Date(currentEvolution?.date!).toLocaleDateString('pt-BR')} às {currentEvolution?.time}</p></div>
                             <div className="flex flex-col items-center"><p className="text-xs font-bold uppercase opacity-70 mb-1 text-center">Status</p><span className="bg-white/20 px-3 py-1 rounded-full font-bold text-sm">{currentEvolution?.status}</span></div>
                          </div>
                          <div className="p-8 space-y-8">
                              {currentEvolution?.photoUrl && (<div className="flex justify-center mb-8"><img src={currentEvolution.photoUrl} className="rounded-lg shadow-lg max-h-96" /></div>)}
                              <div className="grid grid-cols-2 gap-6">
                                 <div><p className="text-xs text-gray-500 font-bold uppercase">Estágio</p><p className="text-gray-800 font-medium">{currentEvolution?.stage}</p></div>
                                 <div><p className="text-xs text-gray-500 font-bold uppercase">Diagnóstico</p><p className="text-gray-800 font-medium">{currentEvolution?.patientDiagnosis}</p></div>
                              </div>
                              <div><p className="text-xs text-gray-500 font-bold uppercase mb-2">Descrição</p><p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">{currentEvolution?.description}</p></div>
                              {currentEvolution?.materials && currentEvolution.materials.length > 0 && (<div><p className="text-xs text-gray-500 font-bold uppercase mb-2">Materiais Utilizados</p><ul className="list-disc pl-5 space-y-1 text-gray-700">{currentEvolution.materials.map((m, i) => (<li key={i}>{m.name} - <strong>{m.quantity}</strong></li>))}</ul></div>)}
                          </div>
                          <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center gap-3 text-sm text-gray-500 italic"><CheckCircle size={16} className="text-brand-mid" /> Assinado digitalmente por {currentEvolution?.professionalName}</div>
                       </div>
                   </div>
                ) : (
                   // FORM VIEW - DEFAULT
                   <div className="max-w-4xl mx-auto pb-10">
                      <div className="flex items-center gap-4 mb-6"><h2 className="text-2xl font-bold text-gray-800">Nova Evolução</h2></div>
                      <form onSubmit={(e) => initiateSave(e, 'evolution')} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden p-6 md:p-8 space-y-8">
                         {/* Details Section */}
                         <div>
                            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Detalhes do Atendimento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Paciente</label><select required value={currentEvolution?.patientId} onChange={(e) => setCurrentEvolution({...currentEvolution!, patientId: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none"><option value="">Selecione um paciente...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                               <div><label className="text-xs font-bold text-gray-500 uppercase">Data</label><input type="date" required value={currentEvolution?.date} onChange={e => setCurrentEvolution({...currentEvolution!, date: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                               <div><label className="text-xs font-bold text-gray-500 uppercase">Estágio da Lesão</label><input type="text" placeholder="Ex: Estágio 2, Granulação..." value={currentEvolution?.stage} onChange={e => setCurrentEvolution({...currentEvolution!, stage: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                               <div><label className="text-xs font-bold text-gray-500 uppercase">Evolução</label><select value={currentEvolution?.status} onChange={e => setCurrentEvolution({...currentEvolution!, status: e.target.value as any})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"><option>Melhora</option><option>Estagnação</option><option>Piora</option></select></div>
                               <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Descrição da Evolução</label><textarea rows={4} value={currentEvolution?.description} onChange={e => setCurrentEvolution({...currentEvolution!, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg resize-none"></textarea></div>
                            </div>
                         </div>
                         {/* Materials Section */}
                         <div>
                            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Materiais Utilizados</h3>
                            <div className="space-y-3">
                               {tempMaterials.map((mat, idx) => (<div key={idx} className="flex gap-3"><input type="text" placeholder="Material" value={mat.name} onChange={e => handleMaterialChange(idx, 'name', e.target.value)} className="flex-grow p-3 bg-gray-50 border border-gray-200 rounded-lg" /><input type="text" placeholder="Qtd" value={mat.quantity} onChange={e => handleMaterialChange(idx, 'quantity', e.target.value)} className="w-24 p-3 bg-gray-50 border border-gray-200 rounded-lg" /><button type="button" onClick={() => handleRemoveMaterial(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></div>))}
                               <Button type="button" variant="secondary" onClick={handleAddMaterial} className="w-full border-dashed border-2 text-gray-500">+ Adicionar Material</Button>
                            </div>
                         </div>
                         {/* Photo Section */}
                         <div>
                            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Registro Fotográfico</h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer">
                               {currentEvolution?.photoUrl ? (<img src={currentEvolution.photoUrl} alt="Evolução" className="max-h-64 mx-auto rounded-lg shadow-md" />) : (<div className="flex flex-col items-center text-gray-400"><Camera size={48} className="mb-2" /><p>Clique para adicionar foto (PC ou Celular)</p></div>)}
                               <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'evolution')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                         </div>
                         <div className="bg-gray-50 -mx-8 -mb-8 p-6 flex justify-end gap-3 border-t border-gray-100 mt-4">
                            <Button type="button" variant="ghost" onClick={() => setActiveTab('dashboard')}>Cancelar</Button>
                            <Button type="submit" variant="primary">Autenticar e Salvar</Button>
                         </div>
                      </form>
                   </div>
                )}
             </div>
           )}

           {/* GALLERY TAB */}
           {activeTab === 'gallery' && (
             <div className="animate-fade-up">
                {galleryViewMode === 'folders' ? (
                   <>
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Galeria de Lesões</h2>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6"><div className="relative w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Buscar galeria pelo nome do paciente..." value={gallerySearchTerm} onChange={(e) => setGallerySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all" /></div></div>
                      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                         {patientsWithPhotos.length === 0 ? <div className="p-12 text-center text-gray-400">Nenhuma galeria encontrada.</div> : (
                            <div className="divide-y divide-gray-100">
                               {patientsWithPhotos.map(patient => (
                                  <div key={patient.id} onClick={() => handleOpenPatientGallery(patient.id!)} className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer group transition-colors">
                                     <div className="w-12 h-12 flex-shrink-0"><div className="w-full h-full rounded-full bg-gray-200 overflow-hidden border border-gray-100 shadow-sm">{patient.photoUrl ? <img src={patient.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brand-surface text-brand-dark font-bold">{patient.name.charAt(0)}</div>}</div></div>
                                     <div className="flex-grow"><h3 className="font-bold text-gray-800 text-sm group-hover:text-brand-dark transition-colors">{patient.name}</h3><div className="flex items-center gap-1 text-xs text-gray-500 mt-1"><ImageIcon size={12} /><span>{evolutions.filter(e => e.patientId === patient.id && e.photoUrl).length} fotos registradas</span></div></div>
                                     <div className="text-gray-300 group-hover:text-brand-mid transition-colors"><ChevronRight size={20} /></div>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                   </>
                ) : (
                   <div>
                      <div className="flex items-start gap-4 mb-6">
                         <button onClick={() => setGalleryViewMode('folders')} className="mt-1 p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-600" /></button>
                         <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedPatientForGallery?.name}</h2>
                            <p className="text-sm text-gray-500 mb-3">{selectedPatientForGallery?.clinical.diagnosis}</p>
                            <Button variant="secondary" onClick={() => { setCurrentSlideIndex(0); setShowSlideShow(true); }} disabled={galleryPhotos.length === 0} className="flex items-center gap-2 py-2 px-4 text-xs font-bold"><Maximize2 size={16} /> SlideShow</Button>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                         {galleryPhotos.map((evo) => (
                            <div key={evo.id} className={`group relative bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${compareList.includes(evo.id!) ? 'ring-4 ring-brand-vivid border-transparent' : 'border-gray-100 hover:shadow-md'}`}>
                               <div className="aspect-square bg-gray-100 relative overflow-hidden cursor-pointer" onClick={() => { setCurrentEvolution(evo); setEvolutionViewMode('details'); setActiveTab('evolutions'); }}>
                                  <img src={evo.photoUrl} alt="Lesion" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><span className="bg-white/90 text-brand-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Eye size={12} /> Ver Relatório</span></div>
                               </div>
                               <div className="p-3"><p className="font-bold text-gray-800 text-sm">{new Date(evo.date).toLocaleDateString('pt-BR')}</p><p className="text-xs text-gray-500 truncate">{evo.stage}</p></div>
                               <div className="absolute top-2 right-2 z-10"><input type="checkbox" checked={compareList.includes(evo.id!)} onChange={() => toggleCompare(evo.id!)} className="w-5 h-5 accent-brand-vivid cursor-pointer shadow-sm" /></div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
           )}
           
           {/* REPORTS TAB */}
           {activeTab === 'reports' && (
             <div className="animate-fade-up max-w-5xl mx-auto">
               <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                 <FileText size={28} className="text-brand-dark" /> Central de Relatórios
               </h2>

               {/* Configuration Card */}
               <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 mb-8 no-print">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-3">
                       <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo de Relatório</label>
                       <select 
                          value={reportType || ''} 
                          onChange={(e) => { setReportType(e.target.value as ReportType); setGeneratedReport(null); }}
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none font-bold text-gray-700"
                       >
                          <option value="">Selecione o tipo...</option>
                          <option value="evolution">Evolução do Paciente</option>
                          <option value="general">Atendimentos Gerais</option>
                          <option value="materials">Consumo de Materiais</option>
                       </select>
                    </div>

                    {reportType === 'evolution' && (
                       <div className="md:col-span-3 animate-fade-up">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Selecione o Paciente</label>
                          <select 
                             value={reportConfig.patientId} 
                             onChange={(e) => setReportConfig({...reportConfig, patientId: e.target.value})}
                             className="w-full p-3 bg-white border border-gray-200 rounded-lg"
                          >
                             <option value="">Selecione...</option>
                             {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                       </div>
                    )}

                    {(reportType === 'general' || reportType === 'materials') && (
                       <>
                          <div className="animate-fade-up">
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data Inicial</label>
                             <input 
                                type="date" 
                                value={reportConfig.startDate} 
                                onChange={(e) => setReportConfig({...reportConfig, startDate: e.target.value})}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg"
                             />
                          </div>
                          <div className="animate-fade-up">
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data Final</label>
                             <input 
                                type="date" 
                                value={reportConfig.endDate} 
                                onChange={(e) => setReportConfig({...reportConfig, endDate: e.target.value})}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg"
                             />
                          </div>
                       </>
                    )}
                    
                    {reportType === 'general' && (
                       <>
                          <div className="animate-fade-up">
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo de Registro</label>
                             <select 
                                value={reportConfig.recordType} 
                                onChange={(e) => setReportConfig({...reportConfig, recordType: e.target.value})}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg"
                             >
                                <option value="Todos">Todos</option>
                                <option value="Cadastrados">Cadastrados</option>
                                <option value="Atendidos">Atendidos (Evoluções)</option>
                                <option value="Agendados">Agendados</option>
                             </select>
                          </div>
                          <div className="md:col-span-3 animate-fade-up">
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status do Paciente</label>
                             <select 
                                value={reportConfig.patientStatus} 
                                onChange={(e) => setReportConfig({...reportConfig, patientStatus: e.target.value})}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg"
                             >
                                <option value="Todos">Todos</option>
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                                <option value="Finalizado">Finalizado</option>
                             </select>
                          </div>
                       </>
                    )}
                 </div>

                 {reportType && (
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                       <Button variant="primary" onClick={handleGenerateReport} className="flex items-center gap-2 px-8">
                          <FileText size={18} /> Gerar Relatório
                       </Button>
                    </div>
                 )}
               </div>

               {/* Generated Report Preview Area */}
               {generatedReport && (
                 <div className="animate-fade-up">
                    <div className="flex justify-between items-center mb-4 no-print">
                       <h3 className="text-lg font-bold text-gray-700">Pré-visualização</h3>
                       <div className="flex gap-2">
                          <Button variant="outline" onClick={handleShareReport} className="flex items-center gap-2 text-white bg-brand-mid border-transparent hover:bg-brand-mid/90">
                             <Share2 size={16} /> Compartilhar
                          </Button>
                          <Button variant="accent" onClick={handlePrintReport} className="flex items-center gap-2">
                             <Printer size={16} /> Imprimir / Salvar PDF
                          </Button>
                       </div>
                    </div>

                    {/* PRINT CONTAINER START */}
                    {/* Classes print-only are defined in style tag at top */}
                    <div ref={reportContentRef} className="bg-white shadow-lg p-8 md:p-12 min-h-[29.7cm] w-full max-w-[21cm] mx-auto print-only block">
                       
                       {/* Report Header */}
                       <div className="flex justify-between items-start border-b-2 border-brand-dark pb-6 mb-8">
                          <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-brand-vivid text-brand-black flex items-center justify-center rounded-lg shadow-sm">
                                <Activity size={32} />
                             </div>
                             <div>
                                <h1 className="text-2xl font-bold text-brand-black tracking-tight">ESTOMA<span className="text-brand-mid">PRO</span></h1>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Relatório Técnico</p>
                             </div>
                          </div>
                          <div className="text-right text-sm">
                             <p className="font-bold text-gray-800">{profile.name}</p>
                             <p className="text-gray-600">{profile.email}</p>
                             <p className="text-brand-dark font-bold">COREN: {profile.coren}</p>
                             <p className="text-xs text-gray-400 mt-2">Gerado em: {generatedReport.generatedAt}</p>
                          </div>
                       </div>

                       {/* REPORT TYPE: EVOLUTION */}
                       {generatedReport.type === 'evolution' && generatedReport.patientInfo && (
                          <div>
                             <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100">
                                <h2 className="text-lg font-bold text-brand-dark mb-4 border-b border-gray-200 pb-2">Dados do Paciente</h2>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                   <div><span className="text-gray-500 font-bold">Nome:</span> <span className="text-gray-800">{generatedReport.patientInfo.name}</span></div>
                                   <div><span className="text-gray-500 font-bold">Data Cadastro:</span> <span className="text-gray-800">{new Date(generatedReport.patientInfo.createdAt).toLocaleDateString()}</span></div>
                                   <div><span className="text-gray-500 font-bold">Diagnóstico:</span> <span className="text-gray-800">{generatedReport.patientInfo.clinical.diagnosis}</span></div>
                                   <div><span className="text-gray-500 font-bold">Status:</span> <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-700">{generatedReport.patientInfo.status}</span></div>
                                </div>
                             </div>

                             <div className="space-y-8">
                                {generatedReport.items.map((evo: Evolution, idx: number) => (
                                   <div key={idx} className="flex flex-col md:flex-row gap-6 border-b border-gray-100 pb-8 break-inside-avoid">
                                      <div className="w-full md:w-5/12">
                                         {evo.photoUrl ? (
                                            <div className="border border-gray-200 p-2 rounded-lg bg-white shadow-sm">
                                               <img src={evo.photoUrl} className="w-full h-48 object-cover rounded" />
                                            </div>
                                         ) : (
                                            <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs uppercase font-bold">Sem Foto</div>
                                         )}
                                      </div>
                                      <div className="w-full md:w-7/12 space-y-2">
                                         <div className="flex justify-between items-start">
                                            <div>
                                               <h3 className="font-bold text-gray-800 text-lg">Evolução #{generatedReport.items.length - idx}</h3>
                                               <p className="text-sm text-brand-mid font-bold">{new Date(evo.date).toLocaleDateString()} às {evo.time}</p>
                                            </div>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">{evo.status}</span>
                                         </div>
                                         <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                                            <p className="font-bold text-xs text-gray-400 uppercase mb-1">Descrição</p>
                                            {evo.description}
                                         </div>
                                         <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-gray-50 p-2 rounded"><span className="font-bold text-gray-500">Estágio:</span> {evo.stage}</div>
                                            <div className="bg-gray-50 p-2 rounded"><span className="font-bold text-gray-500">Materiais:</span> {evo.materials?.map(m => m.name).join(', ') || 'Nenhum'}</div>
                                         </div>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}

                       {/* REPORT TYPE: GENERAL */}
                       {generatedReport.type === 'general' && (
                          <div>
                             <h2 className="text-xl font-bold text-gray-800 mb-2">Relatório Geral de Atividades</h2>
                             <p className="text-sm text-gray-500 mb-6">Período: {generatedReport.summary.startDate} a {generatedReport.summary.endDate}</p>
                             
                             <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                   <tr className="bg-gray-100 border-b-2 border-brand-dark">
                                      <th className="p-3 font-bold text-gray-700">Data</th>
                                      <th className="p-3 font-bold text-gray-700">Tipo</th>
                                      <th className="p-3 font-bold text-gray-700">Descrição / Nome</th>
                                      <th className="p-3 font-bold text-gray-700 text-right">Status</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   {generatedReport.items.map((item: any, idx: number) => (
                                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                         <td className="p-3 text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                                         <td className="p-3 font-bold text-gray-800">{item.type}</td>
                                         <td className="p-3 text-gray-600">{item.description}</td>
                                         <td className="p-3 text-right"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">{item.status}</span></td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                             {generatedReport.items.length === 0 && <p className="text-center py-8 text-gray-400 italic">Nenhum registro encontrado para os filtros selecionados.</p>}
                          </div>
                       )}

                       {/* REPORT TYPE: MATERIALS */}
                       {generatedReport.type === 'materials' && (
                          <div>
                             <h2 className="text-xl font-bold text-gray-800 mb-2">Relatório de Consumo de Materiais</h2>
                             <div className="flex gap-4 text-sm text-gray-500 mb-8 bg-gray-50 p-4 rounded-lg">
                                <p><strong>Período:</strong> {generatedReport.summary.startDate} a {generatedReport.summary.endDate}</p>
                                <p><strong>Total de Evoluções:</strong> {generatedReport.summary.totalEvolutions}</p>
                             </div>

                             <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                   <tr className="bg-gray-100 border-b-2 border-brand-dark">
                                      <th className="p-3 font-bold text-gray-700 w-2/3">Material</th>
                                      <th className="p-3 font-bold text-gray-700 w-1/3 text-right">Quantidade Total Estimada</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   {generatedReport.items.map((item: any, idx: number) => (
                                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                         <td className="p-3 font-bold text-gray-800">{item.name}</td>
                                         <td className="p-3 text-right text-brand-dark font-mono font-bold">{item.qty}</td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                             <p className="text-xs text-gray-400 mt-4 italic">* A quantidade total é uma estimativa baseada na soma dos valores numéricos inseridos nos registros de evolução.</p>
                          </div>
                       )}
                       
                       {/* Footer */}
                       <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                          <p>Documento gerado eletronicamente via Sistema ESTOMAPRO</p>
                          <p>www.estomapro.com.br</p>
                       </div>
                    </div>
                    {/* PRINT CONTAINER END */}
                 </div>
               )}
             </div>
           )}

           {/* SETTINGS TAB */}
           {activeTab === 'settings' && (
             <div className="animate-fade-up max-w-4xl mx-auto space-y-8 pb-10">
                <div className="flex items-center gap-4 mb-2">
                   <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
                </div>

                {/* Card Backup */}
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                   <div className="bg-brand-dark p-6 text-white flex items-center gap-3">
                      <Database size={24} className="text-brand-vivid" />
                      <div>
                         <h3 className="text-xl font-bold">Backup e Restauração</h3>
                         <p className="text-white/70 text-sm">Gerencie seus dados com segurança</p>
                      </div>
                   </div>
                   <div className="p-8">
                      <p className="text-gray-600 mb-6 leading-relaxed">
                         Exporte todos os seus dados (pacientes, fotos, evoluções) para manter uma cópia de segurança em seu dispositivo. 
                         Você pode usar este arquivo para restaurar suas informações caso troque de aparelho ou precise reinstalar o sistema.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Export Section */}
                         <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                               <Download size={18} /> Exportar Dados
                            </h4>
                            <div className="mb-6">
                               <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={backupIncludeProfile} 
                                    onChange={(e) => setBackupIncludeProfile(e.target.checked)}
                                    className="w-4 h-4 accent-brand-dark" 
                                  />
                                  <span className="text-sm text-gray-600">Incluir dados do meu perfil profissional</span>
                               </label>
                            </div>
                            <Button 
                               variant="primary" 
                               onClick={handleExportData} 
                               disabled={isProcessingBackup}
                               className="w-full flex items-center justify-center gap-2"
                            >
                               {isProcessingBackup ? 'Processando...' : 'Baixar Backup (JSON)'}
                            </Button>
                         </div>

                         {/* Import Section */}
                         <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                               <Upload size={18} /> Importar Dados
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">
                               Selecione um arquivo de backup (.json) gerado anteriormente para restaurar seus dados.
                            </p>
                            <label className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-mid hover:bg-white cursor-pointer transition-all ${isProcessingBackup ? 'opacity-50 cursor-not-allowed' : ''}`}>
                               <FileJson size={20} className="text-gray-400" />
                               <span className="text-sm font-bold text-gray-500">Selecionar Arquivo</span>
                               <input 
                                 type="file" 
                                 accept=".json" 
                                 onChange={handleImportData}
                                 disabled={isProcessingBackup}
                                 className="hidden" 
                               />
                            </label>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Card Delete Account */}
                <div className="bg-white rounded-2xl shadow-soft border border-red-100 overflow-hidden">
                   <div className="bg-red-50 p-6 flex items-center gap-3 border-b border-red-100">
                      <ShieldAlert size={24} className="text-red-600" />
                      <div>
                         <h3 className="text-xl font-bold text-red-900">Zona de Perigo</h3>
                         <p className="text-red-700/70 text-sm">Ações irreversíveis na conta</p>
                      </div>
                   </div>
                   <div className="p-8">
                      <h4 className="font-bold text-gray-800 mb-2">Excluir Conta Permanentemente</h4>
                      <p className="text-gray-600 mb-6 text-sm">
                         Ao excluir sua conta, todos os seus dados, incluindo pacientes, registros médicos, fotos e configurações serão apagados permanentemente de nossos servidores. 
                         Não será possível recuperar essas informações posteriormente.
                      </p>
                      <Button 
                         variant="ghost" 
                         onClick={() => setShowDeleteAccountModal(true)} 
                         className="w-full md:w-auto border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2"
                      >
                         <Trash2 size={18} /> Excluir Minha Conta
                      </Button>
                   </div>
                </div>
             </div>
           )}

           {/* PROFILE EDIT TAB */}
           {activeTab === 'profile_edit' && (
             <div className="max-w-4xl mx-auto animate-fade-up pb-10">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl md:text-2xl font-bold text-gray-800">Editar Meu Perfil</h2><Button variant="ghost" onClick={() => handleTabChange('dashboard')} className="text-gray-500">Cancelar</Button></div>
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                   <form onSubmit={handleSaveProfile} className="p-6 md:p-8">
                      <div className="mb-8 flex flex-col items-center"><div className="relative group cursor-pointer"><div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">{profile.photoUrl ? <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" /> : <User size={48} className="text-gray-400" />}</div><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div><p className="mt-3 text-sm text-gray-500">Toque para alterar a foto</p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                         <div className="md:col-span-2"><h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dados Pessoais</h3></div>
                         <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label><input type="text" value={profile.name} readOnly className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" /></div>
                         <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={profile.email} readOnly className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" /></div>
                         <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Phone size={12} /> WhatsApp</label><input type="tel" value={profile.whatsapp} readOnly className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" /></div>
                         <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">COREN</label><input type="text" value={profile.coren} onChange={(e) => setProfile({...profile, coren: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                         <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Especialidade</label><input type="text" value={profile.specialty} onChange={(e) => setProfile({...profile, specialty: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                         <div className="md:col-span-2 mt-4"><h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><MapPin size={16} /> Endereço Profissional</h3></div>
                         <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Endereço Completo</label><input type="text" value={profile.address.street} onChange={(e) => setProfile({...profile, address: {...profile.address, street: e.target.value}})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" /></div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-3"><Button variant="ghost" type="button" onClick={() => handleTabChange('dashboard')} disabled={loading} className="w-full md:w-auto">Cancelar</Button><Button type="submit" variant="primary" className="flex items-center justify-center gap-2 px-8 w-full md:w-auto" disabled={loading}><Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}</Button></div>
                   </form>
                </div>
             </div>
           )}

           {/* Placeholders */}
           {!['dashboard', 'patients', 'evolutions', 'gallery', 'profile_edit', 'appointments', 'reports', 'settings'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Settings size={32} /></div>
                 <h3 className="text-lg font-bold text-gray-600">Módulo em Desenvolvimento</h3>
              </div>
           )}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/30' : 'text-gray-500 hover:bg-gray-50 hover:text-brand-dark'}`}><Icon size={20} className={active ? 'text-brand-vivid' : 'text-gray-400'} /><span>{label}</span></button>
);

export default Dashboard;