import { useState } from 'react';
import { Settings as SettingsIcon, Key, Brain, Bell, Shield, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState([65]);
  const [alertEmail, setAlertEmail] = useState(true);
  const [alertWebhook, setAlertWebhook] = useState(false);
  const [autoIntervene, setAutoIntervene] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure APIs, model behaviour, and notification preferences.</p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-card/50 border border-border/50 p-1 flex-wrap h-auto gap-1">
          {[
            { v: 'api',    label: 'API Keys' },
            { v: 'model',  label: 'Model Config' },
            { v: 'alerts', label: 'Alerts' },
            { v: 'account',label: 'Account' },
          ].map(t => (
            <TabsTrigger key={t.v} value={t.v} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-4 animate-in fade-in duration-500">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" /> API Configuration
              </CardTitle>
              <CardDescription className="text-xs">Connect Guardian to external services. Keys are encrypted at rest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'Kimi K2.5 (Nvidia API Key)', id: 'kimi', placeholder: 'nvapi-••••••••••••••••••••••••••', badge: 'Connected', badgeClass: 'text-primary border-primary/30' },
                { label: 'Mapbox Access Token', id: 'mapbox', placeholder: 'pk.eyJ1IjoiZ3VhcmRpYW4iLCJh••••••', badge: 'Connected', badgeClass: 'text-primary border-primary/30' },
                { label: 'Appwrite Project ID', id: 'appwrite', placeholder: '674abc••••••••••••', badge: 'Not Set', badgeClass: 'text-muted-foreground border-border/40' },
                { label: 'Backend URL', id: 'backend', placeholder: 'http://localhost:8000', badge: 'Local', badgeClass: 'text-yellow-400 border-yellow-400/30' },
              ].map(field => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</Label>
                    <Badge variant="outline" className={`text-[10px] ${field.badgeClass}`}>{field.badge}</Badge>
                  </div>
                  <div className="relative">
                    <Input id={field.id} type={showApiKey ? 'text' : 'password'} placeholder={field.placeholder}
                      className="bg-card/30 border-border/40 font-mono text-sm pr-10" />
                    <button onClick={() => setShowApiKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full mt-2">
                {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save API Keys</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Config */}
        <TabsContent value="model" className="space-y-4 animate-in fade-in duration-500">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> ML Model Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Risk Alert Threshold</Label>
                  <span className="text-primary font-black font-mono text-sm">{riskThreshold[0]}%</span>
                </div>
                <Slider value={riskThreshold} onValueChange={setRiskThreshold} min={20} max={95} step={5} className="w-full" />
                <p className="text-xs text-muted-foreground">Shipments above this risk score will trigger alerts and intervention recommendations.</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/30">
                {[
                  { label: 'Active Tower', desc: 'XGBoost (Tower 1) — AUC 0.841', badge: 'Active', badgeClass: 'text-primary border-primary/30' },
                  { label: 'Ensemble Mode', desc: 'Combines Tower 1 + Tower 2 (slower, more accurate)', badge: 'Beta', badgeClass: 'text-yellow-400 border-yellow-400/30' },
                  { label: 'MC Dropout Passes', desc: '1,000 forward passes for uncertainty estimation', badge: '1000', badgeClass: 'text-muted-foreground border-border/40' },
                  { label: 'MAPIE Coverage Target', desc: 'Conformal prediction coverage level', badge: '90%', badgeClass: 'text-muted-foreground border-border/40' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${item.badgeClass}`}>{item.badge}</Badge>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Auto-Intervention Mode</div>
                    <div className="text-xs text-muted-foreground">Automatically accept lowest-risk DiCE intervention for CRITICAL shipments.</div>
                  </div>
                  <Switch checked={autoIntervene} onCheckedChange={setAutoIntervene} />
                </div>
              </div>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full">
                {saved ? <><CheckCircle className="w-4 h-4"/>Saved!</> : <><Save className="w-4 h-4"/>Save Model Config</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4 animate-in fade-in duration-500">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'Email Alerts (CRITICAL)',    desc: 'Receive email for shipments with risk ≥ threshold.', state: alertEmail, set: setAlertEmail },
                { label: 'Webhook / Slack',            desc: 'POST alert payload to your webhook URL.', state: alertWebhook, set: setAlertWebhook },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <Switch checked={item.state} onCheckedChange={item.set} />
                </div>
              ))}
              {alertWebhook && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Webhook URL</Label>
                  <Input placeholder="https://hooks.slack.com/..." className="bg-card/30 border-border/40 font-mono text-sm" />
                </div>
              )}
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full mt-2">
                {saved ? <><CheckCircle className="w-4 h-4"/>Saved!</> : <><Save className="w-4 h-4"/>Save Alert Preferences</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="space-y-4 animate-in fade-in duration-500">
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Account & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-lg">OP</div>
                <div>
                  <div className="font-bold">Operator User</div>
                  <div className="text-xs text-muted-foreground">operator@guardian.ai · Admin Role</div>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] text-primary border-primary/30">Admin</Badge>
              </div>
              {[
                { label: 'Display Name', placeholder: 'Operator User' },
                { label: 'Email', placeholder: 'operator@guardian.ai' },
              ].map(f => (
                <div key={f.label} className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</Label>
                  <Input placeholder={f.placeholder} className="bg-card/30 border-border/40 text-sm" />
                </div>
              ))}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</Label>
                <Input type="password" placeholder="••••••••" className="bg-card/30 border-border/40 text-sm" />
              </div>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full">
                {saved ? <><CheckCircle className="w-4 h-4"/>Saved!</> : <><Save className="w-4 h-4"/>Update Account</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
