import React from 'react';
import { Facebook, Instagram, Linkedin, Mail, Phone, Activity } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-brand-black text-gray-400 pt-20 pb-10 border-t border-brand-dark/20">
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
              <li><a href="#" className="hover:text-brand-vivid transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-brand-vivid transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-brand-vivid transition-colors">Termos de Uso</a></li>
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
                <span>+55 (11) 99999-9999</span>
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
    </footer>
  );
};

export default Footer;