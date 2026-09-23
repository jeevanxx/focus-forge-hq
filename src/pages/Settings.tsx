import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings as SettingsIcon, Target, User, KeyRound, BellRing, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Section = ({ icon: Icon, title, description, children }: {
  icon: any; title: string; description: string; children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border bg-gradient-card shadow-soft p-5 lg:p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 grid place-items-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const Settings = () => {
  const { user, signOut } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { sessions } = useFocusSessions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [focusGoal, setFocusGoal] = useState("180");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setFocusGoal(String(profile.focusGoalMin));
    }
  }, [profile]);

  const isGoogleUser = user?.app_metadata?.provider === "google"
    || user?.identities?.some((i) => i.provider === "google");

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        focusGoalMin: Math.max(15, Number(focusGoal) || 180),
      });
      toast({ title: "Settings saved" });
    } catch (err) {
      toast({ title: "Could not save settings", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Could not change password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated" });
    setCurrentPassword(""); setNewPassword("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="px-5 lg:px-12 py-8 lg:py-12 max-w-[760px] mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-bold">Account</span>
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight flex items-center gap-3">
          Settings <SettingsIcon className="h-7 w-7 text-muted-foreground" />
        </h1>
      </div>

      <div className="space-y-4">
        <Section icon={User} title="Profile" description={user?.email ?? ""}>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focus-goal">Daily focus goal (minutes)</Label>
              <Input
                id="focus-goal"
                type="number"
                min={15}
                step={15}
                value={focusGoal}
                onChange={(e) => setFocusGoal(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Used for the progress ring on your dashboard.
              </p>
            </div>
            <Button type="submit" disabled={savingProfile || isLoading} className="bg-gradient-ember text-primary-foreground shadow-ember font-semibold">
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Section>

        <Section icon={KeyRound} title="Password" description={isGoogleUser ? "You signed up with Google — password change is only for email accounts." : "Change your sign-in password."}>
          {isGoogleUser ? (
            <p className="text-sm text-muted-foreground">
              Your account uses Google sign-in, so there's no password to change here.
            </p>
          ) : (
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={savingPassword} variant="outline" className="font-semibold">
                {savingPassword ? "Updating…" : "Change password"}
              </Button>
            </form>
          )}
        </Section>

        <Section icon={LogOut} title="Session" description="Sign out of Focus Forge on this device.">
          <Button onClick={handleSignOut} variant="outline" className="font-semibold text-destructive border-destructive/40 hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </Section>
      </div>
    </div>
  );
};

export default Settings;
