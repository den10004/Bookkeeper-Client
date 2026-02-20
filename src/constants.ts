export const roles = {
  accountant: "бухгалтер",
  director: "директор",
  manager: "менеджер",
};

export const errorDictionary: Record<string, string> = {
  "username must be unique": "Пользователь с таким именем уже существует",
  "email must be unique": "Пользователь с таким email уже существует",
  "Validation error": "Ошибка валидации данных",
  "Network Error": "Ошибка соединения с сервером",
  "Failed to fetch": "Не удалось связаться с сервером",
  Unauthorized: "Не авторизован",
  Forbidden: "Доступ запрещен",
  "Not Found": "Пользователь не найден",
  "Internal Server Error": "Внутренняя ошибка сервера",
};
