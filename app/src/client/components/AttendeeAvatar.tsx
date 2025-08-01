import React, { useState, useEffect } from 'react';
import { getProfileImageUrl, getInitials, getAvatarColor } from '../utils/profileImages';

interface AttendeeAvatarProps {
  email: string;
  displayName?: string;
  name?: string; // Alias for displayName for backward compatibility
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

function AttendeeAvatar({ email, displayName, name, size = 'sm', className = '' }: AttendeeAvatarProps) {
  // Use name prop as fallback for displayName for backward compatibility
  const finalDisplayName = displayName || name;
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  useEffect(() => {
    getProfileImageUrl(email, finalDisplayName).then(url => {
      setProfileImageUrl(url);
    });
  }, [email, finalDisplayName]);

  const handleImageError = () => {
    setImageError(true);
  };

  const initials = getInitials(email, finalDisplayName);
  const backgroundColor = getAvatarColor(email);
  const showImage = profileImageUrl && !imageError;

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium border border-white -ml-1 first:ml-0 ${className}`}
      style={{ 
        backgroundColor: showImage ? 'transparent' : backgroundColor,
        color: showImage ? 'transparent' : 'white'
      }}
      title={finalDisplayName || email}
    >
      {showImage ? (
        <img
          src={profileImageUrl}
          alt={finalDisplayName || email}
          className="w-full h-full rounded-full object-cover"
          onError={handleImageError}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default AttendeeAvatar;