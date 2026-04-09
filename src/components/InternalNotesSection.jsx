import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { getApplicationInternalNotes, createApplicationInternalNote, updateApplicationInternalNote } from "@/lib/firestoreService";
import { useFirebaseAuth } from "@/lib/firebaseAuth";

export default function InternalNotesSection({ applicationId, organizationId }) {
  const { t, lang } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["internal-notes", applicationId],
    queryFn: () => getApplicationInternalNotes(applicationId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newNote.trim()) return;
      await createApplicationInternalNote(applicationId, organizationId, {
        author_email: firebaseUser.email,
        author_name: firebaseUser.displayName || firebaseUser.email,
        body: newNote,
      });
      setNewNote("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-notes", applicationId] });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (noteId) => {
      if (!editText.trim()) return;
      await updateApplicationInternalNote(noteId, { body: editText });
      setEditingId(null);
      setEditText("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-notes", applicationId] });
    },
  });

  if (isLoading) return <div className="py-4 text-sm text-muted-foreground">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</div>;

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h4 className="font-semibold text-sm mb-4">
        {lang === "ar" ? "ملاحظات داخلية (للموظفين فقط)" : "Internal Notes (Staff Only)"}
      </h4>

      {/* Notes list */}
      <div className="space-y-3 mb-4">
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground">{lang === "ar" ? "لا توجد ملاحظات حتى الآن" : "No notes yet"}</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-slate-50 rounded p-3 border border-slate-200 text-sm">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border border-input rounded text-xs"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => editMutation.mutate(note.id)} disabled={editMutation.isPending}>
                      {lang === "ar" ? "حفظ" : "Save"}
                    </Button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:underline">
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 mb-1">{note.body}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{note.author_name} · {new Date(note.created_at?.toDate?.() || note.created_at).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB")}</span>
                    {note.author_email === firebaseUser?.email && (
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditText(note.body);
                        }}
                        className="text-accent hover:underline"
                      >
                        {lang === "ar" ? "تعديل" : "Edit"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* New note input */}
      <div className="border-t border-border pt-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={lang === "ar" ? "أضف ملاحظة..." : "Add a note..."}
          className="w-full p-2 border border-input rounded text-xs mb-2"
          rows="3"
        />
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !newNote.trim()}
          className="w-full gap-2"
        >
          <Send className="w-3 h-3" />
          {lang === "ar" ? "إضافة ملاحظة" : "Add Note"}
        </Button>
      </div>
    </div>
  );
}