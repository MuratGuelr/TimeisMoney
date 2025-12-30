import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowRight } from 'lucide-react';

const OnboardingModal = () => {
  const { userSettings, updateOnboarding } = useFinance();
  
  // If salary is set, we assume onboarding is done
  if (userSettings.salary > 0) return null;

  const [formData, setFormData] = useState({
    salary: '',
    workingDays: '5',
    workingHours: '8'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.salary || !formData.workingDays || !formData.workingHours) return;
    updateOnboarding(formData.salary, formData.workingDays, formData.workingHours);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">Time is Money</h1>
            <p className="text-gray-400">Let's calculate what your time is really worth.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Monthly Net Salary (TL)</label>
                <input 
                    type="number" 
                    required
                    placeholder="30000"
                    className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white text-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Days / Week</label>
                    <input 
                        type="number" 
                        required
                        max="7"
                        min="1"
                        className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white text-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        value={formData.workingDays}
                        onChange={(e) => setFormData({...formData, workingDays: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Hours / Day</label>
                    <input 
                        type="number" 
                        required
                        max="24"
                        min="1"
                        className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white text-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        value={formData.workingHours}
                        onChange={(e) => setFormData({...formData, workingHours: e.target.value})}
                    />
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-primary hover:bg-emerald-400 text-white font-bold p-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
                Start Tracking <ArrowRight size={20} />
            </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingModal;
