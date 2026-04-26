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
  if (!userEmail || !items?.length) throw new Error("Missing userEmail or items");
  
  // SECURITY FIX: Verify prices from server, do not trust client-side prices
  const productIds = items.map(item => item.id);
  const { data: products, error: productsErr } = await supabase
    .from("store_products")
    .select("id, price, is_published")
    .in("id", productIds);
  if (productsErr) throw productsErr;
  
  const productMap = new Map((products || []).map(p => [p.id, p]));
  
  // Validate each item
  let serverTotal = 0;
  const validatedItems = items.map(item => {
    const product = productMap.get(item.id);
    if (!product) throw new Error(`Product ${item.id} not found`);
    if (!product.is_published) throw new Error(`Product ${item.id} is not available`);
    if (item.quantity < 1) throw new Error("Invalid quantity");
    const unitPrice = product.price; // Use SERVER price, not client price
    serverTotal += unitPrice * item.quantity;
    return {
      order_id: null, // will be set after order creation
      product_id: item.id,
      quantity: item.quantity,
      unit_price: unitPrice
    };
  });
  
  // Verify total amount matches server-calculated total
  if (Math.abs(serverTotal - (orderData.totalAmount || 0)) > 0.01) {
    throw new Error("Order total amount mismatch. Prices may have changed.");
  }

  const { data: order, error: orderErr } = await supabase
    .from("store_orders")
    .insert([{
      user_email: userEmail,
      total_amount: serverTotal,
      payment_method: orderData.paymentMethod || 'cash_on_delivery',
      shipping_address: orderData.shippingAddress || null,
      phone_number: orderData.phoneNumber || null,
      status: 'pending'
    }])
    .select()
    .single();

  if (orderErr) throw orderErr;

  // Set order_id for each item
  const orderItems = validatedItems.map(item => ({
    ...item,
    order_id: order.id
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
