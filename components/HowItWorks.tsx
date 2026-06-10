import React from 'react';
import { STEPS } from '../constants';
import Button from './Button';

interface HowItWorksProps {
  onNavigate?: (page: string) => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-black leading-tight">
              Fluxo clínico otimizado <br/>
              <span className="text-brand-dark">em 4 passos simples</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="space-y-6 relative mb-8">
             {/* Linha vertical de conexão */}
             <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-100"></div>

            {STEPS.map((step, index) => (
              <div key={index} className="relative flex gap-5 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center font-bold text-lg z-10 group-hover:border-brand-vivid group-hover:bg-brand-vivid group-hover:text-brand-black transition-all duration-300">
                  {step.number}
                </div>
                <div className="pt-2 text-left">
                  <h3 className="text-xl font-bold text-brand-black mb-2 group-hover:text-brand-dark transition-colors">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
             <Button variant="primary" onClick={() => onNavigate?.('signup')}>
               Cadastre-se
             </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;