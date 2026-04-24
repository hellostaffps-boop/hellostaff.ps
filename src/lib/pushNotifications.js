import { supabase } from "./supabaseClient";

// VAPID Public Key for Web Push Subscriptions
const VAPID_PUBLIC_KEY = "BEfDH9JxK_6JHOJYrF9mij6IGdK9PND-JwN4vr3Jn2-YOetDpWq603Ai2_3zHbsT9EUE1pZaIVnuZL-vv4MbODs";

/**
 * Utility to convert base64 to Uint8Array for push subscription
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission and subscribe to Push
 * Returns { success, message, subscription }
 */
export async function subscribeToPushNotifications() {
  if (!("serviceWorker" in navigator)) {
    return { success: false, message: "Service Worker not supported in this browser." };
  }

  if (!("PushManager" in window)) {
    return { success: false, message: "Push Notifications not supported." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, message: "Notification permission denied." };
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      return { success: false, message: "Service Worker not ready." };
    }

    // Subscribe
    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };

    const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);

    // Save subscription to the current user's profile in Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
        // Save to DB
        const { error } = await supabase
            .from("profiles")
            .update({ push_subscription: JSON.parse(JSON.stringify(pushSubscription)) })
            .eq("id", session.user.id);
            
        if (error) {
            console.error("Failed to save push subscription to DB:", error);
            // Even if save fails, we subscribed successfully in browser
        }
    }

    return { 
        success: true, 
        message: "Successfully subscribed to push notifications.", 
        subscription: pushSubscription 
    };

  } catch (error) {
    console.error("Push subscription error:", error);
    return { success: false, message: error.message };
  }
}
