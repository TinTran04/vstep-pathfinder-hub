import { apiClient } from "@/services/api-client";

export interface AvatarInfo {
  avatarId: string;
  label: string;
  unlockStreakDays: number;
}

export interface UserAvatarResponse {
  activeAvatarId: string;
  unlockedAvatars: AvatarInfo[];
  lockedAvatars: AvatarInfo[];
}

export class AvatarService {
  async getUserAvatars(): Promise<UserAvatarResponse> {
    // apiClient.get already unwraps the ApiResponse wrapper (.data),
    // so the result IS UserAvatarResponse directly.
    const result = await apiClient.get<UserAvatarResponse>("/users/me/avatars");
    return result;
  }

  async setActiveAvatar(avatarId: string): Promise<void> {
    await apiClient.post("/users/me/avatars/set", { avatarId });
  }
}

export const avatarService = new AvatarService();
