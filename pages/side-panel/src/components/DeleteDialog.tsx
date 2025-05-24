import { useEffect, useRef } from 'react';

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export default function DeleteDialog({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDarkMode,
}: DeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle clicking outside the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY && e.clientY <= rect.bottom && rect.left <= e.clientX && e.clientX <= rect.right;
      if (!isInDialog) {
        onCancel();
      }
    };

    dialog.addEventListener('click', handleClick);
    return () => dialog.removeEventListener('click', handleClick);
  }, [onCancel]);

  // Handle escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    dialog.addEventListener('keydown', handleEscape);
    return () => dialog.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`p-0 rounded-lg shadow-lg backdrop:bg-black/50 max-w-md w-full mx-auto ${
        isDarkMode ? 'bg-[hsl(0,0%,14.9%)] text-white' : 'bg-white text-gray-900'
      }`}>
      <div className="p-6">
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-md text-sm min-w-[80px] inline-flex items-center justify-center ${
              isDarkMode
                ? 'bg-[hsl(0,0%,20%)] text-white hover:bg-[hsl(0,0%,25%)]'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-sm min-w-[80px] inline-flex items-center justify-center ${
              isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'
            }`}>
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
