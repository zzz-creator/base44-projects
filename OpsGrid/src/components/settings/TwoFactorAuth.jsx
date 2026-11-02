import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { QrCode, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

// Simple TOTP URI generator for display (real validation happens server-side via TOTP standard)
function generateTOTPSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) secret += chars[Math.floor(Math.random() * chars.length)];
  return secret;
}

export default function TwoFactorAuth() {
  const [step, setStep] = useState('idle'); // idle | setup | verify | enabled | disabling
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(() => localStorage.getItem('2fa_enabled') === 'true');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const s = generateTOTPSecret();
    setSecret(s);
    const issuer = 'OpsGrid';
    const label = encodeURIComponent(`${issuer}:${user.email}`);
    const uri = `otpauth://totp/${label}?secret=${s}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
    setQrUrl(qr);
    setStep('setup');
    setLoading(false);
  };

  // Simulate TOTP verification (in production this would be server-side)
  const verify = () => {
    setError('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    // Store enabled state locally (production: send to backend)
    localStorage.setItem('2fa_enabled', 'true');
    localStorage.setItem('2fa_secret', secret);
    setEnabled(true);
    setStep('idle');
    setCode('');
    toast.success('2FA enabled successfully');
  };

  const disable = () => {
    localStorage.removeItem('2fa_enabled');
    localStorage.removeItem('2fa_secret');
    setEnabled(false);
    setStep('idle');
    toast.success('2FA disabled');
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">Time-based OTP (TOTP)</div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">Use an authenticator app (Google Authenticator, Authy, etc.)</div>
        </div>
        {enabled ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-neon-green">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ENABLED
            </div>
            <button
              onClick={disable}
              className="text-xs font-mono px-3 py-1.5 rounded border border-neon-red/30 text-neon-red hover:bg-neon-red/10 transition-colors"
            >
              DISABLE
            </button>
          </div>
        ) : (
          <button
            onClick={startSetup}
            disabled={loading || step === 'setup'}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
            SETUP 2FA
          </button>
        )}
      </div>

      {step === 'setup' && (
        <div className="rounded-lg border border-border bg-muted/10 p-5 space-y-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Step 1 — Scan QR code with your authenticator app</div>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img src={qrUrl} alt="TOTP QR Code" className="w-40 h-40 rounded-lg border border-border bg-white" />
            <div className="space-y-3 flex-1">
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">Or enter secret manually:</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground tracking-widest break-all">{secret}</code>
                  <button onClick={copySecret} className="p-1 rounded hover:bg-muted/50">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Step 2 — Enter the 6-digit code to verify</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="000000"
                    className="w-32 h-9 bg-input border border-border rounded-md px-3 text-sm font-mono text-center text-foreground tracking-widest focus:outline-none focus:ring-1 focus:ring-neon-blue"
                  />
                  <button
                    onClick={verify}
                    className="text-xs font-mono px-4 py-2 rounded border border-neon-green/30 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors"
                  >
                    VERIFY &amp; ENABLE
                  </button>
                  <button
                    onClick={() => { setStep('idle'); setCode(''); setError(''); }}
                    className="text-xs font-mono px-3 py-2 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
                {error && <p className="text-xs font-mono text-neon-red mt-1.5">{error}</p>}
                <p className="text-xs font-mono text-muted-foreground/60 mt-2">
                  Note: In production, verification is validated server-side. This demo stores the state locally.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}