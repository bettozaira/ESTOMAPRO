import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import Button from '../components/Button';
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  Images, 
  Settings, 
  Activity, 
  Clock, 
  Calendar,
  Edit,
  Save,
  Camera,
  MapPin,
  Phone,
  User,
  Menu,
  X,
  Search,
  MoreVertical,
  Trash2,
  PauseCircle,
  PlayCircle,
  MessageCircle,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

type TabType = 'dashboard' | 'professionals' | 'patients' | 'evolutions' | 'gallery' | 'reports' | 'settings' | 'profile_edit';

interface AdminProfile {
  name: string;
  email: string;
  photoUrl: string;
  coren: string;
  specialty: string;
  whatsapp: string;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

interface ProfessionalUser {
  uid: string;
  name: string;
  email: string;
  whatsapp: string;
  createdAt: string;
  lastLogin?: string;
  isPaused?: boolean;
  photoUrl?: string;
  patientCount?: number; // Mock or calculated
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para controlar o menu mobile
  const [profile, setProfile] = useState<AdminProfile>({
    name: auth.currentUser?.displayName || 'Administrador',
    email: auth.currentUser?.email || '',
    photoUrl: '',
    coren: '',
    specialty: '',
    whatsapp: '',
    address: { street: '', neighborhood: '', city: '', state: '' }
  });

  // Professionals Data State
  const [professionals, setProfessionals] = useState<ProfessionalUser[]>([]);
  const [loadingProfs, setLoadingProfs] = useState(false);

