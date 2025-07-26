// Cache for profile images to avoid repeated API calls
const profileImageCache = new Map<string, string>();

/**
 * Attempts to get a profile image URL for a given email address
 * For now, this is a placeholder that generates initials-based avatars
 * In a full implementation, you would integrate with Google People API
 */
export function getProfileImageUrl(
  email: string, 
  displayName?: string,
  accessToken?: string
): Promise<string | null> {
  return new Promise((resolve) => {
    // Check cache first
    if (profileImageCache.has(email)) {
      resolve(profileImageCache.get(email) || null);
      return;
    }

    // For now, return null to use initials
    // In a real implementation, you would:
    // 1. Use the Google People API to search for the contact
    // 2. Extract the profile photo URL if available
    // 3. Cache the result
    
    /* Example implementation:
    if (accessToken) {
      fetch(`https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        const contact = data.results?.[0]?.person;
        const photoUrl = contact?.photos?.[0]?.url;
        
        if (photoUrl) {
          profileImageCache.set(email, photoUrl);
          resolve(photoUrl);
        } else {
          resolve(null);
        }
      })
      .catch(() => resolve(null));
    } else {
      resolve(null);
    }
    */
    
    resolve(null);
  });
}

/**
 * Generates initials from a name or email
 */
export function getInitials(email: string, displayName?: string): string {
  const name = displayName || email.split('@')[0];
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Generates a consistent color for an email address
 */
export function getAvatarColor(email: string): string {
  const colors = [
    '#075056', // Teal
    '#FF5B04', // Orange  
    '#F4D47C', // Yellow
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];
  
  // Generate a hash from the email to get consistent colors
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) & 0xffffffff;
  }
  
  return colors[Math.abs(hash) % colors.length];
}