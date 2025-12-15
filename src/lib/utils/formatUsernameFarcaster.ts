/**
 * Utility functions for formatting Farcaster usernames according to best practices
 */

/**
 * Formats a username for display in Farcaster Mini Apps
 * According to Farcaster docs, there are two types of usernames:
 * - Offchain ENS names (fnames): free and controlled by Farcaster (e.g. @alice)
 * - Onchain ENS names: costs money and controlled by wallet (e.g. @alice.eth)
 * 
 * Best practices for display:
 * 1. Prioritize displayName over username when available
 * 2. Show full username (with @) to distinguish from regular text
 * 3. For FIDs, display as "fid:{number}" as fallback
 * 4. Truncate long usernames to maintain readability
 * 5. Add visual indicators (avatar, badge) to identify Farcaster users
 */

export interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

/**
 * Formats a username for display in the app
 * @param user - The user object containing username, displayName, fid, etc.
 * @returns A formatted username string
 */
export function formatUsernameForDisplay(user: FarcasterUser | null): string {
  // If no user data, return "Anonymous"
  if (!user) {
    return "Anonymous";
  }

  // Priority order for display: displayName > username > fid
  // This follows Farcaster best practices for user identification
  
  // If displayName is available, use it
  if (user.displayName && user.displayName.trim() !== "") {
    return user.displayName.trim();
  }
  
  // If username is available, use it with @ prefix
  if (user.username && user.username.trim() !== "") {
    return `@${user.username.trim()}`;
  }
  
  // If we have a FID, use it as fallback
  if (user.fid) {
    return `fid:${user.fid}`;
  }
  
  // Final fallback
  return "Anonymous";
}

/**
 * Creates a short display string for tight spaces
 * @param user - The user object
 * @returns A shortened display string
 */
export function formatUsernameForCompactDisplay(user: FarcasterUser | null): string {
  // If no user data, return "Anonymous"
  if (!user) {
    return "Anon";
  }

  // For compact display, prioritize displayName but limit length
  if (user.displayName && user.displayName.trim() !== "") {
    const displayName = user.displayName.trim();
    return displayName.length > 12 ? `${displayName.substring(0, 9)}...` : displayName;
  }
  
  // If username is available, use it without @
  if (user.username && user.username.trim() !== "") {
    const username = user.username.trim();
    return username.length > 12 ? `${username.substring(0, 9)}...` : username;
  }
  
  // For FID, show shorter format
  if (user.fid) {
    return `FID ${user.fid}`;
  }
  
  // Final fallback
  return "Anon";
}

/**
 * Formats username with FID for leaderboard display
 * Shows: @username (FID: 12345) or just FID: 12345 if no username
 * @param user - The user object or string
 * @returns A formatted string with username and FID
 */
export function formatUsernameWithFid(user: FarcasterUser | null | string, fid?: number): string {
  // Handle string input (from database)
  if (typeof user === "string") {
    if (fid) {
      // If string starts with @, keep it, otherwise add @
      const username = user.startsWith("@") ? user : (user.startsWith("fid:") ? user : `@${user}`);
      if (username.startsWith("fid:")) {
        return `FID: ${fid}`;
      }
      return `${username} (FID: ${fid})`;
    }
    return user;
  }

  // If no user data, return "Anonymous"
  if (!user) {
    return fid ? `FID: ${fid}` : "Anonymous";
  }

  const fidToShow = user.fid || fid;

  // If we have username, show @username (FID: xxx)
  if (user.username && user.username.trim() !== "") {
    const username = `@${user.username.trim()}`;
    return fidToShow ? `${username} (FID: ${fidToShow})` : username;
  }
  
  // If we have displayName but no username, show displayName (FID: xxx)
  if (user.displayName && user.displayName.trim() !== "") {
    return fidToShow ? `${user.displayName.trim()} (FID: ${fidToShow})` : user.displayName.trim();
  }
  
  // If we only have FID
  if (fidToShow) {
    return `FID: ${fidToShow}`;
  }
  
  return "Anonymous";
}

/**
 * Determines if a user is a Farcaster user
 * @param user - The user object
 * @returns Boolean indicating if the user has Farcaster data
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
 * @param user - The user object
 * @returns A string containing the user's initials
 */
export function getUserInitials(user: FarcasterUser | null): string {
  if (!user) return "?";
  
  // Try to get initials from displayName
  if (user.displayName && user.displayName.trim() !== "") {
    const names = user.displayName.trim().split(" ");
    if (names.length >= 2) {
      return names[0][0].toUpperCase() + names[1][0].toUpperCase();
    }
    return user.displayName.substring(0, 2).toUpperCase();
  }
  
  // Try to get initials from username
  if (user.username && user.username.trim() !== "") {
    return user.username.substring(0, 2).toUpperCase();
  }
  
  // Default to first character of FID
  if (user.fid) {
    return `F${user.fid.toString().charAt(0)}`;
  }
  
  return "?";
}