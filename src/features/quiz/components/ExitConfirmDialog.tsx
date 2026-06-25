import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { practiceApiService } from "../services/practice.api-service";

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  attemptId?: number;
}

export const ExitConfirmDialog: React.FC<ExitConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  attemptId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!attemptId) {
      onConfirm();
      return;
    }

    setIsLoading(true);
    try {
      await practiceApiService.deleteAttempt(attemptId);
      toast({
        title: "Thành công",
        description: "Bài thi đã được hủy bỏ.",
        variant: "default",
      });
      onOpenChange(false);
      onConfirm();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể hủy bài thi. Vui lòng thử lại.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Bạn chắc chắn muốn thoát?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base mt-3">
            Nếu thoát, bài thi thử hiện tại sẽ bị hủy bỏ và không được ghi nhận
            kết quả.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-3 justify-end mt-6">
          <AlertDialogCancel disabled={isLoading} className="mr-2">
            Quay lại thi
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Đang xử lý..." : "Thoát bài thi"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
