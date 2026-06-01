import React from 'react';
import Button from './Button';
import { ChevronRight, ShieldCheck, Star } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative lg:h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-brand-black">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Nova imagem de fundo clean/hospitalar */}
        <img 
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80" 
          alt="Ambiente Hospitalar Moderno" 
          className="w-full h-full object-cover opacity-40 grayscale"
        />
        {/* Gradient usando a paleta estrita */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/90 via-brand-dark/80 to-brand-black/90"></div>
        
        {/* Efeitos de Luz (Verde Vivo #23D962) */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-vivid/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 pt-20 flex flex-col items-center text-center">
        
        {/* Badge Versão */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-dark/50 border border-brand-vivid/20 backdrop-blur-md rounded-full mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-brand-vivid animate-pulse"></span>
          <span className="text-white/90 text-xs font-bold tracking-wider uppercase">Versão 2.0 Disponível</span>
        </div>
        
        {/* Headline Grande Centralizada */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] text-white tracking-tight max-w-5xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
          O seu assistente <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-vivid">
            digital definitivo
          </span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl font-light animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Registre evoluções, gerencie pacientes e gere relatórios com precisão de forma online.
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
          {/* Botão Acentuado com Verde Vivo */}
          <Button variant="accent" className="text-lg min-w-[200px] shadow-glow">
            Acessar App
          </Button>
          <Button variant="outline" className="text-lg min-w-[200px] flex items-center justify-center gap-2 group">
            Ver Recursos
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Footer Badges - Spacing Reduced */}
        <div className="mt-6 flex flex-wrap justify-center gap-8 md:gap-16 text-white/60 text-sm font-medium border-t border-white/10 pt-4 w-full max-w-3xl animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-brand-vivid" />
            <span className="tracking-wide">Segurança total</span>
          </div>
          <div className="flex items-center gap-3">
            <Star size={20} className="text-brand-vivid" />
            <span className="tracking-wide">Rápido e eficiente</span>
          </div>
        </div>
      </div>
      
      {/* Transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-brand-surface to-transparent"></div>
    </section>
  );
};

export default Hero;