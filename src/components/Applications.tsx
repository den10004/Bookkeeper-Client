import { useAuth } from "../context/AuthContext";
import type { Application } from "../types/auth";
import { LazyApplicationCard } from "./LazyApplicationCard";
import { useState, useEffect, useRef, useCallback } from "react";
import { createSocket } from "../hooks/socket";
import { DIRECTOR, MANAGER, ROP, ACCOUNTANT } from "../constants";

interface ApplicationsProps {
  loadingApps: boolean;
  appsError: string | null;
  applications: Application[];
  onApplicationUpdated?: (
    updatedFields: Partial<Application> & { id: string },
  ) => void;
  onApplicationsUpdate?: () => void;
}

export default function Applications({
  loadingApps,
  appsError,
  applications: initialApplications,
  onApplicationUpdated,
  onApplicationsUpdate,
}: ApplicationsProps) {
  const { auth } = useAuth();
  const [applications, setApplications] =
    useState<Application[]>(initialApplications);
  const [visibleCount, setVisibleCount] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const socketRef = useRef<ReturnType<typeof createSocket>>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "warning" | "error";
  } | null>(null);

  // 🔍 ОТЛАДКА: Проверяем поддержку уведомлений при монтировании компонента
  useEffect(() => {
    console.group("🔍 Notification Debug");
    console.log(
      "1. Поддерживает ли браузер уведомления?",
      "Notification" in window,
    );

    if ("Notification" in window) {
      console.log("2. Текущий статус permission:", Notification.permission);
      console.log("3. Тип значения:", typeof Notification.permission);
      console.log("4. Длина строки:", Notification.permission.length);
      console.log(
        "5. Код символов:",
        [...Notification.permission].map((c) => c.charCodeAt(0)),
      );

      // Проверяем на скрытые символы
      const permissionValue = Notification.permission;
      const isExactMatch = permissionValue === "granted";
      const isLooseMatch = permissionValue.trim() === "granted";

      console.log('6. Точное совпадение с "granted":', isExactMatch);
      console.log("7. Совпадение после trim():", isLooseMatch);

      if (!isExactMatch && isLooseMatch) {
        console.warn("⚠️ Обнаружены пробельные символы в значении permission!");
      }
    }

    // Проверяем настройки Windows (только для Chrome)
    const isChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isWindows = navigator.platform.includes("Win");

    if (isChrome && isWindows) {
      console.log("8. Браузер: Chrome на Windows");
      console.log("9. User Agent:", navigator.userAgent);
      console.log(
        "10. Версия Chrome:",
        navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1],
      );
    }

    console.groupEnd();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const lastCardRef = useCallback(
    (node: HTMLDivElement) => {
      if (loadingApps) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prevCount) => {
            const newCount = prevCount + 10;
            setHasMore(newCount < applications.length);
            return newCount;
          });
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingApps, hasMore, applications.length],
  );

  const filteredApplications = applications.filter((app) => {
    const userRole = auth?.user?.role;
    const userId = auth?.user?.id;

    if (userRole === DIRECTOR || userRole === ROP) {
      return true;
    }

    if (userRole === MANAGER || userRole === ACCOUNTANT) {
      return app.userId === userId || app.assignedAccountantId === userId;
    }

    return true;
  });

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  // 🔧 Функция для безопасной отправки уведомлений
  const sendSafeNotification = (
    title: string,
    options: NotificationOptions,
  ) => {
    // Проверка поддержки
    if (!("Notification" in window)) {
      console.log("❌ Уведомления не поддерживаются браузером");
      return false;
    }

    // 🔍 Детальная отладка перед отправкой
    console.group("🔔 Попытка отправки уведомления");
    console.log("Title:", title);
    console.log("Permission status:", Notification.permission);
    console.log("Permission type:", typeof Notification.permission);
    console.log("Permission length:", Notification.permission.length);
    console.log(
      "Permission chars:",
      [...Notification.permission].map((c) => c.charCodeAt(0)),
    );

    // Пробуем разные способы проверки
    const strictCheck = Notification.permission === "granted";
    const trimCheck = Notification.permission.trim() === "granted";
    const lowerCheck = Notification.permission.toLowerCase() === "granted";

    console.log("Строгая проверка (===):", strictCheck);
    console.log("Проверка с trim():", trimCheck);
    console.log("Проверка с toLowerCase():", lowerCheck);

    // Если есть невидимые символы, используем более гибкую проверку
    const isGranted = trimCheck || lowerCheck;

    if (!isGranted) {
      console.log("❌ Нет разрешения на уведомления");

      // Если статус "default", пробуем запросить разрешение
      if (
        Notification.permission === "default" ||
        Notification.permission.trim() === "default"
      ) {
        console.log("📨 Запрашиваем разрешение...");
        Notification.requestPermission().then((permission) => {
          console.log("Новый статус после запроса:", permission);
          if (permission === "granted") {
            // Повторяем отправку
            try {
              new Notification(title, options);
              console.log("✅ Уведомление отправлено после запроса разрешения");
            } catch (e) {
              console.error("❌ Ошибка при отправке:", e);
            }
          }
        });
      }

      console.groupEnd();
      return false;
    }

    // Пробуем отправить уведомление
    try {
      const notification = new Notification(title, {
        ...options,
        silent: false, // Явно включаем звук
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error("❌ Ошибка при показе уведомления:", error);
      };

      console.log("✅ Уведомление успешно создано");
      console.groupEnd();
      return true;
    } catch (error) {
      console.error("❌ Ошибка при создании уведомления:", error);
      console.groupEnd();
      return false;
    }
  };

  useEffect(() => {
    if (!auth?.accessToken) return;

    const socket = createSocket(auth.accessToken);
    if (!socket) return;

    socket.connect();
    socketRef.current = socket;

    socket.on("application:created", (newApp: Application) => {
      setApplications((prev) => {
        if (prev.some((a) => a.id === newApp.id)) return prev;
        return [newApp, ...prev];
      });

      const currentUserId = auth?.user?.id;
      const currentUserRole = auth?.user?.role;
      const creatorId = newApp.userId;
      if (currentUserId === creatorId) return;

      const shouldNotify =
        currentUserId &&
        (currentUserRole === DIRECTOR ||
          currentUserRole === ROP ||
          (newApp.assignedAccountantId &&
            newApp.assignedAccountantId === currentUserId));

      if (shouldNotify) {
        setToast({
          message: `Новая заявка: ${newApp.name || "Без названия"}\nОт: ${newApp.Creator?.username || MANAGER}`,
          type: "success",
        });

        // 🔔 Используем нашу новую функцию с отладкой
        sendSafeNotification("Новая заявка!", {
          body: `Заявка: ${newApp.name || "Без названия"}\nОт: ${newApp.Creator?.username || MANAGER}`,
          icon: "/favicon.ico",
          tag: `new-app-${newApp.id}`,
          requireInteraction: false,
        });
      }
    });

    socket.on("application:updated", (updatedApp: Application) => {
      setApplications((prev) => {
        const exists = prev.some((a) => a.id === updatedApp.id);
        if (!exists) {
          return [...prev, updatedApp];
        }

        return prev.map((a) => (a.id === updatedApp.id ? updatedApp : a));
      });

      const currentUserId = auth?.user?.id;
      const currentUserRole = auth?.user?.role;
      const updaterId = updatedApp.updatedBy;
      const creatorId = updatedApp.userId;

      if (currentUserId === updaterId) {
        return;
      }

      const shouldNotify =
        currentUserId &&
        (currentUserRole === DIRECTOR ||
          currentUserRole === ROP ||
          (updatedApp.assignedAccountantId &&
            updatedApp.assignedAccountantId === currentUserId) ||
          (creatorId && creatorId === currentUserId));

      if (shouldNotify) {
        const appName = updatedApp.name || "Без названия";
        const updaterName = updatedApp.Updater?.username || MANAGER;

        // 🔔 Используем нашу новую функцию с отладкой
        sendSafeNotification("Заявка обновлена!", {
          body: `Заявка: ${appName}\nИзменения от: ${updaterName}`,
          icon: "/favicon.ico",
          tag: `update-app-${updatedApp.id}`,
          requireInteraction: false,
        });
      }
    });

    socket.on(
      "application:deleted",
      (payload: {
        id: string | number;
        deletedBy?: number;
        name?: string;
        deletedByUsername?: string;
      }) => {
        const deletedId = String(payload.id);
        setApplications((prev) => {
          return prev.filter((a) => String(a.id) !== deletedId);
        });

        const currentUserId = auth?.user?.id;
        const deleterId = payload.deletedBy;
        if (currentUserId !== deleterId) {
          const appName = payload.name || "Заявка";
          const deleterName = payload.deletedByUsername || "Пользователь";

          // 🔔 Используем нашу новую функцию с отладкой
          sendSafeNotification("Заявка удалена!", {
            body: `Заявка "${appName}" была удалена из системы пользователем ${deleterName}`,
            icon: "/favicon.ico",
            tag: `delete-app-${payload.id}`,
            requireInteraction: true,
          });
        }
      },
    );

    return () => {
      socket.off("application:created");
      socket.off("application:updated");
      socket.off("application:deleted");
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auth?.accessToken, auth?.user?.id, auth?.user?.role]);

  return (
    <div>
      <h2>Заявки</h2>

      {loadingApps ? (
        <div className="cards-errors">Загрузка заявок...</div>
      ) : appsError ? (
        <div className="cards-errors">
          <p>{appsError}</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="cards-errors">
          {auth?.user?.role === MANAGER || auth?.user?.role === ACCOUNTANT
            ? "У вас нет доступных заявок"
            : "Нет заявок"}
        </div>
      ) : (
        <>
          <div className="cards__block">
            {filteredApplications
              .slice(0, visibleCount)
              .map((application, index) => {
                const preload = index < 3;

                if (index === visibleCount - 1) {
                  return (
                    <div ref={lastCardRef} key={application.id}>
                      <LazyApplicationCard
                        application={application}
                        onApplicationUpdated={onApplicationUpdated}
                        onApplicationsUpdate={onApplicationsUpdate}
                        preload={preload}
                      />
                    </div>
                  );
                }

                return (
                  <LazyApplicationCard
                    key={application.id}
                    application={application}
                    onApplicationUpdated={onApplicationUpdated}
                    onApplicationsUpdate={onApplicationsUpdate}
                    preload={preload}
                  />
                );
              })}
          </div>

          {hasMore && visibleCount < filteredApplications.length && (
            <div className="loading-more">
              <div className="loading-spinner"></div>
              <span>Загрузка еще заявок...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
