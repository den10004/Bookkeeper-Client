import type { Application, User } from "../types/auth";

const API_BASE = "http://localhost:3000";

class ApiService {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Не авторизован");
      }
      if (response.status === 403) {
        throw new Error("Доступ запрещен");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
    }
    return response.json();
  }

  async getApplications(token: string): Promise<Application[]> {
    try {
      const response = await fetch(`${API_BASE}/protected/applications`, {
        method: "GET",
        headers: this.getHeaders(token),
        credentials: "include",
      });
      return this.handleResponse<Application[]>(response);
    } catch (error) {
      console.error("Ошибка при получении заявок:", error);
      throw error;
    }
  }

  async getUsersByRole(role: string, token: string): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE}/protected/accountants`, {
        method: "GET",
        headers: this.getHeaders(token),
        credentials: "include",
      });
      return this.handleResponse<User[]>(response);
    } catch (error) {
      console.error(
        `Ошибка при получении пользователей с ролью ${role}:`,
        error,
      );
      throw error;
    }
  }

  async createApplication(
    token: string,
    data: Partial<Application> | FormData,
  ): Promise<Application> {
    try {
      const isFormData = data instanceof FormData;

      const response = await fetch(`${API_BASE}/protected/applications`, {
        method: "POST",
        headers: isFormData
          ? { Authorization: `Bearer ${token}` }
          : this.getHeaders(token),
        credentials: "include",
        body: isFormData ? data : JSON.stringify(data),
      });

      return this.handleResponse<Application>(response);
    } catch (error) {
      console.error("Ошибка при создании заявки:", error);
      throw error;
    }
  }

  async updateApplication(
    token: string,
    id: string,
    data: Partial<Application> | FormData,
  ): Promise<Application> {
    try {
      const isFormData = data instanceof FormData;

      const response = await fetch(`${API_BASE}/protected/applications/${id}`, {
        method: "PUT",
        headers: isFormData
          ? { Authorization: `Bearer ${token}` }
          : this.getHeaders(token),
        credentials: "include",
        body: isFormData ? data : JSON.stringify(data),
      });

      return this.handleResponse<Application>(response);
    } catch (error) {
      console.error("Ошибка при обновлении заявки:", error);
      throw error;
    }
  }

  async deleteApplication(token: string, id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/protected/applications/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(token),
        credentials: "include",
      });
      return this.handleResponse<void>(response);
    } catch (error) {
      console.error("Ошибка при удалении заявки:", error);
      throw error;
    }
  }
}

export const api = new ApiService();
