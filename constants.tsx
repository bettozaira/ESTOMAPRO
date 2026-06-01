import { 
  ClipboardList, // Changed/Added
  Calendar,      // Added
  Images, 
  Laptop,        // Added
  FileText, 
  Database,      // Added
  Clock,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { NavItem, FeatureItem, StepItem, BenefitItem, TestimonialItem } from './types';

export const NAV_LINKS: NavItem[] = [
  { label: 'Início', href: '#home' },
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Como Funciona', href: '#how-it-works' },
  { label: 'Contato', href: '#footer' },
];

export const FEATURES: FeatureItem[] = [
  {
    title: 'Lista de Pacientes',
    description: 'Organize prontuários digitais com acesso rápido e seguro ao histórico completo.',
    icon: ClipboardList,
  },
  {
    title: 'Agendamento de Atendimentos',
    description: 'Gerencie sua agenda de consultas e visitas domiciliares com total controle.',
    icon: Calendar,
  },
  {
    title: 'Galeria de Lesões',
    description: 'Registro fotográfico cronológico para acompanhamento visual da cicatrização.',
    icon: Images,
  },
  {
    title: 'Compatível com PC e Smartphone',
    description: 'Sistema responsivo que se adapta perfeitamente ao seu celular, tablet ou computador.',
    icon: Laptop,
  },
  {
    title: 'Relatórios Profissionais',
    description: 'Gere documentação clínica detalhada pronta para impressão ou envio digital.',
    icon: FileText,
  },
  {
    title: 'Backup de Dados',
    description: 'Segurança total com salvamento automático das informações na nuvem.',
    icon: Database,
  },
];

export const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Cadastro',
    description: 'Cadastre o paciente e inicie o prontuário digital no sistema.',
  },
  {
    number: '02',
    title: 'Agendamento',
    description: 'Planeje o atendimento ou visita domiciliar na sua agenda.',
  },
  {
    number: '03',
    title: 'Evolução',
    description: 'Registre a evolução da lesão, anexe fotos e dados clínicos.',
  },
  {
    number: '04',
    title: 'Relatórios',
    description: 'Gere o documento final completo com apenas um clique.',
  },
];

export const BENEFITS: BenefitItem[] = [
  {
    title: 'Maior Eficiência',
    description: 'Automatize o processo de registro de lesões e evolução clínica, economizando tempo precioso.',
    icon: Clock,
  },
  {
    title: 'Acessibilidade Total',
    description: 'Acesse dados em qualquer dispositivo (celular, tablet, PC), online ou offline.',
    icon: Smartphone,
  },
  {
    title: 'Segurança de Dados',
    description: 'Proteção com senha, backup automático e exportação de dados segura.',
    icon: ShieldCheck,
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'Ana Souza',
    role: 'Enfermeira Estomaterapeuta',
    comment: 'O ESTOMAPRO revolucionou a forma como organizo meus atendimentos domiciliares. A galeria de lesões é incrível!',
    imageUrl: 'https://picsum.photos/100/100?random=1',
  },
  {
    name: 'Dr. Carlos Mendes',
    role: 'Enfermeiro Chefe',
    comment: 'Gerar relatórios profissionais nunca foi tão fácil. A equipe está muito mais produtiva.',
    imageUrl: 'https://picsum.photos/100/100?random=2',
  },
  {
    name: 'Mariana Lima',
    role: 'Técnica de Enfermagem',
    comment: 'A interface é muito intuitiva e o fato de funcionar offline me salva em áreas rurais.',
    imageUrl: 'https://picsum.photos/100/100?random=3',
  },
];