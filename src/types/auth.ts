export interface User {
  id: number;
  email: string;
  name?: string;
  username: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  accessToken: string;
}

export interface AuthContextType {
  auth: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refresh?: () => Promise<boolean>;
}
/*
export interface Application {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}
*/

export interface Application {
  id: string;
  name: string;
  organization: string;
  assignedAccountantId: string;
  accountant?: User;
  fileUrl?: string;
  cost?: string;
  quantity?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
