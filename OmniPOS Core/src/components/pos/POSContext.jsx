// @ts-ignore
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const POSContext = createContext(null);

export const usePOS = () => useContext(POSContext);

const CONFIG = {
  store_id: "1024",
  terminal_id: "LANE-3",
  store_name: "RetailOS Store",
  idle_lock_timeout: 60,
  terminal_mode: "staff" // or "self_checkout"
};

export function POSProvider({ children }) {
  const [phase, setPhase] = useState("boot"); // boot | locked | login | shift_start | pos | self_checkout
  const [currentStaff, setCurrentStaff] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [cart, setCart] = useState([]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState(null);
  const [terminalMode, setTerminalMode] = useState(CONFIG.terminal_mode);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const idleTimer = useRef(null);

  const resetIdleTimer = () => {
    if (phase !== "pos" && phase !== "self_checkout") return;
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      lockLane("idle_timeout");
    }, CONFIG.idle_lock_timeout * 1000);
  };

  useEffect(() => {
    if (phase === "pos") {
      window.addEventListener("mousemove", resetIdleTimer);
      window.addEventListener("keydown", resetIdleTimer);
      resetIdleTimer();
    }
    return () => {
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      clearTimeout(idleTimer.current);
    };
  }, [phase]);

  const logEvent = async (event_type, description, metadata = {}) => {
    try {
      // @ts-ignore
      await base44.entities.SecurityLog.create({
        event_type,
        description,
        terminal_id: CONFIG.terminal_id,
        staff_id: currentStaff?.staff_id || "SYSTEM",
        metadata,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Unable to log event to server (using offline mode):", event_type, description);
    }
  };

  const lockLane = (reason = "manual") => {
    setCurrentStaff(null);
    setCart([]);
    setPhase("locked");
    logEvent("lane_lock", `Lane locked: ${reason}`);
  };

  const loginStaff = async (pin) => {
    if (lockedOut) return { success: false, error: "Terminal locked. Try again later." };
    
    try {
      // @ts-ignore
      const staffList = await base44.entities.Staff.list();
      const match = staffList.find(s => s.pin === pin && s.active);
      if (match) {
        setFailedAttempts(0);
        setCurrentStaff(match);
        logEvent("staff_login", `Staff ${match.name} logged in`, { staff_id: match.staff_id });
        setPhase("shift_start");
        return { success: true, staff: match };
      }
    } catch (err) {
      console.warn("Database login failed, falling back to demo pins:", err.message);
    }

    // DEMO MOCK FALLBACK
    const demoPins = {
      "0000": { staff_id: "demo-admin", name: "Demo Admin", role: "administrator", active: true },
      "1234": { staff_id: "demo-manager", name: "Demo Manager", role: "manager", active: true },
      "5678": { staff_id: "demo-supervisor", name: "Demo Supervisor", role: "supervisor", active: true },
      "9012": { staff_id: "demo-cashier", name: "Demo Cashier", role: "cashier", active: true }
    };

    if (demoPins[pin]) {
      const match = demoPins[pin];
      setFailedAttempts(0);
      setCurrentStaff(match);
      logEvent("staff_login_demo", `Demo Staff ${match.name} logged in`, { staff_id: match.staff_id });
      setPhase("shift_start");
      return { success: true, staff: match };
    }

    const attempts = failedAttempts + 1;
    setFailedAttempts(attempts);
    if (attempts >= 5) {
      setLockedOut(true);
      const end = Date.now() + 120000;
      setLockoutEnd(end);
      logEvent("security_alert", "5 failed login attempts - terminal locked");
      setTimeout(() => { setLockedOut(false); setFailedAttempts(0); }, 120000);
    }
    return { success: false, error: "Invalid PIN" };
  };

  const startShift = async (openingFloat) => {
    // @ts-ignore
    const shift = await base44.entities.ShiftSession.create({
      staff_id: currentStaff.staff_id,
      terminal_id: CONFIG.terminal_id,
      login_time: new Date().toISOString(),
      opening_float: parseFloat(openingFloat),
      status: "active"
    });
    setCurrentShift(shift);
    setPhase(terminalMode === "self_checkout" ? "self_checkout" : "pos");
    logEvent("shift_start", `Shift started by ${currentStaff.name}`, { float: openingFloat });
  };

  const endShift = async () => {
    if (currentShift) {
      // @ts-ignore
      await base44.entities.ShiftSession.update(currentShift.id, {
        logout_time: new Date().toISOString(),
        status: "closed"
      });
    }
    lockLane("shift_end");
  };

  const updateCartItemDiscount = (productId, discount) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, discount } : i));
  };

  const ageVerifyItem = (productId) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, age_verified: true } : i));
  };

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product, qty, price: product.price, override_price: null, discount: 0 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    const p = item.override_price !== null ? item.override_price : item.price;
    const discounted = p * (1 - item.discount / 100);
    return sum + discounted * item.qty;
  }, 0);

  const addSystemAlert = (msg) => {
    const id = Date.now();
    setSystemAlerts(prev => [...prev, { id, msg }]);
    setTimeout(() => setSystemAlerts(prev => prev.filter(a => a.id !== id)), 5000);
  };

  const canPerform = (action) => {
    if (!currentStaff) return false;
    const role = currentStaff.role;
    const perms = {
      cashier: ["process_sale", "open_drawer", "discount_0_5"],
      supervisor: ["process_sale", "open_drawer", "discount_0_5", "discount_5_15", "apply_discount", "void_item", "refund", "price_override_minor", "age_verify"],
      manager: ["process_sale", "open_drawer", "discount_0_5", "discount_5_15", "discount_15_50", "apply_discount", "void_item", "void_transaction", "refund", "price_override", "edit_inventory", "price_override_minor", "age_verify"],
      administrator: ["all"]
    };
    if (role === "administrator") return true;
    return (perms[role] || []).includes(action);
  };

  return (
    <POSContext.Provider value={{
      phase, setPhase,
      currentStaff, currentShift,
      cart, addToCart, removeFromCart, clearCart, cartTotal,
      loginStaff, lockLane, startShift, endShift,
      failedAttempts, lockedOut, lockoutEnd, setLockedOut, setFailedAttempts, setCurrentStaff,
      CONFIG, terminalMode, setTerminalMode,
      systemAlerts, addSystemAlert,
      assistanceRequested, setAssistanceRequested,
      canPerform, logEvent,
      updateCartItemDiscount, ageVerifyItem
    }}>
      {children}
    </POSContext.Provider>
  );
}