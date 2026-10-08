import { PinPad } from "@/components/ui/pin-pad";
import React from "react";

type PinAuthViewProps = {
  title?: string;
  description?: string;
  onBack: () => void;
  onValidate: (pin: string) => Promise<boolean>;
};

export function PinAuthView({
  title = "Ingresa tu PIN",
  description = "Valida tu identidad para continuar.",
  onBack,
  onValidate,
}: PinAuthViewProps) {
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [validating, setValidating] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function validatePin() {
      if (pin.length !== 4) {
        return;
      }

      setError("");
      setValidating(true);

      try {
        const isValid = await onValidate(pin);

        if (!active) {
          return;
        }

        if (!isValid) {
          setError("PIN incorrecto.");
          setPin("");
        }
      } catch (currentError) {
        if (!active) {
          return;
        }

        setError(currentError instanceof Error ? currentError.message : "PIN incorrecto.");
        setPin("");
      } finally {
        if (active) {
          setValidating(false);
        }
      }
    }

    validatePin();

    return () => {
      active = false;
    };
  }, [onValidate, pin]);

  return <PinPad title={title} description={description} pin={pin} error={error} busy={validating} onBack={onBack} onChange={setPin} />;
}
