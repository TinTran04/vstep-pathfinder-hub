import avatar1 from "@/assets/avatars/avatar1.png";
import avatar2 from "@/assets/avatars/avatar2.png";
import avatar3 from "@/assets/avatars/avatar3.png";
import avatar4 from "@/assets/avatars/avatar4.png";
import avatar5 from "@/assets/avatars/avatar5.png";
import avatar6 from "@/assets/avatars/avatar6.png";
import avatar7 from "@/assets/avatars/avatar7.png";
import avatar8 from "@/assets/avatars/avatar8.png";

export const DEFAULT_AVATAR_KEY = "avatar1";

export const PRESET_AVATARS = [
  { id: "avatar1", src: avatar1 },
  { id: "avatar2", src: avatar2 },
  { id: "avatar3", src: avatar3 },
  { id: "avatar4", src: avatar4 },
  { id: "avatar5", src: avatar5 },
  { id: "avatar6", src: avatar6 },
  { id: "avatar7", src: avatar7 },
  { id: "avatar8", src: avatar8 },
] as const;

const avatarMap = new Map(PRESET_AVATARS.map((avatar) => [avatar.id, avatar.src]));

export function normalizeAvatarKey(avatarKey?: string | null): string {
  return avatarMap.has(avatarKey || "") ? avatarKey! : DEFAULT_AVATAR_KEY;
}

export function getAvatarSrc(avatarKey?: string | null): string {
  return avatarMap.get(normalizeAvatarKey(avatarKey)) || avatar1;
}
