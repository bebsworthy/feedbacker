/**
 * Header component for demo application
 */

import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export const Header: React.FC<HeaderProps> = React.memo(({ title, subtitle }) => {
  return (
    <header className="demo-header">
      <h1>{title}</h1>
      <p className="subtitle">{subtitle}</p>
    </header>
  );
});