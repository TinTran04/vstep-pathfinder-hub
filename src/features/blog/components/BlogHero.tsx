import { BookOpenText } from "lucide-react";

const BlogHero = () => (
  <section className="border-b border-border bg-card pt-28 pb-12 md:pt-32 md:pb-16">
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <div className="max-w-3xl">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
          <BookOpenText size={18} /> VstepUp Journal
        </div>
        <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl">Blog VSTEP</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Chiến lược học tập, hướng dẫn từng kỹ năng và những cập nhật mới giúp bạn chuẩn bị kỳ thi VSTEP hiệu quả hơn.
        </p>
      </div>
    </div>
  </section>
);

export default BlogHero;
