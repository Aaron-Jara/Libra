export type CritiqueChatMessage = {
  id: string;
  role: "user" | "critic";
  text: string;
};

export function createChatMessage(
  role: CritiqueChatMessage["role"],
  text: string,
): CritiqueChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    text,
  };
}
