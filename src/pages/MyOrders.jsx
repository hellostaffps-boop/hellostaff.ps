import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/supabaseAuth";
import { getMyOrders } from "@/lib/services/miscService";
import { useLanguage } from "@/hooks/useLanguage";
import { ShoppingBag, Package, Download, Clock, CheckCircle2, XCircle, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STATUS_CONFIG = {
  pending:    { label_ar: "قيد الانتظار",  label_en: "Pending",    icon: Clock,         className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  processing: { label_ar: "جاري المعالجة", label_en: "Processing", icon: Loader2,        className: "bg-blue-100 text-blue-800 border-blue-200" },
  completed:  { label_ar: "مكتمل",          label_en: "Completed",  icon: CheckCircle2,  className: "bg-green-100 text-green-800 border-green-200" },
  cancelled:  { label_ar: "ملغى",           label_en: "Cancelled",  icon: XCircle,       className: "bg-red-100 text-red-800 border-red-200" },
};

function OrderStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label_ar}
    </span>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.created_at).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Card className="border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md overflow-hidden">
      {/* Header */}
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{date}</p>
              <p className="font-semibold text-sm mt-0.5">طلب #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <span className="text-sm text-muted-foreground">
            {order.items?.length || 0} منتج
          </span>
          <span className="font-bold text-primary text-lg">
            {order.total_amount} ₪
          </span>
        </div>
      </CardHeader>

      {/* Expanded items */}
      {expanded && (
        <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-200">
          <Separator className="mb-4" />
          <div className="space-y-3">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">
                      {item.product?.title_ar || item.product?.title || "منتج"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      الكمية: {item.quantity} × {item.unit_price} ₪
                    </p>
                  </div>
                </div>

                {/* Download button for digital products */}
                {item.product?.category === "digital" && (
                  order.digital_released && item.product?.file_url && item.product.file_url !== "#" ? (
                    <a
                      href={item.product.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      تحميل
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs border border-border/50">
                      <Clock className="w-3.5 h-3.5" />
                      في انتظار التفعيل
                    </span>
                  )
                )}
              </div>
            ))}
          </div>

          {/* Shipping info if physical */}
          {order.shipping_address && (
            <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-border/20">
              <p className="text-xs text-muted-foreground mb-1">عنوان التوصيل</p>
              <p className="text-sm">{order.shipping_address}</p>
              {order.phone_number && (
                <p className="text-sm text-muted-foreground mt-1 font-mono">{order.phone_number}</p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function MyOrdersPage() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.email) return;
    getMyOrders(userProfile.email)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [userProfile?.email]);

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/store" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold">طلباتي وتنزيلاتي</h1>
            <p className="text-xs text-muted-foreground">تتبع طلباتك وتحميل ملفاتك الرقمية</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">جاري تحميل الطلبات...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">لا توجد طلبات بعد</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                لم تقم بأي عمليات شراء حتى الآن. استكشف متجرنا وابدأ التسوق!
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link to="/store">تصفح المتجر</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {orders.length} {orders.length === 1 ? "طلب" : "طلبات"}
              </p>
            </div>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
