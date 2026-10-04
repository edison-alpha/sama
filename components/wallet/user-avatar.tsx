import Avatar from "boring-avatars";

/** Brand colours, so every generated avatar sits in the Sama palette. */
const AVATAR_COLORS = ["#e97863", "#0d2f6e", "#2563d9", "#f0b90b", "#23955a"];

/** Default user avatar, generated from the wallet address so the same wallet always gets the same picture. */
export function UserAvatar({ name, size }: { name: string; size: number }) {
  return (
    <span className="shrink-0 rounded-full" aria-hidden="true">
      <Avatar name={name.toLowerCase()} variant="beam" size={size} colors={AVATAR_COLORS} className="block" />
    </span>
  );
}
