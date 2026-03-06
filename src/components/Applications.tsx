import { useAuth } from "../context/AuthContext";
import type { Application } from "../types/auth";
import { LazyApplicationCard } from "./LazyApplicationCard";
import { useState, useEffect, useRef, useCallback } from "react";
import { createSocket } from "../hooks/socket";
import { DIRECTOR, MANAGER, roles, ROP } from "../constants";

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

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

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

        if (Notification.permission === "granted") {
          new Notification("Новая заявка!", {
            body: `Заявка: ${newApp.name || "Без названия"}\nОт: ${newApp.Creator?.username || MANAGER}`,
            icon: "/favicon.ico",
            tag: `new-app-${newApp.id}`,
          });
        }
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

        if (Notification.permission === "granted") {
          new Notification("Заявка обновлена!", {
            body: `Заявка: ${appName}\nИзменения от: ${updaterName}`,
            icon: "/favicon.ico",
            tag: `update-app-${updatedApp.id}`,
          });
        }
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

          if (Notification.permission === "granted") {
            try {
              const notification = new Notification("Заявка удалена!", {
                body: `Заявка "${appName}" была удалена из системы пользователем ${deleterName}`,
                icon: "/favicon.ico",
                tag: `delete-app-${payload.id}`,
                requireInteraction: true,
              });

              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            } catch (notifError) {
              console.error("Ошибка при отправке уведомления:", notifError);
            }
          }
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
      ) : applications.length === 0 ? (
        <div className="cards-errors">Нет заявок</div>
      ) : (
        <>
          <div className="cards__block">
            {applications.slice(0, visibleCount).map((application, index) => {
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

          {hasMore && visibleCount < applications.length && (
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
