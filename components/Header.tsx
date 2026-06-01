import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, Activity, UserPlus } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import Button from './Button';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    
    if (currentPage !== 'home') {
      onNavigate('home');
      // Pequeno delay para permitir a renderização da home antes do scroll
      setTimeout(() => {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isInternalPage = currentPage !== 'home';
  // Se for página interna (login/signup), forçamos o estilo "scrolled" para visibilidade
  const forceSolidBg = isInternalPage; 

  const headerBgClass = (isScrolled || forceSolidBg)
    ? 'bg-brand-dark/95 backdrop-blur-md border-b border-white/10 py-3 shadow-lg' 
    : 'bg-transparent border-transparent py-6';
    
  const textColorClass = 'text-white';
  const logoColorClass = 'text-white';
  const logoBgClass = (isScrolled || forceSolidBg) ? 'bg-brand-vivid text-brand-black' : 'bg-brand-vivid text-brand-black';

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${headerBgClass}`}
    >
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        {/* Logo */}
        <a 
          href="#" 
          onClick={(e) => handleLinkClick(e, '#home')}
          className="flex items-center gap-2 group"
        >
           <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${logoBgClass}`}>
             <Activity size={24} className="group-hover:scale-110 transition-transform" />
           </div>
           <span className={`text-xl md:text-2xl font-bold tracking-tight transition-colors duration-300 ${logoColorClass}`}>
             ESTOMA<span className="text-brand-vivid">PRO</span>
           </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className={`text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                (isScrolled || forceSolidBg) ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}
          
          <div className="flex items-center gap-3 ml-4">
            <Button 
               variant="ghost" 
               className="text-white hover:bg-white/10 px-4 py-2 text-sm flex items-center gap-2"
               onClick={() => onNavigate('signup')}
            >
              <UserPlus size={16} />
              Cadastre-se
            </Button>
            
            <Button 
              variant="accent" 
              className="py-2 px-6 text-sm flex items-center gap-2 border-none"
              onClick={() => onNavigate('login')}
            >
              <LogIn size={16} />
              Acessar App
            </Button>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X size={28} className={textColorClass} />
          ) : (
            <Menu size={28} className={textColorClass} />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-brand-dark shadow-xl border-t border-white/10 flex flex-col p-4 animate-fade-in-down origin-top">
          {NAV_LINKS.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              className="py-4 text-white/90 font-semibold border-b border-white/10 hover:text-brand-vivid px-2"
              onClick={(e) => handleLinkClick(e, link.href)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-6 flex flex-col gap-3">
             <Button 
                variant="outline" 
                className="w-full flex justify-center items-center gap-2"
                onClick={() => {
                  onNavigate('signup');
                  setIsOpen(false);
                }}
             >
                <UserPlus size={18} />
                Criar Conta
             </Button>
             <Button 
                variant="accent" 
                className="w-full flex justify-center items-center gap-2"
                onClick={() => {
                  onNavigate('login');
                  setIsOpen(false);
                }}
             >
                <LogIn size={18} />
                Acessar App
             </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;