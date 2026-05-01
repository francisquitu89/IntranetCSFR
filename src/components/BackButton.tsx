import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackButton() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "0.5rem 1rem" }}>
      <button
        type="button"
        className="button-secondary"
        onClick={() => navigate(-1)}
        aria-label="Volver"
      >
        <ArrowLeft size={16} style={{ marginRight: 8 }} /> Volver
      </button>
    </div>
  );
}
