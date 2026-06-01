import React from 'react';
import { FEATURES } from '../constants';

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-brand-surface relative">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h4 className="text-brand-mid font-bold tracking-widest uppercase text-xs mb-4">Recursos Avançados</h4>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-black mb-6 tracking-tight">
            Tecnologia que <span className="text-brand-dark border-b-4 border-brand-vivid">simplifica</span> o cuidado
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Ferramentas precisas desenvolvidas para eliminar a burocracia e focar no que importa: a recuperação do paciente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="group relative bg-white rounded-xl p-8 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-brand-mid/20"
              >
                <div className="w-14 h-14 bg-brand-surface rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-dark transition-colors duration-300">
                  <Icon size={28} className="text-brand-dark group-hover:text-brand-vivid transition-colors duration-300" strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl font-bold text-brand-black mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-500 leading-relaxed text-sm">
                  {feature.description}
                </p>

                {/* Bottom Highlight */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-brand-vivid group-hover:w-full transition-all duration-300"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;