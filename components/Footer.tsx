import React, { useState } from 'react';
import { Facebook, Instagram, Linkedin, Mail, Phone, Activity, X } from 'lucide-react';

const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'help' | 'privacy' | 'terms' | null>(null);

  const handleOpenModal = (e: React.MouseEvent, type: 'help' | 'privacy' | 'terms') => {
    e.preventDefault();
    setModalType(type);
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  return (
    <footer id="footer" className="bg-brand-black text-gray-400 pt-20 pb-10 border-t border-brand-dark/20 relative">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div>
            <div className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-brand-vivid flex items-center justify-center text-brand-black">
                  <Activity size={18} />
                </div>
                <span>ESTOMA<span className="text-brand-mid">PRO</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-8 max-w-xs text-gray-500">
              Tecnologia de ponta para estomaterapia. Segurança, agilidade e precisão no cuidado com o paciente.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-vivid hover:text-brand-black transition-all"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-vivid hover:text-brand-black transition-all"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-vivid hover:text-brand-black transition-all"><Linkedin size={18} /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Plataforma</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#features" className="hover:text-brand-vivid transition-colors">Funcionalidades</a></li>
              <li><a href="#how-it-works" className="hover:text-brand-vivid transition-colors">Como Funciona</a></li>
              <li><a href="#" className="hover:text-brand-vivid transition-colors">Acessar App</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-6">Suporte</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" id="link-help" onClick={(e) => handleOpenModal(e, 'help')} className="hover:text-brand-vivid transition-colors">Central de Ajuda</a></li>
              <li><a href="#" id="link-privacy" onClick={(e) => handleOpenModal(e, 'privacy')} className="hover:text-brand-vivid transition-colors">Política de Privacidade</a></li>
              <li><a href="#" id="link-terms" onClick={(e) => handleOpenModal(e, 'terms')} className="hover:text-brand-vivid transition-colors">Termos de Uso</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">Contato</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-brand-vivid" />
                <span>contato@estomapro.com.br</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-brand-vivid" />
                <a 
                  id="phone-contact"
                  href="https://wa.me/5585992304325" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-vivid transition-colors"
                >
                  +55 (85) 99230-4325
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm gap-4">
          <p>&copy; {new Date().getFullYear()} ESTOMAPRO. Todos os direitos reservados.</p>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-brand-vivid"></div>
            <span className="text-gray-500">Sistema Operacional</span>
          </div>
        </div>
      </div>

      {/* Elegant Local Modal */}
      {modalType && (
        <div 
          id="info-modal-backdrop" 
          className="fixed inset-0 bg-brand-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div 
            id="info-modal-container" 
            className="bg-white text-brand-black rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-brand-black">
                {modalType === 'help' && "Central de Ajuda"}
                {modalType === 'privacy' && "Política de Privacidade"}
                {modalType === 'terms' && "Termos de Uso"}
              </h3>
              <button 
                id="info-modal-close"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-brand-black p-1.5 rounded-full hover:bg-gray-200 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-600 leading-relaxed">
              {modalType === 'help' && (
                <div className="space-y-4">
                  <p>O ESTOMAPRO foi desenvolvido para auxiliar profissionais de enfermagem no registro, acompanhamento e documentação da evolução de lesões.</p>
                  <p className="font-semibold text-brand-black mb-1">Principais funcionalidades:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-500">
                    <li>Cadastro de pacientes</li>
                    <li>Agendamento de atendimentos</li>
                    <li>Registro de evolução clínica</li>
                    <li>Galeria fotográfica</li>
                    <li>Relatórios profissionais</li>
                    <li>Armazenamento seguro de informações</li>
                  </ul>
                  <p className="pt-2 border-t border-gray-100">Em caso de dúvidas ou sugestões, entre em contato através do WhatsApp disponível na plataforma.</p>
                </div>
              )}

              {modalType === 'privacy' && (
                <div className="space-y-4">
                  <p>O ESTOMAPRO respeita a privacidade dos seus usuários.</p>
                  <p>As informações cadastradas são utilizadas exclusivamente para fins de registro clínico e gerenciamento profissional.</p>
                  <p>Os dados armazenados não são compartilhados com terceiros sem autorização do usuário.</p>
                  <p>O sistema adota medidas de segurança para proteger as informações registradas e garantir a confidencialidade dos dados.</p>
                  <p className="text-gray-400 text-xs">Esta política poderá ser atualizada conforme a evolução do projeto.</p>
                </div>
              )}

              {modalType === 'terms' && (
                <div className="space-y-4">
                  <p>O ESTOMAPRO é uma ferramenta de apoio ao registro e gerenciamento de informações clínicas.</p>
                  <p>A responsabilidade pelas informações inseridas no sistema é exclusivamente do profissional usuário.</p>
                  <p>O sistema não substitui protocolos clínicos, pareceres técnicos ou decisões profissionais.</p>
                  <p>Ao utilizar a plataforma, o usuário concorda com estes termos e compromete-se a utilizar o sistema de forma ética e responsável.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                id="info-modal-ok"
                onClick={handleCloseModal}
                className="px-5 py-2.5 bg-brand-dark hover:bg-brand-mid text-white rounded-lg font-medium text-xs transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;