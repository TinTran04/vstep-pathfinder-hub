import { useState, useEffect } from "react";
import { Star, MessageSquareDot, ChevronLeft, ChevronRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/StaggerChildren";
import { landingService } from "../services/landing.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TestimonialItem {
  name: string;
  role: string;
  content: string;
  rating: number;
}

const TestimonialSection = () => {
  const { isLoggedIn, user } = useAuth();
  const [testimonialsList, setTestimonialsList] = useState<TestimonialItem[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  
  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonials = () => {
    landingService.getTestimonials().then((data) => {
      setTestimonialsList(data);
    });
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setSubmitting(true);
    try {
      await landingService.createTestimonial({
        name: user?.name || "Học viên ẩn danh",
        role: role.trim() || "Học viên VSTEPPro",
        content: content.trim(),
        rating: rating
      });
      toast.success("Cảm ơn bạn đã đóng góp đánh giá!");
      setContent("");
      setRole("");
      setRating(5);
      setCurrentPage(1);
      fetchTestimonials();
    } catch (err) {
      toast.error("Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Học viên nói gì</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Được tin tưởng bởi hàng nghìn học viên
          </h2>
        </ScrollReveal>

        {(() => {
          const totalPages = Math.ceil(testimonialsList.length / ITEMS_PER_PAGE);
          const paginatedTestimonials = testimonialsList.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
          );

          return (
            <>
              <StaggerContainer className="grid md:grid-cols-3 gap-6">
                {paginatedTestimonials.map((t, idx) => (
                  <StaggerItem key={t.name + idx}>
                    <div className="card-edu group hover:border-primary/30 transition-all duration-300 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex gap-1 mb-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={16} className={`${i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.content}"</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                           <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 animate-in fade-in duration-300">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border hover:bg-muted"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        className={`h-9 w-9 text-xs font-semibold ${
                          isActive
                            ? "gradient-primary text-primary-foreground shadow-md hover:opacity-90 animate-none"
                            : "border-border hover:bg-muted"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border hover:bg-muted"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          );
        })()}

        {/* Interactive Rating Form - Premium design */}
        {isLoggedIn && user && (
          <ScrollReveal className="max-w-xl mx-auto mt-16">
            <div className="relative p-6 md:p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary" />
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquareDot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Chia sẻ cảm nhận của bạn</h3>
                  <p className="text-xs text-muted-foreground">Đóng góp đánh giá giúp VSTEPPro hoàn thiện hơn mỗi ngày</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Chọn mức độ hài lòng</Label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starVal = i + 1;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(starVal)}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="focus:outline-none transition-transform hover:scale-125 duration-150"
                        >
                          <Star
                            size={28}
                            className={`transition-colors cursor-pointer ${
                              starVal <= (hoverRating ?? rating)
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-semibold text-amber-500 ml-2">
                      {rating === 1 && "Rất tệ 😞"}
                      {rating === 2 && "Chưa tốt 😐"}
                      {rating === 3 && "Bình thường 🙂"}
                      {rating === 4 && "Rất tốt 😀"}
                      {rating === 5 && "Tuyệt vời! 😍"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Họ và tên</Label>
                    <Input value={user.name} disabled className="bg-muted text-muted-foreground h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vai trò học tập</Label>
                    <Input
                      placeholder="Ví dụ: Học viên B2, Sinh viên..."
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Lời bình luận / Góp ý</Label>
                  <Textarea
                    placeholder="Hãy viết cảm nhận của bạn về lộ trình tự học, tính năng chấm điểm AI hay chất lượng bài học của chúng tôi nhé..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={3}
                    className="text-xs leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-9 text-xs font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    "Gửi đánh giá ngay"
                  )}
                </Button>
              </form>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};

export default TestimonialSection;
