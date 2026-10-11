import React, { useState } from 'react';
import { getGeminiApiKey, setGeminiApiKey } from './geminiClient';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { KeyRound, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export default function GeminiKeySetup({ onSaved }) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(!!getGeminiApiKey());

  const handleSave = () => {
    setGeminiApiKey(key.trim());
    setSaved(true);
    onSaved?.();
  };

  const handleRemove = () => {
    setGeminiApiKey('');
    setKey('');
    setSaved(false);
  };

  if (saved) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Gemini API key configured</span>
          </div>
          <Button size="sm" variant="ghost" onClick={handleRemove} className="text-red-600 hover:text-red-700">
            Remove Key
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Gemini API key required for AI features</span>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-amber-700">
            Get your free API key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              aistudio.google.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </Label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Paste your Gemini API key..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-white text-sm"
            />
            <Button size="sm" onClick={handleSave} disabled={!key.trim()}>
              <KeyRound className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}