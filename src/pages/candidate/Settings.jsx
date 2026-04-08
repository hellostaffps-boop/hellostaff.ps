import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PageHeader from "../../components/PageHeader";

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your account preferences" />

      <div className="max-w-2xl space-y-8">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-base mb-5">Account</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Email</Label>
              <Input disabled placeholder="your@email.com" className="mt-1.5 bg-secondary/50" />
            </div>
            <div>
              <Label className="text-sm">Full Name</Label>
              <Input placeholder="Your name" className="mt-1.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-base mb-5">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Email Notifications</div>
                <div className="text-xs text-muted-foreground">Receive updates about your applications</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Job Alerts</div>
                <div className="text-xs text-muted-foreground">Get notified about new matching jobs</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Marketing Emails</div>
                <div className="text-xs text-muted-foreground">Tips and platform news</div>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-destructive/20 p-6">
          <h2 className="font-semibold text-base mb-2 text-destructive">Danger Zone</h2>
          <p className="text-xs text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
          <Button variant="destructive" size="sm">Delete Account</Button>
        </div>
      </div>
    </div>
  );
}