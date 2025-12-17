import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  isPending?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  cancelLabel = "Cancel",
  variant = "default",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {variant === "destructive" && (
              <div className="mt-1">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-base font-semibold text-white">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-neutral-400 text-sm mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="flex gap-3 pt-2 border-t border-neutral-800">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isPending}
            className="text-neutral-300 hover:text-white rounded-lg"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className={`rounded-lg ${
              variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            {isPending ? `${actionLabel}...` : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
