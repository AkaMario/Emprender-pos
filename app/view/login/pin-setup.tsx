import React from 'react';
import { PinPad } from '@/components/ui/pin-pad';
type PinSetupViewProps = { error: string; pin: string; submitting?: boolean; onBack: () => void; onChangePin: (value: string) => void; onContinue: () => void };
export function PinSetupView({ error, pin, submitting, onBack, onChangePin, onContinue }: PinSetupViewProps) {
  return <PinPad title="Crea tu PIN" description="Ingresa 4 dígitos para autorizar operaciones importantes." pin={pin} error={error} busy={submitting} onBack={onBack} onChange={onChangePin} onContinue={onContinue} />;
}
export default PinSetupView;
