import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Benefits from './components/Benefits';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import Button from './components/Button';
import './services/firebase'; // Initialize Firebase
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { auth } from './services/firebase';

const App: React.FC = () => {
  // Simple State-based Router: 'home', 'login', 'signup', 'dashboard', 'admin'
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  // Check auth state on load
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const navigateTo = (page: string) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'signup':
        return <SignUp onNavigate={navigateTo} />;
      case 'login':
        return <Login onNavigate={navigateTo} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigateTo} />;
      case 'home':
      default:
        return (
          <main>
            <Hero onNavigate={navigateTo} />
            <Features />
            <HowItWorks onNavigate={navigateTo} />
            <Benefits />
            <Testimonials />
            
            {/* CTA Section */}
            <section className="py-24 bg-white text-center relative overflow-hidden border-t border-gray-100">
              <div className="container mx-auto px-4 relative z-10">
                 <h2 className="text-3xl md:text-5xl font-bold text-brand-black mb-6 tracking-tight">
                   Pronto para evoluir seu atendimento?
                 </h2>
                 <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                   Junte-se a milhares de enfermeiros que já modernizaram o registro e evolução de lesões com o ESTOMAPRO.
                 </p>
                 <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <Button variant="primary" className="text-lg px-10 py-4 shadow-xl hover:-translate-y-1" onClick={() => navigateTo('signup')}>
                     Cadastre-se
                   </Button>
                   <Button variant="secondary" className="text-lg px-10 py-4" onClick={() => window.open('https://wa.me/5585992304325?text=Olá,%20gostaria%20de%20conhecer%20o%20ESTOMAPRO.', '_blank')}>
                     Falar com Consultor
                   </Button>
                 </div>
                 
                 <p className="mt-8 text-sm text-gray-400">
                   * Instalação rápida via PWA. Não requer loja de aplicativos.
                 </p>
              </div>
            </section>
          </main>
        );
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-surface text-brand-dark">Carregando...</div>;
  }

  // Define quais páginas são internas (App) e não devem ter o Header/Footer público
  const isInternalAppPage = currentPage === 'admin' || currentPage === 'dashboard';

  return (
    <div className="font-sans antialiased text-brand-black bg-brand-surface overflow-x-hidden flex flex-col min-h-screen">
      {!isInternalAppPage && <Header onNavigate={navigateTo} currentPage={currentPage} />}
      
      <div className={isInternalAppPage ? "w-full h-full" : "flex-grow"}>
        {renderContent()}
      </div>

      {!isInternalAppPage && <Footer />}
    </div>
  );
};

export default App;