const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/pages/Dashboard.tsx', 'utf-8');

content = content.replace(
    'import VocabularyNotebook from "../components/VocabularyNotebook";',
    'import VocabularyNotebook from "../components/VocabularyNotebook";\nimport HistoryTab from "../components/HistoryTab";'
);

content = content.replace(
    'BookMarked, FileText, Crown,',
    'BookMarked, FileText, Crown, Activity, Navigation,'
);

content = content.replace(
    'type TabType = "overview" | "settings" | "vocabulary";',
    'type TabType = "overview" | "history" | "settings" | "vocabulary";'
);

content = content.replace(
    '    { icon: <Settings size={20} />, label: "Cài đặt", tab: "settings" as TabType },',
    '    { icon: <Activity size={20} />, label: "Lịch sử bài làm", tab: "history" as TabType },\n    { icon: <Settings size={20} />, label: "Cài đặt", tab: "settings" as TabType },'
);

content = content.replace(
    '          {activeTab === "vocabulary" && (',
    '          {activeTab === "history" && (\n            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>\n              <HistoryTab />\n            </motion.div>\n          )}\n\n          {activeTab === "vocabulary" && ('
);

const quick_actions = `      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
        <div className="flex gap-3">
          <Button onClick={async () => {
              try {
                const { attemptsApiService } = await import("@/features/attempts/services/attempts.api-service");
                const toast = (await import("sonner")).toast;
                const attempt = await attemptsApiService.startRandomMockTest();
                toast.success("Bắt đầu thi thử ngẫu nhiên!");
                window.location.href = \`/quiz/listening/take?mode=mock_test&session=mock&attemptId=\${attempt.id}\`;
              } catch (e) {
                console.error(e);
                alert("Lỗi: " + (e?.response?.data?.message || "Không thể tạo bài thi ngẫu nhiên"));
              }
            }} 
            className="gradient-primary flex-1 sm:flex-none"
          >
            <Navigation size={18} className="mr-2"/> Thi thử ngẫu nhiên 4 kỹ năng
          </Button>
        </div>
      </motion.div>

      {/* Stats cards */}`;

content = content.replace('      {/* Stats cards */}', quick_actions);

fs.writeFileSync('src/features/dashboard/pages/Dashboard.tsx', content, 'utf-8');
console.log('Done');
