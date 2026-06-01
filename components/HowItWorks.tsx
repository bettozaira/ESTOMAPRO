import React from 'react';
import { STEPS } from '../constants';
import Button from './Button';
import { ArrowRight } from 'lucide-react';

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Text & Steps */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-black mb-8 leading-tight">
              Fluxo clínico otimizado <br/>
              <span className="text-brand-dark">em 4 passos simples</span>
            </h2>

            <div className="space-y-8 relative">
               {/* Linha vertical de conexão */}
               <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-100"></div>

              {STEPS.map((step, index) => (
                <div key={index} className="relative flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center font-bold text-lg z-10 group-hover:border-brand-vivid group-hover:bg-brand-vivid group-hover:text-brand-black transition-all duration-300">
                    {step.number}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-brand-black mb-2 group-hover:text-brand-dark transition-colors">{step.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pl-16">
               <Button variant="primary">
                 Cadastre-se
               </Button>
            </div>
          </div>

           {/* UI Mockup Right */}
           <div className="w-full lg:w-1/2 relative">
             <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-brand-black bg-brand-black aspect-[9/16] max-w-sm mx-auto">
                {/* Updated Image: Nurse in green scrub, smiling, talking to patient (over shoulder view) */}
                <img 
                  src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Enfermeira de scrub verde sorrindo conversando com paciente" 
                  className="w-full h-full object-cover opacity-90"
                />
                
                {/* Overlay Card */}
                <div className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg border-l-4 border-brand-vivid">
                   <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-brand-black text-sm">Relatório Gerado</h4>
                      <span className="bg-brand-vivid/20 text-brand-dark text-[10px] px-2 py-1 rounded font-bold uppercase">Sucesso</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <ArrowRight size={16} className="text-brand-dark" />
                      </div>
                      <div className="text-xs text-gray-500">Pronto para compartilhamento</div>
                   </div>
                </div>
             </div>
             
             {/* Decorative blob */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-vivid/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;