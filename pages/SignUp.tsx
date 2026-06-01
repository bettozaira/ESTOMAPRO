import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Button from '../components/Button';
import { Mail, Lock, User, Phone, CheckCircle, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface SignUpProps {
  onNavigate: (page: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Profile Name
      await updateProfile(user, { displayName: formData.name });

      // 3. Save to Firestore with extended metadata
      const now = new Date().toISOString();
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        role: 'user', // Default role
        createdAt: now,
        lastLogin: now, // Initialize last login
        isPaused: false, // Default access status
        photoUrl: ''
      });

      // 4. Send Verification Email
      await sendEmailVerification(user);

      setStep('verification');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está cadastrado.');
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        setError('Serviço de cadastro temporariamente indisponível (Erro de Configuração).');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        alert('Email de verificação reenviado!');
      } catch (err) {
        alert('Aguarde alguns instantes antes de reenviar.');
      }
    }
  };

  if (step === 'verification') {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-brand-surface px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} className="text-brand-vivid" />
          </div>
          
          <h2 className="text-2xl font-bold text-brand-black mb-4">Confirme seu Email</h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Enviamos um link de confirmação para <strong>{formData.email}</strong>.
            <br/><br/>
            Por favor, verifique sua caixa de entrada e também a pasta de <strong>Spam/Lixo Eletrônico</strong>.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-800 flex gap-3 text-left">
            <AlertCircle className="flex-shrink-0" size={20} />
            <p>Para acessar o sistema, é obrigatório confirmar seu email.</p>
          </div>

          <div className="space-y-4">
            <Button 
              variant="accent" 
              className="w-full flex justify-center items-center gap-2"
              onClick={() => onNavigate('login')}
            >
              Já confirmei, Acessar App
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-brand-dark"
              onClick={handleResendEmail}
            >
              Reenviar email de confirmação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-brand-surface px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-up">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-brand-black mb-2">Crie sua conta</h2>
            <p className="text-gray-500">Junte-se ao ESTOMAPRO</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                    placeholder="******"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                    placeholder="******"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full flex justify-center items-center gap-2 mt-4"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar minha conta'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Já tem uma conta?{' '}
              <button 
                onClick={() => onNavigate('login')}
                className="text-brand-dark font-bold hover:underline"
              >
                Acessar App
              </button>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              <button 
                onClick={() => onNavigate('home')}
                className="hover:text-brand-dark transition-colors"
              >
                Voltar ao início
              </button>
            </p>
          </div>
        </div>

        {/* LGPD Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-start gap-3">
           <ShieldCheck size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
           <p className="text-xs text-gray-500 leading-relaxed">
             <strong>Segurança LGPD:</strong> Seus dados são criptografados e armazenados com segurança. 
             Não compartilhamos suas informações com terceiros sem seu consentimento explícito.
           </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;