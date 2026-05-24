import { benefits, testimonials, plans } from "../mocks/landing.mock";

export const landingService = {
  async getBenefits() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return benefits;
  },

  async getTestimonials() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const stored = localStorage.getItem("vstep_testimonials");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing testimonials", e);
      }
    }
    localStorage.setItem("vstep_testimonials", JSON.stringify(testimonials));
    return testimonials;
  },

  async createTestimonial(payload: { name: string; role: string; content: string; rating: number }) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const current = await this.getTestimonials();
    const newTestimonial = {
      ...payload,
      rating: Number(payload.rating)
    };
    current.unshift(newTestimonial); // add to top
    localStorage.setItem("vstep_testimonials", JSON.stringify(current));
    return newTestimonial;
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
