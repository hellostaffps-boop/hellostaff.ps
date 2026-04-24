import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getApplicationInternalNotes, createApplicationInternalNote, updateApplicationInternalNote } from "@/lib/supabaseService";

export default function InternalNotesSection({ applicationId, organizationId }) {
  const { t, lang } = useLanguage();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [noteInput, setNoteInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["app-notes", applicationId],
    queryFn: () => getApplicationInternalNotes(applicationId),
    enabled: !!applicationId,
  });

  const createNoteMutation = useMutation({
    mutationFn: () => 
      createApplicationInternalNote(applicationId, organizationId, {
        author_email: user.email,
        author_name: userProfile?.full_name || user.email,
        body: noteInput,
      }),
    onSuccess: () => {
      setNoteInput("");
      queryClient.invalidateQueries({ queryKey: ["app-notes", applicationId] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: () => updateApplicationInternalNote(editingId, { body: editingText }),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["app-notes", applicationId] });
    },
  });

  const isArabic = lang === "ar";

  return (
    <div className={`bg-white rounded-xl border border-border p-4 ${isArabic ? "rtl" : "ltr"}`}>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-accent" />
        <h3 className="font-semibold text-sm">{isArabic ? "ملاحظات داخلية" : "Internal Notes"}</h3>
      </div>

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-secondary/50 rounded-lg p-3 text-xs">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full min-h-20 p-2 border border-border rounded-md text-xs resize-none"
                    placeholder={isArabic ? "حرر الملاحظة..." : "Edit note..."}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateNoteMutation.mutate()}
                      disabled={updateNoteMutation.isPending}
                    >
                      {isArabic ? "حفظ" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      {isArabic ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-1">
                    <span className="font-medium">{note.author_name}</span>
                    <span className="text-muted-foreground ms-2">
                      {note.created_at ? new Date(note.created_at).toLocaleString(
                        isArabic ? "ar-SA" : "en-GB",
                        { dateStyle: "short", timeStyle: "short" }
                      ) : ""}
                    </span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap break-words mb-2">{note.body}</p>
                  {note.author_email === user.email && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditingText(note.body);
                        }}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-4">{isArabic ? "لا توجد ملاحظات حتى الآن" : "No notes yet"}</p>
      )}

      {/* Note input */}
      <div className="space-y-2">
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder={isArabic ? "أضف ملاحظة داخلية..." : "Add an internal note..."}
          className="w-full min-h-20 p-2 border border-border rounded-md text-xs resize-none"
        />
        <Button
          size="sm"
          onClick={() => createNoteMutation.mutate()}
          disabled={!noteInput.trim() || createNoteMutation.isPending}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {createNoteMutation.isPending ? (isArabic ? "جارٍ الإضافة..." : "Adding...") : (isArabic ? "إضافة" : "Add Note")}
        </Button>
      </div>
    </div>
  );
}