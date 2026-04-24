import { useQuery } from "@tanstack/react-query";
import { getActiveSubscription } from "@/lib/subscriptionService";
import { useAuth } from "@/lib/supabaseAuth";
import { getEmployerProfile } from "@/lib/supabaseService";

/**
 * useSubscription hook
 * Checks if the current organization has an active subscription.
 */
export function useSubscription() {
  const { user, userProfile } = useAuth();
  
  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile-sub", user?.email],
    queryFn: () => getEmployerProfile(user.email),
    enabled: !!user && (userProfile?.role === "employer_owner" || userProfile?.role === "employer_manager"),
  });

  const orgId = employerProfile?.organization_id;

  const { data: activeSub, isLoading } = useQuery({
    queryKey: ["active-subscription", orgId],
    queryFn: () => getActiveSubscription(orgId),
    enabled: !!orgId,
  });

  return {
    activeSub,
    isSubscribed: !!activeSub,
    isPremium: activeSub?.plan === "premium" || activeSub?.plan === "annual",
    isLoading
  };
}