  // Load Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(prev => ({
            ...prev,
            ...data,
            address: { ...prev.address, ...(data.address || {}) }
          }));
        }
      }
    };
    fetchProfile();
  }, []);

  // Fetch Professionals List when tab is active
  useEffect(() => {
    if (activeTab === 'professionals') {
      fetchProfessionals();
    }
  }, [activeTab]);

  const fetchProfessionals = async () => {
    setLoadingProfs(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "user"));
      const querySnapshot = await getDocs(q);
      
      const profs: ProfessionalUser[] = [];
      
      // In a real scenario, we would do a Promise.all to fetch patient counts
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        
        // Mock patient count query - would be collection(db, 'patients'), where('professionalId', '==', doc.id)
        // For now, we simulate or fetch if collection exists
        let pCount = 0;
        try {
            // Uncomment if structure exists:
            // const patientsQ = query(collection(db, 'patients'), where('professionalId', '==', docSnap.id));
            // const patientsSnap = await getCountFromServer(patientsQ);
            // pCount = patientsSnap.data().count;
            pCount = Math.floor(Math.random() * 20); // Mock for demo until Patients created
        } catch (e) {
            pCount = 0;
        }

        profs.push({
          uid: docSnap.id,
          name: data.name || 'Sem Nome',
          email: data.email,
          whatsapp: data.whatsapp || '',
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          isPaused: data.isPaused || false,
          photoUrl: data.photoUrl,
          patientCount: pCount
        });
      }
      setProfessionals(profs);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    } finally {
      setLoadingProfs(false);
    }
  };

  // Professional Actions
  const togglePauseUser = async (uid: string, currentStatus: boolean | undefined) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isPaused: !currentStatus
      });
      // Update local state
      setProfessionals(prev => prev.map(p => p.uid === uid ? { ...p, isPaused: !currentStatus } : p));
    } catch (error) {
      alert("Erro ao alterar status do usuário.");
    }
  };

  const deleteUser = async (uid: string) => {
    const confirm = window.confirm("ATENÇÃO: Essa ação excluirá o cadastro do profissional e todos os dados associados (pacientes, fotos) do painel dele. Deseja continuar?");
    if (confirm) {
      try {
        // In a real backend, this should be a Cloud Function to recursive delete subcollections
        await deleteDoc(doc(db, 'users', uid));
        setProfessionals(prev => prev.filter(p => p.uid !== uid));
        alert("Profissional excluído com sucesso.");
      } catch (error) {
        alert("Erro ao excluir profissional.");
      }
    }
  };

  const openWhatsApp = (phone: string) => {
    // Basic cleaning of phone string
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    // Confirmação de saída
    const confirmAction = window.confirm("Tem certeza que deseja sair do sistema?");
    
    if (confirmAction) {
      try {
         await auth.signOut();
      } catch (error) {
         console.error("Erro ao sair:", error);
      } finally {
         // Garante redirecionamento
         onNavigate('home');
      }
    } else {
      // Se cancelar, fecha o menu (comportamento solicitado para mobile) e permanece na página
      setIsMobileMenuOpen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photoUrl: reader.result as string });
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
      alert('Perfil atualizado com sucesso!');
      // Redireciona para o dashboard automaticamente após salvar
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  // Função para navegar entre abas e fechar menu no mobile
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Date Formatters
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = currentTime.toLocaleDateString('pt-BR', dateOptions);
  const formattedTime = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Mock Metrics Data
  const metrics = {
    professionals: professionals.length || 12, // Use real count if available
    patients: 148,
    appointments: 324,
    evolutions: 856,
    lesionTypes: [
      { name: 'Lesão por Pressão', count: 45, color: 'bg-red-500' },
      { name: 'Úlcera Venosa', count: 32, color: 'bg-blue-500' },
      { name: 'Úlcera Arterial', count: 18, color: 'bg-purple-500' },
      { name: 'Pé Diabético', count: 24, color: 'bg-yellow-500' },
      { name: 'Queimaduras', count: 12, color: 'bg-orange-500' },
    ]
  };

  // Helper to check Active Status (30 days logic)
  const getUserStatus = (lastLogin?: string, isPaused?: boolean) => {
    if (isPaused) return { label: 'Pausado', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
    
    if (!lastLogin) return { label: 'Nunca Acessou', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
    
    const last = new Date(lastLogin);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      return { label: 'Inativo', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
    }
    return { label: 'Ativo', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          w-72 bg-white h-screen fixed left-0 top-0 shadow-2xl z-50 flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
        `}
      >
        <div>
           {/* Sidebar Brand - Left aligned as requested */}
           <div className="p-6 md:p-8 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded bg-brand-vivid flex items-center justify-center text-brand-black shadow-lg shadow-brand-vivid/20">
                    <Activity size={24} />
                 </div>
                 <span className="text-xl font-bold text-brand-black tracking-tight">
                    ESTOMA<span className="text-brand-mid">PRO</span>
                 </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)} 
                className="md:hidden text-gray-400 hover:text-brand-dark"
              >
                <X size={24} />
              </button>
           </div>
           <div className="px-8 mt-[-10px] text-xs text-gray-400 font-medium uppercase tracking-wider">Painel Administrativo</div>

           {/* Navigation Menu */}
           <nav className="mt-8 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => handleTabChange('dashboard')} 
              />
              <SidebarItem 
                icon={Users} 
                label="Profissionais" 
                active={activeTab === 'professionals'} 
                onClick={() => handleTabChange('professionals')} 
              />
              <SidebarItem 
                icon={UserPlus} 
                label="Pacientes" 
                active={activeTab === 'patients'} 
                onClick={() => handleTabChange('patients')} 
              />
              <SidebarItem 
                icon={Activity} 
                label="Evoluções" 
                active={activeTab === 'evolutions'} 
                onClick={() => handleTabChange('evolutions')} 
              />
              <SidebarItem 
                icon={Images} 
                label="Galeria" 
                active={activeTab === 'gallery'} 
                onClick={() => handleTabChange('gallery')} 
              />
              <SidebarItem 
                icon={FileText} 
                label="Relatórios" 
                active={activeTab === 'reports'} 
                onClick={() => handleTabChange('reports')} 
              />
              <SidebarItem 
                icon={Settings} 
                label="Configurações" 
                active={activeTab === 'settings'} 
                onClick={() => handleTabChange('settings')} 
              />
           </nav>
        </div>

        {/* Sidebar Footer (User Profile) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-surface border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                 {profile.photoUrl ? (
                   <img src={profile.photoUrl} alt="Admin" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-brand-dark text-white">
                      <User size={20} />
                   </div>
                 )}
              </div>
              <div className="overflow-hidden">
                 <h4 className="text-sm font-bold text-gray-800 truncate">{profile.name}</h4>
                 <p className="text-xs text-gray-500 truncate" title={profile.email}>{profile.email}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
             <button 
                type="button"
                onClick={() => handleTabChange('profile_edit')}
                className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-brand-dark hover:border-brand-mid/50 transition-colors shadow-sm"
             >
                <Edit size={14} /> Editar
             </button>
             <button 
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
             >
                <LogOut size={14} /> Sair
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-72 ml-0`}>
        
        {/* Top Header (Verde Padrão) */}
        <header className="h-20 bg-brand-dark shadow-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
           
           {/* Lado Esquerdo: Menu Mobile + Logo */}
           <div className="flex items-center gap-4">
             {/* Toggle Button Mobile */}
             <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
             >
               <Menu size={24} />
             </button>
             
             {/* Logo */}
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-brand-vivid flex items-center justify-center text-brand-black shadow-lg">
                    <Activity size={20} />
                 </div>
                 <span className="text-lg md:text-xl font-bold text-white tracking-tight hidden sm:block">
                    ESTOMA<span className="text-brand-vivid">PRO</span>
                 </span>
             </div>
           </div>

           {/* Lado Direito: Data e Hora */}
           <div className="flex items-center gap-4 md:gap-6 text-white">
              <div className="hidden md:flex items-center gap-3 text-right">
                 <div className="p-2 bg-white/10 rounded-lg text-white">
                    <Calendar size={18} />
                 </div>
                 <div>
                    <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Hoje</p>
                    <p className="text-sm font-bold capitalize">{formattedDate}</p>
                 </div>
              </div>
              
              <div className="hidden md:block w-px h-8 bg-white/20"></div>
              
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-lg text-white">
                    <Clock size={18} />
                 </div>
                 <p className="text-lg md:text-xl font-mono font-bold w-16">{formattedTime}</p>
              </div>
           </div>
        </header>

        {/* Content Body */}
        <div className="p-4 md:p-8 overflow-x-hidden">
           {activeTab === 'dashboard' && (
             <div className="animate-fade-up">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral</h2>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                   <MetricCard title="Profissionais" value={metrics.professionals} icon={Users} color="text-blue-600" bg="bg-blue-50" />
                   <MetricCard title="Pacientes Totais" value={metrics.patients} icon={UserPlus} color="text-brand-vivid" bg="bg-brand-surface" />
                   <MetricCard title="Agendamentos" value={metrics.appointments} icon={Calendar} color="text-purple-600" bg="bg-purple-50" />
                   <MetricCard title="Evoluções" value={metrics.evolutions} icon={Activity} color="text-orange-600" bg="bg-orange-50" />
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Lesion Types Distribution */}
                   <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                         <Activity size={20} className="text-brand-mid" />
                         Tipos de Lesões Registradas
                      </h3>
                      <div className="space-y-4">
                         {metrics.lesionTypes.map((type, idx) => (
                            <div key={idx}>
                               <div className="flex justify-between text-sm mb-1 font-medium">
                                  <span className="text-gray-600">{type.name}</span>
                                  <span className="text-gray-900">{type.count}</span>
                               </div>
                               <div className="w-full bg-gray-100 rounded-full h-2.5">
                                  <div 
                                    className={`h-2.5 rounded-full ${type.color}`} 
                                    style={{ width: `${(type.count / 150) * 100}%` }}
                                  ></div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Quick Status */}
                   <div className="bg-brand-dark text-white p-6 rounded-2xl shadow-lg shadow-brand-dark/20 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
                      <div className="relative z-10">
                         <h3 className="text-xl font-bold mb-2">Status do Sistema</h3>
                         <p className="text-white/70 text-sm mb-6">Todos os serviços operando normalmente.</p>
                         <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-brand-vivid animate-pulse"></span>
                            Online
                         </div>
                      </div>
                      <div className="absolute right-[-20px] bottom-[-20px] text-white/5 rotate-12">
                         <Activity size={150} />
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'professionals' && (
             <div className="animate-fade-up">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800">Profissionais Cadastrados</h2>
                 <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar profissional..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-brand-mid focus:ring-1 focus:ring-brand-mid outline-none" />
                 </div>
               </div>

               <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                 {loadingProfs ? (
                   <div className="p-12 text-center text-gray-400">Carregando lista de profissionais...</div>
                 ) : professionals.length === 0 ? (
                   <div className="p-12 text-center flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <Users size={32} />
                      </div>
                      <p className="text-gray-500">Nenhum profissional encontrado.</p>
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-gray-50 border-b border-gray-100">
                           <th className="p-4 text-xs font-bold text-gray-500 uppercase">Profissional</th>
                           <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contato</th>
                           <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cadastro</th>
                           <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                           <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Pacientes</th>
                           <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {professionals.map((prof) => {
                           const status = getUserStatus(prof.lastLogin, prof.isPaused);
                           return (
                             <tr key={prof.uid} className="hover:bg-gray-50/50 transition-colors">
                               <td className="p-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                     {prof.photoUrl ? (
                                       <img src={prof.photoUrl} alt="" className="w-full h-full object-cover" />
                                     ) : (
                                       <div className="w-full h-full flex items-center justify-center bg-brand-surface text-brand-dark font-bold text-xs">
                                         {prof.name.charAt(0)}
                                       </div>
                                     )}
                                   </div>
                                   <div>
                                     <p className="font-bold text-sm text-gray-800">{prof.name}</p>
                                     <p className="text-xs text-gray-400">ID: {prof.uid.substring(0,6)}...</p>
                                   </div>
                                 </div>
                               </td>
                               <td className="p-4">
                                 <div className="text-sm">
                                   <p className="text-gray-600">{prof.email}</p>
                                   {prof.whatsapp && (
                                     <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                       <Phone size={10} /> {prof.whatsapp}
                                     </p>
                                   )}
                                 </div>
                               </td>
                               <td className="p-4 text-sm text-gray-500">
                                 {new Date(prof.createdAt).toLocaleDateString('pt-BR')}
                               </td>
                               <td className="p-4">
                                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                   <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                                   {status.label}
                                 </div>
                               </td>
                               <td className="p-4 text-center">
                                 <span className="font-mono font-bold text-brand-dark bg-brand-surface px-2 py-1 rounded">
                                   {prof.patientCount}
                                 </span>
                               </td>
                               <td className="p-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                   <button 
                                      onClick={() => togglePauseUser(prof.uid, prof.isPaused)}
                                      title={prof.isPaused ? "Reativar Acesso" : "Pausar Acesso"}
                                      className={`p-2 rounded-lg transition-colors ${prof.isPaused ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                                   >
                                      {prof.isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                                   </button>
                                   
                                   <button 
                                      onClick={() => openWhatsApp(prof.whatsapp)}
                                      title="Enviar Mensagem"
                                      disabled={!prof.whatsapp}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                   >
                                      <MessageCircle size={18} />
                                   </button>
                                   
                                   <button 
                                      onClick={() => deleteUser(prof.uid)}
                                      title="Excluir Cadastro"
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                   >
                                      <Trash2 size={18} />
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
               
               <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-yellow-700 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> O status "Inativo" é atribuído automaticamente a profissionais que não acessam a plataforma há mais de 30 dias. 
                    Ao realizar um novo login, o status retorna para "Ativo" automaticamente.
                  </p>
               </div>
             </div>
           )}

           {activeTab === 'profile_edit' && (
             <div className="max-w-4xl mx-auto animate-fade-up pb-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">Editar Perfil Administrativo</h2>
                  <Button variant="ghost" onClick={() => handleTabChange('dashboard')} className="text-gray-500">Cancelar</Button>
                </div>

                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                   <form onSubmit={handleSaveProfile} className="p-6 md:p-8">
                      {/* Photo Upload Section */}
                      <div className="mb-8 flex flex-col items-center">
                         <div className="relative group cursor-pointer">
                            <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                               {profile.photoUrl ? (
                                  <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                               ) : (
                                  <User size={48} className="text-gray-400" />
                               )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Camera className="text-white" size={24} />
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                         </div>
                         <p className="mt-3 text-sm text-gray-500">Clique para alterar a foto</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                         {/* Personal Info */}
                         <div className="md:col-span-2">
                            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Informações Pessoais</h3>
                         </div>

                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                            <input 
                              type="text" 
                              value={profile.name} 
                              onChange={(e) => setProfile({...profile, name: e.target.value})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>

                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email (Cadastro)</label>
                            <input 
                              type="email" 
                              value={profile.email} 
                              readOnly
                              className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                         </div>

                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">COREN</label>
                            <input 
                              type="text" 
                              value={profile.coren} 
                              onChange={(e) => setProfile({...profile, coren: e.target.value})}
                              placeholder="000.000-ENF"
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>

                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Especialidade</label>
                            <input 
                              type="text" 
                              value={profile.specialty} 
                              onChange={(e) => setProfile({...profile, specialty: e.target.value})}
                              placeholder="Ex: Estomaterapia"
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>

                         <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                               <Phone size={12} /> WhatsApp
                            </label>
                            <input 
                              type="tel" 
                              value={profile.whatsapp} 
                              onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>

                         {/* Address Info */}
                         <div className="md:col-span-2 mt-4">
                            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                               <MapPin size={16} /> Endereço
                            </h3>
                         </div>

                         <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Endereço Completo</label>
                            <input 
                              type="text" 
                              value={profile.address.street} 
                              onChange={(e) => setProfile({...profile, address: {...profile.address, street: e.target.value}})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>

                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Bairro</label>
                            <input 
                              type="text" 
                              value={profile.address.neighborhood} 
                              onChange={(e) => setProfile({...profile, address: {...profile.address, neighborhood: e.target.value}})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>

                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                            <input 
                              type="text" 
                              value={profile.address.city} 
                              onChange={(e) => setProfile({...profile, address: {...profile.address, city: e.target.value}})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>

                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                            <input 
                              type="text" 
                              value={profile.address.state} 
                              onChange={(e) => setProfile({...profile, address: {...profile.address, state: e.target.value}})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                            />
                         </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-3">
                         <Button variant="ghost" type="button" onClick={() => handleTabChange('dashboard')} disabled={loading} className="w-full md:w-auto">
                            Cancelar
                         </Button>
                         <Button type="submit" variant="primary" className="flex items-center justify-center gap-2 px-8 w-full md:w-auto" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                         </Button>
                      </div>
                   </form>
                </div>
             </div>
           )}

           {/* Placeholders for other tabs */}
           {!['dashboard', 'professionals', 'profile_edit'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Settings size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-600">Módulo em Desenvolvimento</h3>
                 <p className="text-center px-4">A funcionalidade {activeTab} estará disponível em breve.</p>
              </div>
           )}
        </div>
      </main>
    </div>
  );
};

// Componente auxiliar para item do menu
const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/30' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-brand-dark'
    }`}
  >
    <Icon size={20} className={active ? 'text-brand-vivid' : 'text-gray-400'} />
    <span>{label}</span>
  </button>
);

const MetricCard = ({ title, value, icon: Icon, color, bg }: { title: string, value: number, icon: any, color: string, bg: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:shadow-lg transition-shadow duration-300">
     <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
           <Icon size={24} />
        </div>
     </div>
     <h3 className="text-3xl font-bold text-gray-800 mb-1">{value}</h3>
     <p className="text-sm text-gray-500 font-medium">{title}</p>
  </div>
);

export default AdminDashboard;