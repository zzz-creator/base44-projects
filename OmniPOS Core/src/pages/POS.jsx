import React from "react";
import { POSProvider, usePOS } from "@/components/pos/POSContext";
import BootScreen from "@/components/pos/BootScreen";
import LaneLockScreen from "@/components/pos/LaneLockScreen";
import ShiftStartScreen from "@/components/pos/ShiftStartScreen";
import POSInterface from "@/components/pos/POSInterface";
import SelfCheckout from "@/components/pos/SelfCheckout";

function POSRouter() {
  const { phase, setPhase, terminalMode } = usePOS();

  if (phase === "boot") return <BootScreen onComplete={() => setPhase("locked")} />;
  if (phase === "locked") return <LaneLockScreen />;
  if (phase === "login") return <LaneLockScreen />; // reuse
  if (phase === "shift_start") return <ShiftStartScreen />;
  if (phase === "self_checkout") return <SelfCheckout />;
  if (phase === "pos") return <POSInterface />;
  return <LaneLockScreen />;
}

export default function POSPage() {
  return (
    <POSProvider>
      <POSRouter />
    </POSProvider>
  );
}