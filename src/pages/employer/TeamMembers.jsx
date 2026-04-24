import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Mail, UserPlus, X, Clock, Shield, Crown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate } from "@/lib/uiHelpers";
import { useAuth } from "@/lib/supabaseAuth";
import { getEmployerProfile, getOrganization } from "@/lib/supabaseService";

import {
  getOrganizationMembersForOwner,
  getPendingInvitations,
  requestAddTeamMember,
  cancelTeamInvitation,
  requestRemoveOrganizationMember,
  ORG_ROLE_LABELS,
} from "@/lib/teamService";

const ROLE_BADGE = {
  owner:   "bg-amber-50 text-amber-700 border-amber-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function TeamMembers() {
  const { t, lang: language } = useLanguage();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();


  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");
  const [showInviteForm, setShowInviteForm] = useState(false);

  const roleLabel = (role) =>
    ORG_ROLE_LABELS[language]?.[role] || ORG_ROLE_LABELS.en[role] || role;

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", user?.email],
    queryFn: () => getEmployerProfile(user.email),
    enabled: !!user,
  });

  const orgId = employerProfile?.organization_id;
  const isOwner = userProfile?.role === "employer_owner";

  const { data: org } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  });

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => getOrganizationMembersForOwner(user.email, orgId),
    enabled: !!orgId && isOwner,
  });

  const { data: pendingInvites = [], isLoading: loadingInvites } = useQuery({
    queryKey: ["pending-invitations", orgId],
    queryFn: () => getPendingInvitations(user.email, orgId),
    enabled: !!orgId && isOwner,
  });

  const inviteMutation = useMutation({
    mutationFn: () => requestAddTeamMember(user.email, orgId, inviteEmail, inviteRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations", orgId] });
      toast.success(language === "ar" ? "تمت إضافة الدعوة بنجاح" : "Invitation sent successfully");
      setInviteEmail("");
      setShowInviteForm(false);
    },
    onError: (err) => {
      if (err.message.includes("DUPLICATE")) {
        toast.error(language === "ar" ? "توجد دعوة معلقة لهذا البريد الإلكتروني بالفعل" : "A pending invitation already exists for this email");
      } else {
        toast.error(language === "ar" ? "حدث خطأ أثناء إرسال الدعوة" : "Failed to send invitation");
      }
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId) => cancelTeamInvitation(user.email, orgId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations", orgId] });
      toast.success(language === "ar" ? "تم إلغاء الدعوة" : "Invitation cancelled");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ memberDocId, memberUserId }) =>
      requestRemoveOrganizationMember(user.email, orgId, memberDocId, memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      toast.success(language === "ar" ? "تمت إزالة العضو" : "Member removed");
    },
    onError: () => toast.error(language === "ar" ? "لا يمكن إزالة هذا العضو" : "Cannot remove this member"),
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error(language === "ar" ? "يرجى إدخال البريد الإلكتروني" : "Please enter an email address");
      return;
    }
    inviteMutation.mutate();
  };

  const activeMembers = members.filter((m) => m.status === "active");

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <Shield className="w-10 h-10 text-muted-foreground" />
        <p className="font-medium">
          {language === "ar" ? "هذه الصفحة متاحة لمالك المؤسسة فقط" : "This page is only accessible to organization owners"}
        </p>
      </div>
    );
  }

  const isLoading = loadingMembers || loadingInvites;

  return (
    <div>
      <PageHeader
        title={language === "ar" ? "فريق العمل" : "Team Members"}
        description={org ? (language === "ar" ? `إدارة أعضاء ${org.name}` : `Manage members of ${org.name}`) : ""}
      >
        {isOwner && (
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            onClick={() => setShowInviteForm((v) => !v)}
          >
            <UserPlus className="w-4 h-4" />
            {language === "ar" ? "دعوة عضو" : "Invite Member"}
          </Button>
        )}
      </PageHeader>

      {/* Invite form */}
      {showInviteForm && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h3 className="font-semibold text-sm mb-4">
            {language === "ar" ? "دعوة عضو جديد" : "Invite a New Team Member"}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {language === "ar" ? "البريد الإلكتروني" : "Email Address"}
              </Label>
              <Input
                type="email"
                placeholder={language === "ar" ? "example@email.com" : "colleague@company.com"}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {language === "ar" ? "الدور" : "Role"}
              </Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">{roleLabel("manager")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                size="sm"
                className="h-9"
                onClick={handleInvite}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending
                  ? (language === "ar" ? "جارٍ الإرسال..." : "Sending...")
                  : (language === "ar" ? "إرسال الدعوة" : "Send Invite")}
              </Button>
              <Button size="sm" variant="ghost" className="h-9" onClick={() => setShowInviteForm(false)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {language === "ar"
                ? "سيتم إرسال دعوة معلقة. يمكن للمدعو قبولها عند تسجيل الدخول بنفس البريد الإلكتروني."
                : "A pending invitation will be created. The invitee can accept it upon logging in with the same email."}
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Members */}
          <div>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              {language === "ar" ? "الأعضاء النشطون" : "Active Members"} ({activeMembers.length})
            </h2>
            {activeMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={language === "ar" ? "لا يوجد أعضاء بعد" : "No team members yet"}
                description={language === "ar" ? "ادعُ أعضاء للانضمام إلى فريق عملك" : "Invite members to collaborate on hiring"}
              />
            ) : (
              <div className="space-y-2">
                {activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        {member.role === "owner"
                          ? <Crown className="w-4 h-4 text-amber-600" />
                          : <Users className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {member.user_email || member.user_id}
                          </span>
                          <Badge className={`text-xs border ${ROLE_BADGE[member.role] || "bg-secondary"}`}>
                            {roleLabel(member.role)}
                          </Badge>
                          {member.status !== "active" && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              {member.status}
                            </Badge>
                          )}
                        </div>
                        {member.created_at && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(member.created_at, language)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isOwner && member.role !== "owner" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => removeMemberMutation.mutate({
                          memberDocId: member.id,
                          memberUserId: member.user_id,
                        })}
                        disabled={removeMemberMutation.isPending}
                      >
                        <X className="w-3.5 h-3.5 me-1" />
                        {language === "ar" ? "إزالة" : "Remove"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {pendingInvites.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                {language === "ar" ? "الدعوات المعلقة" : "Pending Invitations"} ({pendingInvites.length})
              </h2>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="bg-secondary/30 rounded-xl border border-border border-dashed p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{invite.invitee_email}</span>
                          <Badge className={`text-xs border ${ROLE_BADGE[invite.role] || "bg-secondary"}`}>
                            {roleLabel(invite.role)}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                            {language === "ar" ? "معلقة" : "Pending"}
                          </Badge>
                        </div>
                        {invite.created_at && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(invite.created_at, language)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => cancelInviteMutation.mutate(invite.id)}
                      disabled={cancelInviteMutation.isPending}
                    >
                      <X className="w-3.5 h-3.5 me-1" />
                      {language === "ar" ? "إلغاء الدعوة" : "Cancel"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}