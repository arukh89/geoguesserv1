/**
 * Utility functions for formatting Farcaster usernames according to best practices
 */

export interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

/**
 * Formats a username for display in the app
 */
export function formatUsernameForDisplay(user: FarcasterUser | null): string {
  if (!user) return "Anonymous";
  if (user.displayName && user.displayName.trim() !== "") return user.displayName.trim();
  if (user.username && user.username.trim() !== "") return `@${user.username.trim()}`;
  if (user.fid) return `fid:${user.fid}`;
  return "Anonymous";
}

/**
 * Creates a short display string for tight spaces
 */
export function formatUsernameForCompactDisplay(user: FarcasterUser | null): string {
  if (!user) return "Anon";
  if (user.displayName && user.displayName.trim() !== "") {
    const displayName = user.displayName.trim();
    return displayName.length > 12 ? `${displayName.substring(0, 9)}...` : displayName;
  }
  if (user.username && user.username.trim() !== "") {
    const username = user.username.trim();
    return username.length > 12 ? `${username.substring(0, 9)}...` : username;
  }
  if (user.fid) return `FID ${user.fid}`;
  return "Anon";
}

/**
 * Formats username with FID for leaderboard display
 */
export function formatUsernameWithFid(user: FarcasterUser | null | string, fid?: number): string {
  if (typeof user === "string") {
    if (fid) {
      const username = user.startsWith("@") ? user : (user.startsWith("fid:") ? user : `@${user}`);
      if (username.startsWith("fid:")) return `FID: ${fid}`;
      return `${username} (FID: ${fid})`;
    }
    return user;
  }
  if (!user) return fid ? `FID: ${fid}` : "Anonymous";
  const fidToShow = user.fid || fid;
  if (user.username && user.username.trim() !== "") {
    const username = `@${user.username.trim()}`;
    return fidToShow ? `${username} (FID: ${fidToShow})` : username;
  }
  if (user.displayName && user.displayName.trim() !== "") {
    return fidToShow ? `${user.displayName.trim()} (FID: ${fidToShow})` : user.displayName.trim();
  }
  if (fidToShow) return `FID: ${fidToShow}`;
  return "Anonymous";
}

/**
 * Determines if a user is a Farcaster user
 */
export function isFarcasterUser(user: any): user is FarcasterUser {
  return user && (
    (user.fid && typeof user.fid === "number") ||
    (user.username && typeof user.username === "string") ||
    (user.displayName && typeof user.displayName === "string") ||
    (user.pfpUrl && typeof user.pfpUrl === "string")
  );
}

/**
 * Generates user initials for avatar fallback
 */
export function getUserInitials(user: FarcasterUser | null): string {
  if (!user) return "?";
  if (user.displayName && user.displayName.trim() !== "") {
    const names = user.displayName.trim().split(" ");
    if (names.length >= 2) return names[0][0].toUpperCase() + names[1][0].toUpperCase();
    return user.displayName.substring(0, 2).toUpperCase();
  }
  if (user.username && user.username.trim() !== "") return user.username.substring(0, 2).toUpperCase();
  if (user.fid) return `F${user.fid.toString().charAt(0)}`;
  return "?";
}
