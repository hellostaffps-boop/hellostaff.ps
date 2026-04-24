import { supabase } from "@/lib/supabaseClient";

export const getPublishedProducts = async ({ category = null, subCategory = null } = {}) => {
  let query = supabase.from("store_products").select("*").eq("is_published", true).order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  if (subCategory) query = query.eq("sub_category", subCategory);
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getProductById = async (id) => {
  const { data, error } = await supabase.from("store_products").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};

export const createOrder = async (userEmail, orderData, items) => {
  const { data: order, error: orderErr } = await supabase
    .from("store_orders")
    .insert([{
      user_email: userEmail,
      total_amount: orderData.totalAmount,
      payment_method: orderData.paymentMethod || 'cash_on_delivery',
      shipping_address: orderData.shippingAddress || null,
      phone_number: orderData.phoneNumber || null,
      status: 'pending'
    }])
    .select()
    .single();

  if (orderErr) throw orderErr;

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity,
    unit_price: item.price
  }));

  const { error: itemsErr } = await supabase.from("store_order_items").insert(orderItems);
  if (itemsErr) throw itemsErr;

  return order;
};

export const getUserOrders = async (userEmail) => {
  const { data, error } = await supabase
    .from("store_orders")
    .select(`
      *,
      items:store_order_items (
        *,
        product:store_products (*)
      )
    `)
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};
