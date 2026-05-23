import { benefits, testimonials, plans } from "../mocks/landing.mock";

export const landingService = {
  async getBenefits() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return benefits;
  },

  async getTestimonials() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return testimonials;
  },

  async getPlans() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return plans;
  },

  async getLandingData() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      benefits,
      testimonials,
      plans,
    };
  },
};

export default landingService;
