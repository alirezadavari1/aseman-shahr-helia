import React, { useEffect } from "react";
import { Icon } from "./Icons";

export function ModalShell({ title, onClose, children, onDelete, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay overlay-in" onClick={onClose}>
      <div className={`modal modal-in ${wide ? "modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <Icon.close />
          </button>
        </div>
        {children}
        {onDelete && (
          <button className="delete-full-btn" onClick={onDelete}>
            <Icon.trash /> حذف این مورد
          </button>
        )}
      </div>
    </div>
  );
}
