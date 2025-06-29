
import { PasswordEntry, Tag } from '../types';

export const checkPasswordExists = (
  passwords: PasswordEntry[],
  site: string,
  username: string,
  userId: string,
  excludeId?: string
): boolean => {
  return passwords.some(p => 
    p.site.toLowerCase() === site.toLowerCase() &&
    p.username.toLowerCase() === username.toLowerCase() &&
    p.userId === userId &&
    p.id !== excludeId
  );
};

export const checkTagExists = (
  tags: Tag[],
  name: string,
  userId: string,
  excludeId?: string
): boolean => {
  return tags.some(t => 
    t.name.toLowerCase() === name.toLowerCase() &&
    t.userId === userId &&
    t.id !== excludeId
  );
};

export const sortAlphabetically = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
};

export const sortPasswordsAlphabetically = (passwords: PasswordEntry[]): PasswordEntry[] => {
  return [...passwords].sort((a, b) => a.site.toLowerCase().localeCompare(b.site.toLowerCase()));
};

export const limitResults = <T>(items: T[], limit: number = 100): T[] => {
  return items.slice(0, limit);
};

export const exportToCsv = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
