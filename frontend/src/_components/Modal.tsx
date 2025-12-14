import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, children }: { open:boolean; onClose:()=>void; children:React.ReactNode }) {
    useEffect( () => { 
        if(!open) return; 
        const prev=document.body.style.overflow; 
        document.body.style.overflow='hidden'; 
        
        return () => {document.body.style.overflow=prev}; 
    },[open]);

    if(!open) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="card modal-card" onClick={e=>e.stopPropagation()}>{children}</div>
        </div>,
        document.body
    );
}