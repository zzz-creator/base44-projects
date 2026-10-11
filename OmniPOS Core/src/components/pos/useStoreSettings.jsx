import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULT_SETTINGS = {
  store_name: "RetailOS Store",
  store_id: "1024",
  terminal_id: "LANE-3",
  address: "123 Main Street",
  city: "Retail City",
  phone: "(555) 012-3456",
  website: "",
  taxes: [{ name: "Sales Tax", rate: 8, enabled: true }],
  tips_enabled: false,
  tip_options: [10, 15, 18, 20],
  footer_message: "Thank you for shopping with us!",
  return_policy: "Returns accepted within 30 days with valid receipt",
  currency_symbol: "$"
};

let _cached = null;

export async function loadStoreSettings() {
  if (_cached) return _cached;
  const list = await base44.entities.StoreSettings.list();
  if (list.length > 0) {
    _cached = { ...DEFAULT_SETTINGS, ...list[0] };
    return _cached;
  }
  return DEFAULT_SETTINGS;
}

export function invalidateSettingsCache() {
  _cached = null;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return { settings, loading, setSettings };
}

export { DEFAULT_SETTINGS };