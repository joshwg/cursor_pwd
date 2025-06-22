
export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface PasswordEntry {
  id: string;
  userId: string;
  site: string;
  username: string;
  password: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}
