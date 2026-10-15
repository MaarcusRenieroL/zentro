import { ActorAvatar } from "~/src/components/actor-avatar";

type Props = {
  value: string | null | undefined;
  size?: number;
};

/** A person as initials on their tint, the same chip used across the app. */
export function AvatarInitials({ value, size = 24 }: Props) {
  return <ActorAvatar name={value || "?"} size={size} />;
}
