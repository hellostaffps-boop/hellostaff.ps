import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleEnablePush = async () => {
    import('@/lib/pushNotifications').then(async ({ subscribeToPushNotifications }) => {
      const res = await subscribeToPushNotifications();
      if (res.success) {
        setShowPrompt(false);
      } else {
        alert(res.message);
      }
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-card border border-border shadow-2xl rounded-2xl p-4 z-50 flex items-start gap-4 animate-in slide-in-from-bottom-5">
      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
        <span className="text-primary-foreground font-bold text-xl">H</span>
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-sm mb-1">تطبيق متكامل وتنبيهات</h3>
        
        {isIOS ? (
          <p className="text-xs text-muted-foreground mb-3">
            لتثبيت التطبيق، اضغط على زر المشاركة <Share className="inline w-3 h-3" /> أدناه ثم اختر <strong>"إضافة للشاشة الرئيسية"</strong> للتمكن من استلام الاشعارات.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">
            احصل على تجربة أفضل وأسرع للبحث عن العمل وإدارة التوظيف مع التنبيهات الفورية.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              تثبيت
            </button>
          )}
          <button
            onClick={handleEnablePush}
            className="bg-accent text-accent-foreground text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-accent/90 transition-colors"
          >
            تفعيل الإشعارات
          </button>
          <button
            onClick={handleDismiss}
            className="bg-secondary text-secondary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
          >
            لاحقاً
          </button>
        </div>
      </div>
      
      <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0 p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
