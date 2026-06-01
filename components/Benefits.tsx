import React from 'react';
import { BENEFITS } from '../constants';

const Benefits: React.FC = () => {
  return (
    <section className="py-24 bg-brand-dark relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-mid/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-black/40 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Por que escolher o <span className="text-brand-vivid">ESTOMAPRO</span>?
            </h2>
            <p className="text-gray-200 text-lg leading-relaxed font-light">
              Solução completa que une segurança de dados, mobilidade e eficiência operacional.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BENEFITS.map((benefit, index) => {
             const Icon = benefit.icon;
             return (
              <div key={index} className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-brand-black/20 transition-all duration-300 group">
                <div className="w-14 h-14 bg-brand-black/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform border border-white/5">
                  <Icon size={28} className="text-brand-vivid" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{benefit.title}</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {benefit.description}
                </p>
              </div>
             );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;