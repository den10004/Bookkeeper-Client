export const roles = {
  accountant: "бухгалтер",
  director: "директор",
  manager: "менеджер",
  rop: "роп",
} as const;

export const errorDictionary: Record<string, string> = {
  "username must be unique": "Пользователь с таким именем уже существует",
  "email must be unique": "Пользователь с таким email уже существует",
  "Validation error": "Ошибка валидации данных",
  "Network Error": "Ошибка соединения с сервером",
  "Failed to fetch": "Не удалось связаться с сервером",
  Unauthorized: "Не авторизован",
  Forbidden: "Доступ запрещён",
  "Not Found": "Пользователь не найден",
  "Internal Server Error": "Внутренняя ошибка сервера",
};

export const REQUEST_TYPES = {
  NEW_CLIENT: "new_client",
  EXISTING_CLIENT: "existing_client",
  DOCUMENT_REQUEST: "document_request",
} as const;

export const DOCUMENT_TYPES = {
  WORK_CERTIFICATE: "work_certificate",
  RECONCILIATION_ACT: "reconciliation_act",
} as const;

export const DOCUMENT_FORMATS = {
  PDF: "pdf",
  EDO: "edo",
} as const;

export const APPLICATION_STATUSES = {
  NEW: "new",
  UPDATED: "updated",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REJECTED: "rejected",
};
export const STATUS_LABELS = {
  [APPLICATION_STATUSES.NEW]: "Новая",
  [APPLICATION_STATUSES.UPDATED]: "Обновлена",
  [APPLICATION_STATUSES.ACCEPTED]: "Принята",
  [APPLICATION_STATUSES.IN_PROGRESS]: "В работе",
  [APPLICATION_STATUSES.COMPLETED]: "Завершена",
  [APPLICATION_STATUSES.REJECTED]: "Отклонена",
};

export const DIRECTOR = "director";
export const ACCOUNTANT = "accountant";
export const MANAGER = "manager";
export const ROP = "rop";
