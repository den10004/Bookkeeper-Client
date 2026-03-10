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

// Простой сервис уведомлений без Service Worker
const NotificationService = {
  // Проверка поддержки
  isSupported(): boolean {
    return "Notification" in window;
  },

  // Инициализация (запрос разрешения)
  async init(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log("❌ Уведомления не поддерживаются");
      return false;
    }

    // Если уже есть разрешение
    if (Notification.permission === "granted") {
      console.log("✅ Разрешение на уведомления уже есть");
      return true;
    }

    // Если еще не спрашивали - запрашиваем
    if (Notification.permission === "default") {
      try {
        console.log("📨 Запрашиваем разрешение на уведомления...");
        const permission = await Notification.requestPermission();
        console.log("📨 Разрешение получено:", permission);
        return permission === "granted";
      } catch (error) {
        console.error("❌ Ошибка при запросе разрешения:", error);
        return false;
      }
    }

    // Если запрещено
    console.log("❌ Уведомления запрещены пользователем");
    return false;
  },

  // Отправка уведомления (только простой способ, без Service Worker)
  send(
    title: string,
    options: { body?: string; tag?: string; onClick?: () => void } = {},
  ): boolean {
    // Проверяем поддержку и разрешение
    if (!this.isSupported() || Notification.permission !== "granted") {
      console.log("❌ Нельзя отправить уведомление:", {
        supported: this.isSupported(),
        permission: Notification.permission,
      });
      return false;
    }

    try {
      // Создаем уведомление как в тесте 1
      const notification = new Notification(title, {
        body: options.body || "",
        icon: "/favicon.ico",
        tag: options.tag || `notify-${Date.now()}`,
        requireInteraction: true, // Важно для Windows
        silent: false, // Со звуком
      });

      // Обработчик клика
      if (options.onClick) {
        notification.onclick = options.onClick;
      } else {
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      console.log("✅ Уведомление отправлено:", title);
      return true;
    } catch (error) {
      console.error("❌ Ошибка при отправке уведомления:", error);
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
  const [notificationsReady, setNotificationsReady] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const socketRef = useRef<ReturnType<typeof createSocket>>(null);

  // Инициализация уведомлений при загрузке
  useEffect(() => {
    NotificationService.init().then((ready) => {
      setNotificationsReady(ready);
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

  // Функция для показа уведомления
  const showNotification = (
    type: "created" | "updated" | "deleted",
    app:
      | Application
      | { id: string | number; name?: string; deletedByUsername?: string },
  ) => {
    if (!notificationsReady) {
      console.log("📱 Уведомления не готовы, пропускаем");
      return;
    }

    let title = "";
    let body = "";
    let tag = "";

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

    // Отправляем уведомление (простой способ)
    NotificationService.send(title, {
      body,
      tag,
      onClick: () => {
        window.focus();
        console.log("👆 Уведомление кликнуто, заявка:", app.id);
        // Здесь можно добавить навигацию к заявке
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
  }, [auth?.accessToken, auth?.user?.id, auth?.user?.role, notificationsReady]);

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
