'use client'

import { useAlertModalStore } from "@/app/zustand/store";

export default function AlertModal() {
  const {
    svg,
    isOpen,
    msg1,
    msg2,
    showCancel,
    onConfirm,
    onCancel,
    closeModal,
  } = useAlertModalStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeModal();
  };

  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal-content">
        <div className="alert-modal-icon">{svg}</div>
        <h2 className="alert-modal-title">{msg1}</h2>
        <p className="alert-modal-message" style={{ whiteSpace: 'pre-line' }}>{msg2}</p>
        <div className="alert-modal-buttons">
          {showCancel && (
            <button
              onClick={handleCancel}
              className="alert-modal-btn cancel"
            >
              취소
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="alert-modal-btn confirm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}