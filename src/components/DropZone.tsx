import { useState, type ReactNode } from "react";
import { handleFileUpload } from "../state/actions";

export default function DropZone({ children }: { children: ReactNode }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      id="drop-zone"
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        handleFileUpload(e.dataTransfer.files);
      }}
      className={`min-h-screen p-4 transition-colors ${isOver ? "bg-neutral-100" : "bg-transparent"}`}
    >
      {children}
    </div>
  );
}
