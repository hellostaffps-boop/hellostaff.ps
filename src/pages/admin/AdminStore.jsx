import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/supabaseAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { getAdminProductsSafe, upsertAdminProduct, deleteAdminProduct, getAdminOrdersSafe, updateStoreOrderStatus } from "@/lib/adminService";
import { uploadFile } from "@/lib/storageService";
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Package, UploadCloud, ShoppingBag, Eye, Check, X, Truck, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminStore() {
  const { userProfile } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("products"); // products, orders
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getAdminProductsSafe(userProfile),
    enabled: !!userProfile && userProfile.role === "platform_admin",
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => getAdminOrdersSafe(userProfile),
    enabled: !!userProfile && userProfile.role === "platform_admin",
  });

  const upsertMutation = useMutation({
    mutationFn: (data) => upsertAdminProduct(userProfile, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-products"]);
      setIsEditing(false);
      setCurrentProduct(null);
      toast.success(isAr ? "تم حفظ المنتج" : "Product saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminProduct(userProfile, id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-products"]);
      toast.success(isAr ? "تم حذف المنتج" : "Product deleted");
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, updates }) => updateStoreOrderStatus(userProfile, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-orders"]);
      setSelectedOrder(null);
      toast.success(isAr ? "تم تحديث الطلب" : "Order updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEdit = (product = null) => {
    setCurrentProduct(product || {
      title: "", title_ar: "", description: "", description_ar: "",
      price: 0, category: "digital", sub_category: "barista", target_audience: "all", 
      media_url: "", file_url: "", is_published: true, stock_quantity: -1
    });
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    upsertMutation.mutate(currentProduct);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingField(field);
      const { file_url } = await uploadFile(file, "store");
      setCurrentProduct({ ...currentProduct, [field]: file_url });
    } catch (err) {
      console.error(err);
      alert(isAr ? "فشل رفع الملف. يرجى المحاولة مرة أخرى." : "File upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  if (productsLoading || ordersLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "إدارة المتجر" : "Store Management"}</h1>
          <p className="text-muted-foreground">{isAr ? "إدارة المنتجات الرقمية والمادية والطلبات" : "Manage products and orders"}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === "products" ? "default" : "outline"} 
            onClick={() => setActiveTab("products")}
            className="gap-2"
          >
            <Package className="w-4 h-4" /> {isAr ? "المنتجات" : "Products"}
          </Button>
          <Button 
            variant={activeTab === "orders" ? "default" : "outline"} 
            onClick={() => setActiveTab("orders")}
            className="gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> {isAr ? "الطلبات" : "Orders"}
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {activeTab === "products" ? (
        <>
          <div className="flex justify-end">
            <Button onClick={() => handleEdit()} className="gap-2">
              <Plus className="w-4 h-4" /> {isAr ? "إضافة منتج" : "Add Product"}
            </Button>
          </div>

          {isEditing ? (
            <div className="bg-card border border-border p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">{currentProduct.id ? (isAr ? "تعديل المنتج" : "Edit Product") : (isAr ? "منتج جديد" : "New Product")}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{isAr ? "الاسم (إنجليزي)" : "Title (EN)"}</Label>
                    <Input value={currentProduct.title} onChange={e => setCurrentProduct({...currentProduct, title: e.target.value})} required />
                  </div>
                  <div>
                    <Label>{isAr ? "الاسم (عربي)" : "Title (AR)"}</Label>
                    <Input value={currentProduct.title_ar} onChange={e => setCurrentProduct({...currentProduct, title_ar: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label>{isAr ? "السعر (₪)" : "Price (₪)"}</Label>
                    <Input type="number" step="0.01" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value) || 0})} required />
                  </div>
                  <div>
                    <Label>{isAr ? "الكمية (-1 للمنتجات الرقمية)" : "Stock (-1 for digital)"}</Label>
                    <Input type="number" value={currentProduct.stock_quantity} onChange={e => setCurrentProduct({...currentProduct, stock_quantity: parseInt(e.target.value) || -1})} />
                  </div>

                  <div>
                    <Label>{isAr ? "النوع" : "Category"}</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}>
                      <option value="digital">{isAr ? "رقمي (كورسات/PDF)" : "Digital"}</option>
                      <option value="physical">{isAr ? "مادي (أدوات/معدات)" : "Physical"}</option>
                    </select>
                  </div>
                  <div>
                    <Label>{isAr ? "الجمهور المستهدف" : "Target Audience"}</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={currentProduct.target_audience} onChange={e => setCurrentProduct({...currentProduct, target_audience: e.target.value})}>
                      <option value="all">{isAr ? "الجميع" : "All"}</option>
                      <option value="workers">{isAr ? "الموظفين" : "Workers"}</option>
                      <option value="employers">{isAr ? "أصحاب العمل (المقاهي)" : "Employers"}</option>
                    </select>
                  </div>

                  <div>
                    <Label>{isAr ? "التصنيف الفرعي" : "Sub Category"}</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={currentProduct.sub_category} onChange={e => setCurrentProduct({...currentProduct, sub_category: e.target.value})}>
                      <option value="barista">{isAr ? "باريستا" : "Barista"}</option>
                      <option value="chef">{isAr ? "شيف" : "Chef"}</option>
                      <option value="management">{isAr ? "إدارة المقاهي" : "Cafe Management"}</option>
                      <option value="equipment">{isAr ? "معدات وأدوات" : "Equipment"}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input type="checkbox" id="published" checked={currentProduct.is_published} onChange={e => setCurrentProduct({...currentProduct, is_published: e.target.checked})} className="w-4 h-4" />
                    <Label htmlFor="published">{isAr ? "متاح في المتجر" : "Published"}</Label>
                  </div>

                  <div className="sm:col-span-2">
                    <Label>{isAr ? "الوصف (إنجليزي)" : "Description (EN)"}</Label>
                    <Input value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{isAr ? "الوصف (عربي)" : "Description (AR)"}</Label>
                    <Input value={currentProduct.description_ar} onChange={e => setCurrentProduct({...currentProduct, description_ar: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{isAr ? "صورة المنتج (الغلاف)" : "Product Image"}</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input value={currentProduct.media_url} onChange={e => setCurrentProduct({...currentProduct, media_url: e.target.value})} placeholder={isAr ? "رابط الصورة أو ارفعها هنا..." : "Image URL or upload here..."} className="flex-1" />
                      <label className="flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 px-4 rounded-md cursor-pointer whitespace-nowrap transition-colors">
                        {uploadingField === 'media_url' ? <span className="animate-pulse">{isAr ? "جاري الرفع..." : "Uploading..."}</span> : <><UploadCloud className="w-4 h-4 mr-2 ml-2" /> {isAr ? "رفع صورة" : "Upload Image"}</>}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'media_url')} disabled={!!uploadingField} />
                      </label>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{isAr ? "ملف المنتج (للشراء الرقمي PDF/Slides)" : "Digital File (PDF/Slides)"}</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input value={currentProduct.file_url} onChange={e => setCurrentProduct({...currentProduct, file_url: e.target.value})} placeholder={isAr ? "رابط الملف أو ارفعه هنا..." : "File URL or upload here..."} className="flex-1" />
                      <label className="flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 px-4 rounded-md cursor-pointer whitespace-nowrap transition-colors">
                        {uploadingField === 'file_url' ? <span className="animate-pulse">{isAr ? "جاري الرفع..." : "Uploading..."}</span> : <><UploadCloud className="w-4 h-4 mr-2 ml-2" /> {isAr ? "رفع ملف" : "Upload File"}</>}
                        <input type="file" accept=".pdf,.ppt,.pptx,.zip" className="hidden" onChange={(e) => handleFileUpload(e, 'file_url')} disabled={!!uploadingField} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                  <Button type="submit" disabled={upsertMutation.isPending}>{isAr ? "حفظ" : "Save"}</Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-medium">{isAr ? "المنتج" : "Product"}</th>
                      <th className="px-6 py-3 font-medium">{isAr ? "السعر" : "Price"}</th>
                      <th className="px-6 py-3 font-medium">{isAr ? "القسم" : "Category"}</th>
                      <th className="px-6 py-3 font-medium text-center">{isAr ? "الحالة" : "Status"}</th>
                      <th className="px-6 py-3 font-medium text-right">{isAr ? "إجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          {product.media_url ? (
                            <img src={product.media_url} className="w-10 h-10 rounded object-cover" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground"/></div>
                          )}
                          <div className="font-medium">{product.title}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">₪{product.price}</td>
                        <td className="px-6 py-4 capitalize">{product.sub_category} ({product.target_audience})</td>
                        <td className="px-6 py-4 text-center">
                          {product.is_published 
                            ? <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs"><CheckCircle2 className="w-3 h-3"/> {isAr ? "متاح" : "Published"}</span>
                            : <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs"><XCircle className="w-3 h-3"/> {isAr ? "مخفي" : "Draft"}</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 space-x-reverse">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(product.id) }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">{isAr ? "لا يوجد منتجات حالياً." : "No products found."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">{isAr ? "الطلب" : "Order"}</th>
                    <th className="px-6 py-3 font-medium">{isAr ? "المشتري" : "Buyer"}</th>
                    <th className="px-6 py-3 font-medium">{isAr ? "التفاصيل" : "Details"}</th>
                    <th className="px-6 py-3 font-medium">{isAr ? "الحالة" : "Status"}</th>
                    <th className="px-6 py-3 font-medium text-right">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-xs uppercase text-muted-foreground">#{order.id.slice(0,8)}</div>
                        <div className="text-xs">{new Date(order.created_at).toLocaleString(isAr ? 'ar' : 'en')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{order.user_email}</div>
                        <div className="text-xs text-muted-foreground">{order.phone_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-600">₪{order.total_amount}</div>
                        <div className="text-xs text-muted-foreground capitalize">{order.payment_method}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {isAr ? {
                            pending: 'بانتظار الدفع/المراجعة',
                            processing: 'قيد التجهيز',
                            completed: 'تم التسليم',
                            cancelled: 'ملغي'
                          }[order.status] : order.status}
                        </span>
                        {order.digital_released && (
                          <div className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> {isAr ? "تم إرسال الروابط" : "Links Released"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4" /> {isAr ? "عرض" : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد طلبات حالياً." : "No orders found."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{isAr ? "تفاصيل الطلب" : "Order Details"} #{selectedOrder.id.slice(0,8)}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{isAr ? "معلومات المشتري" : "Buyer Info"}</Label>
                  <p className="font-medium">{selectedOrder.user_email}</p>
                  <p className="text-sm">{selectedOrder.phone_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{isAr ? "عنوان الشحن" : "Shipping Address"}</Label>
                  <p className="text-sm bg-secondary/50 p-3 rounded-lg border border-border">{selectedOrder.shipping_address || (isAr ? "لا يوجد عنوان" : "No address provided")}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{isAr ? "طريقة الدفع" : "Payment Method"}</Label>
                  <p className="font-bold text-accent uppercase">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{isAr ? "إجمالي المبلغ" : "Total Amount"}</Label>
                  <p className="text-2xl font-black text-emerald-600">₪{selectedOrder.total_amount}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <Label className="text-xs text-muted-foreground mb-2 block">{isAr ? "المنتجات" : "Products"}</Label>
              <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                {selectedOrder.items?.map(item => (
                  <div key={item.id} className="p-3 flex items-center justify-between bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                        {item.product?.media_url ? <img src={item.product.media_url} className="w-full h-full object-cover rounded" /> : <Package className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{isAr ? item.product?.title_ar || item.product?.title : item.product?.title}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{item.product?.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">₪{item.unit_price} x {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              {/* Approval Actions */}
              {selectedOrder.status !== 'completed' && (
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  onClick={() => updateOrderMutation.mutate({ id: selectedOrder.id, updates: { status: 'completed', digitalReleased: true } })}
                  disabled={updateOrderMutation.isPending}
                >
                  <Check className="w-4 h-4" /> {isAr ? "موافقة وتفعيل الروابط/شحن" : "Approve & Ship/Release"}
                </Button>
              )}
              
              {selectedOrder.status === 'pending' && (
                <Button 
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2"
                  onClick={() => updateOrderMutation.mutate({ id: selectedOrder.id, updates: { status: 'processing' } })}
                  disabled={updateOrderMutation.isPending}
                >
                  <Truck className="w-4 h-4" /> {isAr ? "بدء التجهيز" : "Mark as Processing"}
                </Button>
              )}

              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={() => { if(confirm("Reject this order?")) updateOrderMutation.mutate({ id: selectedOrder.id, updates: { status: 'cancelled' } }) }}
                  disabled={updateOrderMutation.isPending}
                >
                  <X className="w-4 h-4" /> {isAr ? "رفض الطلب" : "Reject Order"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
