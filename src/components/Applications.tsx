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

// 🔧 Утилита для надежной отправки уведомлений
const NotificationService = {
  // Проверка поддержки
  isSupported(): boolean {
    return "Notification" in window;
  },

  // Получение статуса
  getPermission(): NotificationPermission {
    return this.isSupported() ? Notification.permission : "denied";
  },

  // Запрос разрешения при старте
  async init(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log("❌ Уведомления не поддерживаются");
      return false;
    }

    if (Notification.permission === "granted") {
      console.log("✅ Разрешение уже есть");
      return true;
    }

    if (Notification.permission === "default") {
      console.log("📨 Запрашиваем разрешение...");
      try {
        const permission = await Notification.requestPermission();
        console.log("📨 Результат:", permission);
        return permission === "granted";
      } catch (error) {
        console.error("❌ Ошибка запроса:", error);
        return false;
      }
    }

    console.log("❌ Уведомления запрещены пользователем");
    return false;
  },

  // Отправка уведомления
  async send(
    title: string,
    options: NotificationOptions & { onClick?: () => void } = {},
  ): Promise<boolean> {
    if (!this.isSupported()) {
      console.log("❌ Уведомления не поддерживаются");
      return false;
    }

    // Проверяем разрешение
    if (Notification.permission !== "granted") {
      console.log("❌ Нет разрешения, статус:", Notification.permission);
      return false;
    }

    try {
      // Стандартные опции для надежности
      const defaultOptions: NotificationOptions = {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        silent: false,
        requireInteraction: true, // Критично для Windows
        tag: `notify-${Date.now()}`,
        ...options,
      };

      // Пытаемся отправить через Service Worker (надежнее для фоновых вкладок)
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, defaultOptions);
          console.log("✅ Уведомление через Service Worker");
          return true;
        } catch (swError) {
          console.log(
            "⚠️ Service Worker уведомление не сработало, пробуем обычное:",
            swError,
          );
        }
      }

      // Fallback на обычное уведомление
      const notification = new Notification(title, defaultOptions);

      if (options.onClick) {
        notification.onclick = options.onClick;
      } else {
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      notification.onerror = (error) => {
        console.error("❌ Ошибка показа уведомления:", error);
      };

      console.log("✅ Обычное уведомление отправлено");
      return true;
    } catch (error) {
      console.error("❌ Критическая ошибка уведомления:", error);
      return false;
    }
  },
};

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
  const [notificationReady, setNotificationReady] = useState(false);

  // Инициализируем уведомления при монтировании
  useEffect(() => {
    NotificationService.init().then((ready) => {
      setNotificationReady(ready);
      if (ready) {
        console.log("🚀 Уведомления готовы к работе");
      }
    });
  }, []);

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

  // Универсальная функция показа уведомления
  const showNotification = async (
    type: "created" | "updated" | "deleted",
    app:
      | Application
      | { id: string | number; name?: string; deletedByUsername?: string },
  ) => {
    if (!notificationReady) {
      console.log("📱 Уведомления не готовы, пропускаем");
      return;
    }

    let title = "";
    let body = "";
    let tag = "";

    // Формируем сообщение в зависимости от типа
    switch (type) {
      case "created":
        title = "📋 Новая заявка!";
        body = `Заявка: ${(app as Application).name || "Без названия"}\nОт: ${(app as Application).Creator?.username || "Пользователь"}`;
        tag = `new-app-${app.id}`;
        break;

      case "updated":
        title = "✏️ Заявка обновлена!";
        body = `Заявка: ${(app as Application).name || "Без названия"}\nИзменения от: ${(app as Application).Updater?.username || "Пользователь"}`;
        tag = `update-app-${app.id}`;
        break;

      case "deleted":
        title = "🗑️ Заявка удалена!";
        body = `Заявка "${app.name || "Заявка"}" была удалена пользователем ${(app as any).deletedByUsername || "Пользователь"}`;
        tag = `delete-app-${app.id}`;
        break;
    }

    // Отправляем уведомление ВСЕГДА, независимо от активности вкладки
    console.log(`📨 Отправка уведомления [${type}]:`, {
      title,
      body,
      tabActive: document.hasFocus(),
      tabVisible: document.visibilityState,
    });

    await NotificationService.send(title, {
      body,
      tag,
      icon: "/favicon.ico",
      onClick: () => {
        window.focus();
        console.log("👆 Уведомление кликнуто, переходим к заявке", app.id);
        // Можно добавить навигацию к конкретной заявке
        // Например: navigateToApplication(app.id)
      },
    });
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
        showNotification("created", newApp);
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

      if (currentUserId === updaterId) return;

      const shouldNotify =
        currentUserId &&
        (currentUserRole === DIRECTOR ||
          currentUserRole === ROP ||
          (updatedApp.assignedAccountantId &&
            updatedApp.assignedAccountantId === currentUserId) ||
          (creatorId && creatorId === currentUserId));

      if (shouldNotify) {
        showNotification("updated", updatedApp);
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
          showNotification("deleted", payload);
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
  }, [auth?.accessToken, auth?.user?.id, auth?.user?.role, notificationReady]);

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
