import { useState, useEffect, useRef } from 'react';
import { Mic, Keyboard, X, Check, AlertCircle, StopCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { calculateTimeCost, formatCurrency, formatTurkishNumber, parseTurkishNumber } from '../utils/timeCalculations';
import VoiceOrb from './VoiceOrb';

const VoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [parsedData, setParsedData] = useState({ title: '', amount: 0 });
  
  // Manual Input State
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualTitle, setManualTitle] = useState('');

  // Error State
  const [errorDetails, setErrorDetails] = useState('');
  
  // Countdown State
  const [countdown, setCountdown] = useState(null);

  const { userSettings, addTransaction } = useFinance();
  const recognitionRef = useRef(null);
  const lastSpeechTimeRef = useRef(Date.now());
  const detectedTextRef = useRef(''); // Ref to access latest text in interval

  useEffect(() => {
    let intervalId;

    if (isListening) {
        intervalId = setInterval(() => {
            const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
            const SILENCE_THRESHOLD = 750; // Detect silence after 0.75s
            const COUNTDOWN_DURATION = 3000; // 3 seconds countdown logic

            // Only start countdown if we have some text
            if (timeSinceLastSpeech > SILENCE_THRESHOLD && detectedTextRef.current.trim().length > 0) {
                // Calculate remaining time for the 3s countdown
                // Total wait time = SILENCE_THRESHOLD + COUNTDOWN_DURATION
                // We want to show 3...2...1 during the COUNTDOWN_DURATION part
                const timeInCountdown = timeSinceLastSpeech - SILENCE_THRESHOLD;
                const remaining = Math.max(0, Math.ceil((COUNTDOWN_DURATION - timeInCountdown) / 1000));
                
                setCountdown(remaining);

                if (remaining <= 0) {
                    // Trigger Finish
                    recognitionRef.current?.stop();
                    setIsListening(false);
                    parseVoiceCommand(detectedTextRef.current);
                    setCountdown(null);
                }
            } else {
                setCountdown(null);
            }
        }, 100);
    } else {
        setCountdown(null);
    }

    return () => clearInterval(intervalId);
  }, [isListening]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'tr-TR';
      recognitionRef.current.interimResults = true; 
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        // Reset silence timer on every speech event
        lastSpeechTimeRef.current = Date.now();
        setCountdown(null);

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // ANDROID FIX: Deduplicate text
        // On some Android devices, the interim transcript includes the already finalized text.
        // We check if interim strictly starts with final (ignoring case/trim issues slightly)
        let currentText = finalTranscript + interimTranscript;
        
        const cleanFinal = finalTranscript.trim().toLowerCase();
        const cleanInterim = interimTranscript.trim().toLowerCase();

        if (cleanFinal.length > 0 && cleanInterim.startsWith(cleanFinal)) {
            // Overlap detected: Use interim as the full source of truth
            currentText = interimTranscript;
        }

        setDetectedText(currentText);
        detectedTextRef.current = currentText; // Update ref for interval
        setErrorDetails('');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
         if (event.error === 'network') {
            setErrorDetails("Network error. If you are using Brave or an Adblocker, this feature may be blocked. Try Chrome.");
        } else if (event.error === 'not-allowed') {
            setErrorDetails("Microphone access denied. Please allow permission.");
        } else if (event.error === 'no-speech') {
            // Ignore
        } else {
            setErrorDetails("Voice error: " + event.error);
        }
        
        setTimeout(() => setErrorDetails(''), 5000);
      };

      recognitionRef.current.onend = () => {
         // Managed by logic
      };
    } else {
        setErrorDetails("Voice not supported in this browser.");
    }
  }, []);

  const parseVoiceCommand = (text) => {
    let amount = 0;
    let title = text;
    let amountStr = '';

    // Strategy 1: Look for explicit currency markers
    const currencyRegex = /([\d.,]+)\s*(?:tl|lira|₺|türk lirası)/i;
    const currencyMatch = text.match(currencyRegex);

    if (currencyMatch) {
      amountStr = currencyMatch[1];
      title = text.replace(currencyMatch[0], '').trim();
    } else {
      // Strategy 2: Fallback to the LAST number
      const allNumbers = text.match(/([\d.,]+)/g);
      if (allNumbers && allNumbers.length > 0) {
        amountStr = allNumbers[allNumbers.length - 1];
        const lastIndex = text.lastIndexOf(amountStr);
        if (lastIndex !== -1) {
            title = text.substring(0, lastIndex) + text.substring(lastIndex + amountStr.length);
        }
      }
    }

    if (amountStr) {
        let cleanVal = amountStr.replace(/\./g, '').replace(',', '.');
        amount = parseFloat(cleanVal);
    }

    if (title) {
        title = title.replace(/\b(tl|lira|türk lirası)\b/gi, '').replace('₺', '');
        title = title.replace(/\s+/g, ' ').trim();
        if (title.length > 0) {
            title = title.charAt(0).toUpperCase() + title.slice(1);
        }
    }
    
    if (!title || title.length === 0) title = 'Genel';

    // Auto-Detect Category Strategy
    const detectCategory = (text) => {
        const t = text.toLowerCase();
        
        // 1. HOUSING & BILLS (Ev & Faturalar)
        if (t.match(/(kira|aidat|depozito|emlak|komisyon|nakliye)/)) return 'Konut';
        if (t.match(/(fatura|elektrik|su|doğalgaz|internet|telefon|gsm|turkcell|vodafone|telekom|superonline|kablonet|digiturk|tivibu|netflix|spotify|youtube|üyelik|abonelik)/)) return 'Faturalar';

        // 2. FOOD & DRINK (Yeme & İçme & Market)
        if (t.match(/(market|bakkal|büfe|manav|kasap|fırın|bim|a101|şok|migros|carrefour|file|macro|getir|isteğelsin)/)) return 'Market';
        if (t.match(/(yemek|restoran|cafe|kafe|kahve|çay|starbucks|espresso|latte|su|döner|kebap|lahmacun|pide|pizza|burger|sandviç|tost|simit|poğaça|çorba|tatlı|baklava|künefe|dondurma|yemeksepeti|trendiolyemek)/)) return 'Yeme-İçme';

        // 3. TRANSPORT (Ulaşım)
        if (t.match(/(taksi|uber|bitaksi|martı|binbin|otobüs|lave|metro|metrobüs|marmaray|tramvay|vapur|dolmuş|minibüs|akbil|istanbulkart|bilet)/)) return 'Ulaşım';
        if (t.match(/(benzin|mazot|lpg|yakıt|shell|opet|bp|petrol|otopark|park|hgs|ogs|ceza|araba|bakım|tamir|sanayi|lastik|muayene)/)) return 'Araç';

        // 4. SHOPPING (Alışveriş)
        if (t.match(/(kıyafet|giyim|ayakkabı|bot|mont|ceket|pantolon|gömlek|tişört|kazak|elbise|etek|çanta|cüzdan|şapka|saat|takı|aksesuar)/)) return 'Alışveriş';
        if (t.match(/(zara|mango|h&m|lcw|lc waikiki|koton|defacto|mavi|boyner|beymen|stradivarius|pull&bear|bershka|nike|adidas|puma)/)) return 'Alışveriş';
        if (t.match(/(trendyol|hepsiburada|amazon|n11|çiçeksepeti|ikea|koçtaş|bauhaus|teknosa|mediamarkt|vatan|apple|samsung|telefon|bilgisayar|tablet|kulaklık|şarj)/)) return 'Alışveriş';

        // 5. HEALTH & PERSONAL (Sağlık & Bakım)
        if (t.match(/(eczane|ilaç|vitamin|ağrı kesici|antibiyotik|hastane|doktor|muayene|tahlil|diş|dişçi|göz|lens|psikolog|terapi)/)) return 'Sağlık';
        if (t.match(/(berber|kuaför|saç|sakal|ağda|epilasyon|cilt|bakım|kozmetik|gratis|watsons|rossmann|parfüm|deodorant|krem|şampuan)/)) return 'Bakım';

        // 6. ENTERTAINMENT & HOBBY (Eğlence)
        if (t.match(/(sinema|film|tiyatro|konser|maç|oyun|steam|playstation|xbox|oyuncak|hobi|kitap|dergi|kırtasiye|tatil|otel|uçak|tur)/)) return 'Eğlence';

        // 7. FINANCE & DEBT (Finans)
        if (t.match(/(kredi|taksit|borç|kart|ekstre|avans|kyk|vergi|harç|sigorta|kasko)/)) return 'Finans';

        // Fallback checks for broader terms if specific ones didn't match
        if (t.includes('alışveriş')) return 'Alışveriş';
        if (t.includes('ödeme')) return 'Faturalar';

        return 'Genel';
    };

    const detectedCategory = detectCategory(title);

    setParsedData({ title, amount: amount || 0, category: detectedCategory });
    setShowModal(true);
  };

  const toggleListening = () => {
    setErrorDetails('');
    if (isListening) {
      // Manual Stop (Immediate)
      recognitionRef.current?.stop();
      setIsListening(false);
      // If we have text, try to parse it immediately instead of just stopping
      if (detectedTextRef.current) {
          parseVoiceCommand(detectedTextRef.current);
      }
    } else {
      setDetectedText('');
      detectedTextRef.current = '';
      lastSpeechTimeRef.current = Date.now();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setErrorDetails("Could not start microphone.");
      }
    }
  };

  const cancelListening = () => {
      recognitionRef.current?.abort();
      setIsListening(false);
      setDetectedText('');
      detectedTextRef.current = '';
      setCountdown(null);
  };

  const handleConfirm = () => {
    addTransaction(parsedData.amount, parsedData.title, parsedData.category);
    setShowModal(false);
    setDetectedText('');
  };

  const handleManualSubmit = (e) => {
      e.preventDefault();
      if (!manualAmount) return;
      addTransaction(parseTurkishNumber(manualAmount), manualTitle || 'Genel');
      setShowManualInput(false);
      setManualAmount('');
      setManualTitle('');
  };

  const timeCost = calculateTimeCost(parsedData.amount, userSettings.hourlyRate);

  return (
    <>
      {/* Error Toast */}
      {errorDetails && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce-in text-sm">
              <AlertCircle size={16} /> {errorDetails}
          </div>
      )}

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <VoiceOrb isListening={isListening} onClick={toggleListening} />
      </div>

      {/* Listening Overlay (Real-time) */}
      {isListening && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 animate-fade-in pointer-events-auto">
           {/* Visuals */}
           <div className="mb-12 relative flex items-center justify-center">
              <div className="w-32 h-32 bg-primary/20 rounded-full animate-pulse-slow absolute"></div>
              <div 
                  onClick={toggleListening}
                  className="w-24 h-24 bg-primary rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-primary/30 cursor-pointer hover:scale-105 transition-transform opacity-50"
              >
                  <Mic size={40} className="text-white animate-bounce-gentle" />
              </div>
              
              {/* Spinning rings or Countdown Ring */}
               {countdown !== null ? (
                   <div className="absolute inset-0 flex items-center justify-center z-20">
                       <span className="text-7xl font-black text-primary drop-shadow-[0_0_30px_rgba(204,255,0,0.6)] animate-pulse -mt-2">{countdown}</span>
                   </div>
               ) : (
                   <>
                    <div className="absolute w-40 h-40 border-2 border-primary/20 rounded-full animate-spin-slow"></div>
                    <div className="absolute w-48 h-48 border border-primary/10 rounded-full animate-spin-reverse-slower"></div>
                   </>
               )}
           </div>

           {/* Live Text */}
           <div className="w-full max-w-2xl text-center space-y-6">
              {countdown !== null ? (
                   <p className="text-emerald-400 text-lg font-bold uppercase tracking-[0.3em] animate-pulse">Otomatik Onaylanıyor...</p>
              ) : (
                   <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em]">Dinliyorum...</p>
              )}
              
              <p className="text-3xl md:text-5xl font-black text-white leading-tight min-h-[1.2em]">
                  "{detectedText || '...'}"
              </p>
              
              <p className="text-gray-500 text-sm">
                  {countdown !== null ? "İptal etmek için konuşun" : "Örnek: 'Market 50 TL'"}
              </p>
           </div>

           {/* Actions */}

        </div>
      )}

      {/* Confirmation Modal (Voice) */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
             {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
            
            {/* Modal Content */}
            <div className="bg-surface border border-white/10 w-full max-w-md p-6 rounded-3xl shadow-2xl transform transition-all scale-100 z-10 relative">
                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Harcama Onayı</h3>
                
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block mb-1">{parsedData.category}</span>
                        <h2 className="text-3xl font-bold text-white max-w-[200px] leading-tight break-words">{parsedData.title}</h2>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-mono text-primary">{formatCurrency(parsedData.amount)}</span>
                    </div>
                </div>

                <div className="bg-surfaceHighlight/50 border border-white/5 rounded-2xl p-5 mb-8 flex items-center gap-4">
                    <div className="bg-orange-500/20 p-3 rounded-full shrink-0">
                        <span className="text-2xl leading-none">⏳</span>
                    </div>
                    <div>
                        <p className="text-orange-200 text-sm font-medium">Zaman Maliyeti</p>
                        <p className="text-white font-bold text-lg">
                            Bunun için <span className="text-orange-400">{timeCost}</span> çalışmalısın.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                    className="flex-1 py-4 rounded-xl bg-surfaceHighlight text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer z-20"
                >
                    <X size={20} /> İptal
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                    className="flex-1 py-4 rounded-xl bg-primary text-white font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer z-20"
                >
                    <Check size={20} /> Onayla
                </button>
                </div>
            </div>
        </div>
      )}

      {/* Manual Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
             <div className="bg-surface border-t sm:border border-white/10 w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-fade-in pb-12 sm:pb-6">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="text-white font-bold text-xl">Harcama Ekle</h3>
                     <button onClick={() => setShowManualInput(false)} className="text-gray-400 hover:text-white">
                         <X size={24} />
                     </button>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Tutar</label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                autoFocus
                                required
                                placeholder="0,00" 
                                value={manualAmount}
                                onChange={(e) => setManualAmount(formatTurkishNumber(e.target.value))}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 pl-10 text-white text-2xl font-mono focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Açıklama</label>
                        <input 
                            type="text" 
                            placeholder="Örn: Kahve, Yemek" 
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white text-lg focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        className="w-full bg-primary text-background font-bold py-4 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Check size={20} /> Ekle
                    </button>
                </form>
             </div>
        </div>
      )}
    </>
  );
};

export default VoiceInput;
