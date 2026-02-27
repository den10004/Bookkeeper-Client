export interface User {
  id: number;
  email: string;
  name?: string;
  username: string;
  role: string;
  password?: string;
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

export interface FileData {
  original: string;
  size: number;
}

export interface DownloadLink {
  url: string;
}

export interface Application {
  id: string;
  name?: string;
  Creator?: {
    username?: string;
  };
  AssignedAccountant?: {
    username?: string;
  };
  createdAt?: string;
  organization?: string;
  quantity?: string;
  cost?: string | string;
  comment?: string;
  files?: FileData[];
  downloadLinks?: DownloadLink[];
}

export interface CreateUserProps {
  onSubmit: (userData: {
    username: string;
    email: string;
    role: string;
    password: string;
  }) => Promise<void>;
  onCancel: () => void;
}
