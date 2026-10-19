import React from 'react';

interface InstallButtonProps {
  variant?: 'navbar' | 'footer' | 'default' | 'pill' | 'mobile-menu';
  className?: string;
  onNavigate?: (page: string) => void;
}

export default function InstallButton({ variant = 'default', className = '', onNavigate }: InstallButtonProps) {
  return null;
}
