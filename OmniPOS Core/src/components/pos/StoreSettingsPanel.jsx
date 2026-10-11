import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Plus, Trash2, Store, Phone, MapPin, Percent, DollarSign, MessageSquare } from "lucide-react";
import { DEFAULT_SETTINGS, invalidateSettingsCache } from "./useStoreSettings";

export default function StoreSettingsPanel() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.StoreSettings.list().then(list => {
      if (list.length > 0) {
        setSettings({ ...DEFAULT_SETTINGS, ...list[0] });
        setSettingsId(list[0].id);
      }
      setLoading(false);
    });
  }, []);

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await base44.entities.StoreSettings.update(settingsId, settings);
    } else {
      const created = await base44.entities.StoreSettings.create(settings);
      setSettingsId(created.id);
    }
    invalidateSettingsCache();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Tax helpers
  const addTax = () => set("taxes", [...(settings.taxes || []), { name: "New Tax", rate: 0, enabled: true }]);
  const updateTax = (i, field, val) => {
    const taxes = [...(settings.taxes || [])];
    taxes[i] = { ...taxes[i], [field]: field === "rate" ? parseFloat(val) || 0 : val };
    set("taxes", taxes);
  };
  const removeTax = (i) => set("taxes", (settings.taxes || []).filter((_, idx) => idx !== i));

  // Tip helpers
  const addTip = () => set("tip_options", [...(settings.tip_options || []), 0]);
  const updateTip = (i, val) => {
    const tips = [...(settings.tip_options || [])];
    tips[i] = parseFloat(val) || 0;
    set("tip_options", tips);
  };
  const removeTip = (i) => set("tip_options", (settings.tip_options || []).filter((_, idx) => idx !== i));

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading settings...</div>;

  const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-green-400" />
        <div className="text-white font-semibold text-sm">{title}</div>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }) => (
    <div>
      <label className="text-gray-500 text-xs font-mono block mb-1">{label}</label>
      {children}
    </div>
  );

  const Input = ({ value, onChange, placeholder, type = "text" }) => (
    <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500 transition" />
  );

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Store Info */}
        <Section icon={Store} title="Store Information">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Store Name">
              <Input value={settings.store_name} onChange={v => set("store_name", v)} placeholder="RetailOS Store" />
            </Field>
            <Field label="Store ID">
              <Input value={settings.store_id} onChange={v => set("store_id", v)} placeholder="1024" />
            </Field>
            <Field label="Terminal ID">
              <Input value={settings.terminal_id} onChange={v => set("terminal_id", v)} placeholder="LANE-3" />
            </Field>
            <Field label="Currency Symbol">
              <Input value={settings.currency_symbol} onChange={v => set("currency_symbol", v)} placeholder="$" />
            </Field>
          </div>
        </Section>

        {/* Contact */}
        <Section icon={MapPin} title="Contact & Location">
          <Field label="Street Address">
            <Input value={settings.address} onChange={v => set("address", v)} placeholder="123 Main Street" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City / State / ZIP">
              <Input value={settings.city} onChange={v => set("city", v)} placeholder="Retail City, CA 90210" />
            </Field>
            <Field label="Phone Number">
              <Input value={settings.phone} onChange={v => set("phone", v)} placeholder="(555) 012-3456" />
            </Field>
          </div>
          <Field label="Website (optional)">
            <Input value={settings.website} onChange={v => set("website", v)} placeholder="www.yourstore.com" />
          </Field>
        </Section>

        {/* Taxes */}
        <Section icon={Percent} title="Tax Configuration">
          <div className="space-y-2">
            {(settings.taxes || []).map((tax, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <input value={tax.name} onChange={e => updateTax(i, "name", e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm font-mono focus:outline-none"
                  placeholder="Tax name" />
                <input type="number" value={tax.rate} onChange={e => updateTax(i, "rate", e.target.value)}
                  className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs font-mono text-right focus:outline-none focus:border-green-500"
                  placeholder="0" step="0.1" />
                <span className="text-gray-500 text-xs">%</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!tax.enabled} onChange={e => updateTax(i, "enabled", e.target.checked)}
                    className="w-3.5 h-3.5" />
                  <span className="text-gray-500 text-xs">on</span>
                </label>
                <button onClick={() => removeTax(i)} className="text-gray-600 hover:text-red-400 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addTax}
              className="flex items-center gap-1.5 text-green-400 hover:text-green-300 text-xs font-mono transition">
              <Plus className="w-3.5 h-3.5" /> Add Tax
            </button>
          </div>
        </Section>

        {/* Tips */}
        <Section icon={DollarSign} title="Tips / Gratuity">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!settings.tips_enabled} onChange={e => set("tips_enabled", e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-gray-300 text-sm font-mono">Enable tip prompts at checkout</span>
          </label>
          {settings.tips_enabled && (
            <div>
              <div className="text-gray-500 text-xs font-mono mb-2">Tip % options:</div>
              <div className="flex flex-wrap gap-2">
                {(settings.tip_options || []).map((tip, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
                    <input type="number" value={tip} onChange={e => updateTip(i, e.target.value)}
                      className="w-10 bg-transparent text-white text-xs font-mono text-center focus:outline-none"
                      min="0" max="100" />
                    <span className="text-gray-500 text-xs">%</span>
                    <button onClick={() => removeTip(i)} className="text-gray-600 hover:text-red-400 transition">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button onClick={addTip}
                  className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs font-mono bg-gray-800 px-2 py-1 rounded-lg transition">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Receipt Messages */}
        <Section icon={MessageSquare} title="Receipt Messages">
          <Field label="Footer Message">
            <textarea value={settings.footer_message || ""} onChange={e => set("footer_message", e.target.value)}
              placeholder="Thank you for shopping with us!"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500 transition resize-none" />
          </Field>
          <Field label="Return Policy (shown on receipt)">
            <textarea value={settings.return_policy || ""} onChange={e => set("return_policy", e.target.value)}
              placeholder="Returns accepted within 30 days with valid receipt"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500 transition resize-none" />
          </Field>
        </Section>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}