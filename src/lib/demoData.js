export const IS_DEMO = typeof window !== "undefined" && localStorage.getItem("demo_mode") === "true";

export const DEMO_STATS = {
  jobs: 240,
  candidates: 1250,
  organizations: 85,
};

export const DEMO_CATEGORY_COUNTS = {
  barista: 45,
  chef: 32,
  waiter: 68,
  cashier: 24,
  host: 18,
  cleaner: 12,
  kitchen_helper: 28,
  restaurant_manager: 13,
};

export const DEMO_EMPLOYEES = [
  { profile_id: "demo-1", full_name: "أحمد الخطيب", title: "باريستا محترف", city: "رام الله", average_rating: 5.0, review_count: 12, avatar_url: null },
  { profile_id: "demo-2", full_name: "سارة عوض", title: "شيف معجنات", city: "بيت لحم", average_rating: 4.9, review_count: 8, avatar_url: null },
  { profile_id: "demo-3", full_name: "عمر نصار", title: "نادل أول", city: "نابلس", average_rating: 4.8, review_count: 15, avatar_url: null },
  { profile_id: "demo-4", full_name: "لينا حمدان", title: "مديرة مطعم", city: "الخليل", average_rating: 4.9, review_count: 10, avatar_url: null },
];
