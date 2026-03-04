import React from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  return (
    <select 
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      {children}
    </select>
  );
};

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <div className={className}>{children}</div>;
export const SelectValue: React.FC<{ placeholder?: string }> = () => null;

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};