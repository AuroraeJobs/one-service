const AVATAR_COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#38f9d7',
  '#fa709a',
  '#fee140',
  '#a8edea',
  '#fed6e3',
];

export const getAvatarInitial = (name: string): string => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
