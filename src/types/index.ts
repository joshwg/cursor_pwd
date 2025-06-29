
export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin?: Date;
  encryptionKey?: string;
}

export interface PasswordEntry {
  id: string;
  userId: string;
  site: string;
  username: string;
  password: string;
  tagIds: string[]; // Changed from tags to tagIds for many-to-many relationship
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  salt?: string; // For per-password encryption salt
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

export interface PasswordTag {
  passwordId: string;
  tagId: string;
}
