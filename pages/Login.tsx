import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Button from '../components/Button';
import { Mail, Lock, LogIn, AlertTriangle } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  // Email do administrador para direcionamento
  const ADMIN_EMAIL = 'zmidia.bz@gmail.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setNeedsVerification(false);

    try {
      let user;

      // 1. Tentar Login Normal
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (err: any) {
        // 2. Se falhar, verificar se é o Admin tentando entrar pela primeira vez (Auto-provisionamento)
        // Nota: 'auth/invalid-credential' pode ser senha errada para usuário existente.
        const isUserNotFound = err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential';
        
        if (isUserNotFound && email === ADMIN_EMAIL) {
             try {
               // Tenta criar. Se falhar com email-already-in-use, significa que usuário já existe e senha estava errada no passo 1.
               const newUserCred = await createUserWithEmailAndPassword(auth, email, password);
               user = newUserCred.user;
             } catch (createErr: any) {
               // Se erro for usuário existente, lançamos o erro original de credencial para cair no catch principal
               if (createErr.code === 'auth/email-already-in-use') {
                 throw err;
               }
               console.error("Erro ao criar admin:", createErr);
               throw createErr;
             }
        } else {
          // Se não for o caso de criar admin, repassa o erro original
          throw err;
        }
      }
      
      // 3. Processar Usuário Autenticado
      if (user) {
        // Check Admin
        if (user.email === ADMIN_EMAIL) {
          onNavigate('admin');
          return;
        }

        // Check Verificação de Email (Usuários Normais)
        if (!user.emailVerified) {
          setNeedsVerification(true);
          setError('Email não verificado.');
          setLoading(false);
          await auth.signOut(); // Desloga pois não pode usar ainda
          return;
        }

        // 4. Verificar Status no Firestore (Pausado/Ativo)
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          // Bloqueio de acesso se pausado pelo admin
          if (userData.isPaused) {
            setError('Seu acesso foi temporariamente suspenso pelo administrador. Entre em contato com o suporte.');
            await auth.signOut();
            setLoading(false);
            return;
          }

          // Atualiza Last Login (Reativa usuário inativo se necessário)
          await updateDoc(userDocRef, {
            lastLogin: new Date().toISOString()
          });
        }

        // Sucesso - Dashboard do Usuário
        onNavigate('dashboard');
      }

    } catch (err: any) {
      // Simplifica o log para erros comuns de credencial
      if (err.code !== 'auth/invalid-credential' && err.code !== 'auth/user-not-found' && err.code !== 'auth/wrong-password') {
          console.error("Login Error:", err);
      }
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else if (err.code === 'auth/configuration-not-found') {
        setError('Erro de configuração no Firebase. Verifique o console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais.');
      }
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        alert('Email reenviado! Verifique sua caixa de entrada.');
      } catch (e) {
        alert('Erro ao reenviar. Tente novamente em instantes.');
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-brand-surface px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 animate-fade-up">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-brand-black mb-2">Bem-vindo(a)</h2>
          <p className="text-gray-500">Acesse sua conta ESTOMAPRO</p>
        </div>

        {error && (
          <div className={`p-4 rounded-lg mb-6 text-sm flex flex-col gap-2 ${needsVerification ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-red-50 text-red-600'}`}>
            <div className="flex items-center gap-2 font-bold">
               <AlertTriangle size={16} />
               {needsVerification ? 'Confirmação Necessária' : 'Acesso Negado'}
            </div>
            <p>{needsVerification ? 'Para sua segurança, confirme o email enviado para acessar o sistema.' : error}</p>
            
            {needsVerification && (
              <button 
                onClick={resendVerification}
                className="text-sm underline font-semibold hover:text-brand-dark text-left mt-1"
              >
                Reenviar email de confirmação
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-mid focus:ring-2 focus:ring-brand-mid/20 outline-none transition-all"
                placeholder="******"
              />
            </div>
            <div className="text-right mt-1">
              <a href="#" className="text-xs text-gray-500 hover:text-brand-dark">Esqueceu a senha?</a>
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full flex justify-center items-center gap-2 mt-4"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Acessar App'}
            {!loading && <LogIn size={18} />}
          </Button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-gray-500">
            Não tem uma conta?{' '}
            <button 
              onClick={() => onNavigate('signup')}
              className="text-brand-dark font-bold hover:underline"
            >
              Cadastre-se
            </button>
          </p>
          <p className="text-sm text-gray-500">
             <button 
              onClick={() => onNavigate('home')}
              className="hover:text-brand-dark transition-colors"
            >
              Voltar ao início
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;