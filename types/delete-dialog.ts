export interface DeleteDialogProps {
  show: boolean;
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
}
