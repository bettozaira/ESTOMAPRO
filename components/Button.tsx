import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide";
  
  const variants = {
    // Primary: Verde Floresta Escuro (#2E5939) - Sério e Institucional
    primary: "bg-brand-dark text-white hover:bg-brand-black shadow-lg shadow-brand-dark/20 hover:shadow-brand-dark/40 focus:ring-brand-dark border border-transparent",
    
    // Accent: Verde Vivo (#23D962) - Para CTA de alta conversão (ex: Cadastre-se)
    // Texto preto (#0D0A0A) para garantir contraste alto sobre o verde neon
    accent: "bg-brand-vivid text-brand-black hover:bg-brand-mid hover:text-white shadow-lg shadow-brand-vivid/20 hover:shadow-brand-vivid/40 focus:ring-brand-vivid",
    
    // Secondary: Fundo Surface com borda
    secondary: "bg-white text-brand-dark border border-brand-dark/20 hover:border-brand-dark hover:bg-brand-surface focus:ring-brand-dark",
    
    // Outline: Borda Branca (para fundos escuros)
    outline: "bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white focus:ring-white",
    
    // Ghost: Texto apenas
    ghost: "bg-transparent text-brand-dark hover:bg-brand-dark/5 focus:ring-brand-dark",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;