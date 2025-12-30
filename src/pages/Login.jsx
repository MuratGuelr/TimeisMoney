import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { googleSignIn, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (userProfile === undefined) return; // Wait for profile fetch
      
      if (userProfile?.profileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [currentUser, userProfile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl text-center space-y-8 z-10">
        <div>
            <div className="w-16 h-16 bg-gradient-to-tr from-primary to-emerald-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20">
                <LogIn className="text-background" size={32} />
            </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Time is Money
          </h1>
          <p className="text-gray-400 text-lg">
            Boşa harcamayı bırak. Doğru takip etmeye başla.
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-white text-background font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          Google ile Giriş Yap
        </button>
        
        <p className="text-xs text-gray-500 mt-8">
            Devam ederek Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
};

export default Login;
