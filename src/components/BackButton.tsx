import { ArrowLeft } from "lucide-react";
import { useNavigation } from "../contexts/NavigationContext";

export function BackButton() {
  const { goBack, canGoBack } = useNavigation();

  if (!canGoBack) {
    return null;
  }

  return (
    <div style={{ padding: "0.5rem 1rem" }}>
      <button
        type="button"
        className="button-secondary"
        onClick={() => goBack()}
        aria-label="Volver"
      >
        <ArrowLeft size={16} style={{ marginRight: 8 }} /> Volver
      </button>
    </div>
  );
}
