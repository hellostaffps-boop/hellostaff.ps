import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getPublishedProducts, createOrder, getUserOrders } from "@/lib/storeService";
import { getPaymentSettings } from "@/lib/subscriptionService";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, Package, Plus, Minus, X, CheckCircle2, ChevronRight, Store as StoreIcon, QrCode, Building2, Wallet, Copy, Download, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Store() {
  const { lang, t } = useLanguage();
  const { userProfile } = useAuth();
  const isAr = lang === "ar";
  
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterTarget, setFilterTarget] = useState("all"); // workers, employers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0); // 0: cart, 1: details, 2: success
  const [checkoutData, setCheckoutData] = useState({ phone: "", address: "", payment: "cash_on_delivery" });
  const [viewingOrders, setViewingOrders] = useState(false);

  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => getPublishedProducts(),
  });

  const { data: userOrders = [] } = useQuery({
    queryKey: ["user-orders", userProfile?.email],
    queryFn: () => getUserOrders(userProfile.email),
    enabled: !!userProfile?.email,
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: getPaymentSettings,
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = filterCategory === "all" || p.sub_category === filterCategory || p.category === filterCategory;
      const matchTarget = filterTarget === "all" || p.target_audience === "all" || p.target_audience === filterTarget;
      return matchCat && matchTarget;
    });
  }, [products, filterCategory, filterTarget]);

  const orderMutation = useMutation({
    mutationFn: (data) => createOrder(userProfile?.email || "guest@example.com", data, cartItems),
    onSuccess: () => {
      clearCart();
      setCheckoutStep(2);
    }
  });

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    orderMutation.mutate({
      totalAmount,
      paymentMethod: checkoutData.payment,
      shippingAddress: checkoutData.address,
      phoneNumber: checkoutData.phone
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-24" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-primary pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center relative">
          <StoreIcon className="w-12 h-12 text-primary-foreground/80 mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground tracking-tight mb-4">
            {t("store", "title")}
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg mb-8">
            {t("store", "description")}
          </p>

          <div className="absolute top-0 right-0 flex gap-2">
            <Button 
              variant="outline"
              asChild
              className="gap-2 bg-white/10 text-primary-foreground hover:bg-white/20 border-white/20 shadow-lg"
            >
              <Link to="/my-orders">
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline">طلباتي</span>
              </Link>
            </Button>
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="gap-2 bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold">{cartItems.reduce((a,c)=>a+c.quantity,0)}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        
        {/* Filters */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button variant={filterTarget === "all" ? "default" : "outline"} onClick={() => setFilterTarget("all")} size="sm">
              {t("store", "all")}
            </Button>
            <Button variant={filterTarget === "workers" ? "default" : "outline"} onClick={() => setFilterTarget("workers")} size="sm">
              {t("store", "forWorkers")}
            </Button>
            <Button variant={filterTarget === "employers" ? "default" : "outline"} onClick={() => setFilterTarget("employers")} size="sm">
              {t("store", "forEmployers")}
            </Button>
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">{t("store", "allCategories")}</option>
              <option value="barista">{t("store", "barista")}</option>
              <option value="chef">{t("store", "chef")}</option>
              <option value="management">{t("store", "management")}</option>
              <option value="equipment">{t("store", "equipment")}</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("store", "noProducts")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="card-premium hover-lift rounded-xl overflow-hidden group flex flex-col">
                <div className="h-48 bg-secondary relative overflow-hidden">
                  {product.media_url ? (
                    <img src={product.media_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Package className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-primary font-bold px-3 py-1.5 rounded-full shadow-sm">
                    ₪{product.price}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                    <span className="capitalize">{product.category === 'digital' ? t("store", "digital") : t("store", "physical")}</span>
                    <span>•</span>
                    <span className="capitalize">{product.sub_category}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">
                    {isAr ? product.title_ar || product.title : product.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {isAr ? product.description_ar || product.description : product.description}
                  </p>
                  
                  <Button 
                    className="w-full mt-4 gap-2" 
                    onClick={() => { addToCart(product); setIsCartOpen(true); }}
                  >
                    <Plus className="w-4 h-4" /> {t("store", "addToCart")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Modal / Slide-over */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="w-full max-w-md bg-background h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right sm:border-l border-border">
            
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> {t("store", "cartTitle")}
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-secondary rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {checkoutStep === 0 && (
                <>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>{t("store", "emptyCart")}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex gap-4">
                          {item.media_url ? (
                            <img src={item.media_url} className="w-16 h-16 rounded-xl object-cover" alt="" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm line-clamp-2">{isAr ? item.title_ar || item.title : item.title}</h4>
                            <div className="text-emerald-600 font-bold text-sm mt-1">₪{item.price}</div>
                            <div className="flex items-center gap-3 mt-2">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-secondary rounded-md hover:bg-secondary/80">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-secondary rounded-md hover:bg-secondary/80">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {checkoutStep === 1 && (
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-6">
                    <p className="text-sm text-primary font-medium flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" /> 
                      {t("store", "paymentOptions")}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {t("store", "paymentOptionsDesc")}
                    </p>
                    
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checkoutData.payment === 'cash_on_delivery' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                        <input type="radio" name="payment" value="cash_on_delivery" checked={checkoutData.payment === 'cash_on_delivery'} onChange={e=>setCheckoutData({...checkoutData, payment: e.target.value})} className="hidden" />
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{t("store", "cod")}</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checkoutData.payment === 'direct_transfer' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                        <input type="radio" name="payment" value="direct_transfer" checked={checkoutData.payment === 'direct_transfer'} onChange={e=>setCheckoutData({...checkoutData, payment: e.target.value})} className="hidden" />
                        <QrCode className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{t("store", "transfer")}</span>
                      </label>
                    </div>
                  </div>

                  {checkoutData.payment === 'direct_transfer' && paymentSettings && (
                    <div className="bg-muted/50 p-4 rounded-xl border border-border mb-6 space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <QrCode className="w-4 h-4" /> {t("store", "paymentDetails")}
                      </h4>
                      {paymentSettings.qr_code_url && (
                        <img src={paymentSettings.qr_code_url} className="w-32 h-32 mx-auto bg-white p-2 rounded-lg border border-border" alt="QR" />
                      )}
                      <div className="space-y-2">
                        {paymentSettings.bank_name && <InfoItem label={t("store", "bank")} value={paymentSettings.bank_name} />}
                        {paymentSettings.wallet_number && <InfoItem label={t("store", "wallet")} value={paymentSettings.wallet_number} copyable />}
                      </div>
                      <p className="text-[10px] text-muted-foreground italic text-center">
                        {t("store", "paymentHint")}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>{t("store", "phone")}</Label>
                    <Input required value={checkoutData.phone} onChange={e=>setCheckoutData({...checkoutData, phone: e.target.value})} placeholder="+970 5..." />
                  </div>
                  <div>
                    <Label>{t("store", "address")}</Label>
                    <textarea required className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={checkoutData.address} onChange={e=>setCheckoutData({...checkoutData, address: e.target.value})} placeholder={t("store", "addressPlaceholder")} />
                  </div>
                </form>
              )}

              {checkoutStep === 2 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t("store", "orderSuccess")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("store", "orderSuccessDesc")}
                  </p>
                  <Button className="mt-8 w-full" onClick={() => { setIsCartOpen(false); setCheckoutStep(0); }}>
                    {t("common", "close")}
                  </Button>
                </div>
              )}
            </div>

            {checkoutStep < 2 && cartItems.length > 0 && (
              <div className="p-6 border-t border-border bg-card">
                <div className="flex justify-between items-center mb-4 text-lg font-bold">
                  <span>{t("store", "total")}</span>
                  <span>₪{totalAmount.toFixed(2)}</span>
                </div>
                {checkoutStep === 0 ? (
                  <Button className="w-full gap-2" size="lg" onClick={() => {
                    if (!userProfile) return alert(isAr ? "الرجاء تسجيل الدخول أولاً" : "Please login first");
                    setCheckoutStep(1);
                  }}>
                    {t("store", "proceed")} <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setCheckoutStep(0)}>
                      {t("common", "back")}
                    </Button>
                    <Button className="flex-[2]" form="checkout-form" type="submit" disabled={orderMutation.isPending}>
                      {orderMutation.isPending ? "..." : t("store", "confirmOrder")}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      )}
      {/* Orders List / Downloads */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> {t("store", "myOrders")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {userOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
              {t("store", "noOrders")}
            </div>
          ) : (
            userOrders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-bold">#{order.id.slice(0,8)}</div>
                    <div className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString(isAr?'ar':'en')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {t("store", order.status)}
                    </span>
                  </div>
                  <div className="text-xl font-black text-primary">₪{order.total_amount}</div>
                </div>

                <div className="space-y-3">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-secondary/20 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{isAr ? item.product?.title_ar || item.product?.title : item.product?.title}</span>
                      </div>
                      
                      {item.product?.category === 'digital' && (
                        <div>
                          {order.digital_released ? (
                            <Button size="sm" variant="outline" className="gap-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" asChild>
                              <a href={item.product.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" /> {t("store", "downloadFile")}
                              </a>
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                              <Clock className="w-3 h-3" /> {t("store", "awaitingLink")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

function ShoppingBag(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function InfoItem({ label, value, copyable }) {
  return (
    <div className="flex items-center justify-between text-xs p-2 bg-white rounded border border-border">
      <div>
        <span className="text-muted-foreground block text-[10px]">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      {copyable && (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Copied!");
        }}>
          <Copy className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
