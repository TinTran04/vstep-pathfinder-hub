import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, CheckCircle, XCircle, ArrowRight, BookOpen, Headphones, Pen, Mic, Calendar, Activity, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { attemptsApiService } from "@/features/attempts/services/attempts.api-service";

interface HistoryItem {
  attemptId: number;
  title: string;
  mode: string;
  type: string;
  skills: string[];
  status: string;
  startedAt: string;
  submittedAt?: string;
  completedAt?: string;
  overallScore?: number;
  skillScores?: Record<string, number>;
  currentSkill?: string;
  remainingSeconds: number;
}

const HistoryTab = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await attemptsApiService.getHistory(p, 10);
      if (res && res.items) {
        setItems(res.items);
        setTotalPages(res.totalPages || 1);
      } else {
        setItems([]);
        setError("Không thể tải lịch sử. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error(e);
      setItems([]);
      setError("Có lỗi khi tải lịch sử. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttempt = async (attemptId: number) => {
    setDeleting(true);
    try {
      await attemptsApiService.deleteAttempt(String(attemptId));
      setItems(items.filter(i => i.attemptId !== attemptId));
      setDeleteConfirm(null);
      toast.success("Xóa bài làm thành công");
    } catch (e) {
      console.error(e);
      toast.error("Không thể xóa bài làm");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none"><XCircle size={12} className="mr-1"/> Đã hủy</Badge>;
      case "submitted":
      case "scored":
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle size={12} className="mr-1"/> Hoàn thành</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle size={12} className="mr-1"/> Lỗi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Lịch sử bài làm 📜</h1>
        <p className="text-muted-foreground mt-1">Xem lại các bài luyện tập và thi thử của bạn</p>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity size={20} className="text-primary" /> Lịch sử hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          {loading && items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground animate-pulse">Đang tải dữ liệu...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Calendar size={36} className="opacity-20" />
              <p className="text-sm">Chưa có bài làm nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.attemptId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                      <span>{new Date(item.startedAt).toLocaleDateString("vi-VN")}</span>
                      <span className="flex items-center gap-1">
                        {item.skills.map((skill) => (
                          <span key={skill} className="px-1.5 py-0.5 rounded-md bg-muted text-xs capitalize">{skill}</span>
                        ))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "in_progress" ? (
                      <span className="text-sm text-muted-foreground italic">Đã hủy bỏ</span>
                    ) : (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/attempts/${item.attemptId}/review`)}>
                          Xem lại
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirm(item.attemptId)}>
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              Xóa bài làm?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn chắc chắn muốn xóa bài làm này? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteAttempt(deleteConfirm)} disabled={deleting}>
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryTab;
