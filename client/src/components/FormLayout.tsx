import React from 'react';

interface FormLayoutProps {
  children: React.ReactNode;
}

export function FormLayout({ children }: FormLayoutProps) {
  return (
    <div className="bg-background min-h-screen">
      <div className="container py-6">
        {children}
      </div>
    </div>
  );
}