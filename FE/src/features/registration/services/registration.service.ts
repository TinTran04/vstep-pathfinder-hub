import { examSchedule, centers } from "../mocks/registration.mock";

export const registrationService = {
  async getExamSchedule() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return examSchedule;
  },

  async getCenters() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return centers;
  },
};

export default registrationService;
