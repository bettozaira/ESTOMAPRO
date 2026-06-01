import React from 'react';
import { TESTIMONIALS } from '../constants';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-brand-surface">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-brand-black mb-16">
          Confiança de quem <span className="text-brand-dark border-b-4 border-brand-vivid">cuida</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 border border-transparent hover:border-brand-mid/20 flex flex-col h-full">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(star => (
                   <Star key={star} size={16} className="fill-brand-vivid text-brand-vivid" />
                ))}
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-8 flex-grow italic">
                "{testimonial.comment}"
              </p>

              <div className="flex items-center gap-4 mt-auto border-t border-gray-100 pt-6">
                <img 
                  src={testimonial.imageUrl} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-surface"
                />
                <div>
                  <h4 className="font-bold text-brand-black text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-brand-mid font-bold uppercase tracking-wide">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;