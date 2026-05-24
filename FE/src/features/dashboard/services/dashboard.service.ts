// dashboard.service.ts
// Dữ liệu thật sẽ được lấy từ API khi BE sẵn sàng.
// Hiện tại chỉ giữ pointActions (nội dung tĩnh hướng dẫn kiếm điểm).
import { pointActions } from "../mocks/dashboard.mock";

export const dashboardService = {
  async getDashboardData() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      recentScores: [],   // Chưa có API → hiển thị empty state
      weeklyData: [],     // Chưa có API → hiển thị empty state
      pointActions,       // Nội dung tĩnh hướng dẫn cách kiếm điểm
    };
  },
};

export default dashboardService;
