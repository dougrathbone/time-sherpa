import React, { useState, useEffect } from 'react';
import { getProfileImageUrl, getInitials, getAvatarColor } from '../utils/profileImages';

interface AttendeeAvatarProps {
  email: string;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function AttendeeAvatar({ email, displayName, size = 'sm', className = '' }: AttendeeAvatarProps) {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  useEffect(() => {
    getProfileImageUrl(email, displayName).then(url => {
      setProfileImageUrl(url);
    });
  }, [email, displayName]);

  const handleImageError = () => {
    setImageError(true);
  };

  const initials = getInitials(email, displayName);
  const backgroundColor = getAvatarColor(email);
  const showImage = profileImageUrl && !imageError;

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium border border-white -ml-1 first:ml-0 ${className}`}
      style={{ 
        backgroundColor: showImage ? 'transparent' : backgroundColor,
        color: showImage ? 'transparent' : 'white'
      }}
      title={displayName || email}
    >
      {showImage ? (
        <img
          src={profileImageUrl}
          alt={displayName || email}
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