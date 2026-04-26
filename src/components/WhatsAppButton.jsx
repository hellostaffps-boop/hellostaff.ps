import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function WhatsAppButton({ phoneNumber, message = "", className = "" }) {
  const { lang } = useLanguage();
  
  if (!phoneNumber) return null;

  // Clean the phone number (remove any spaces, dashes, or non-numeric chars except +)
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  const whatsappUrl = `https://wa.me/${cleanNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-md transition-colors ${className}`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {lang === "ar" ? "تواصل واتساب" : "WhatsApp"}
    </a>
  );
}
