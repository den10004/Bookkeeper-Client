import { useAuth } from "../context/AuthContext";
import type { Application } from "../types/auth";
import { LazyApplicationCard } from "./LazyApplicationCard";
import { useState, useEffect, useRef, useCallback } from "react";
import { createSocket } from "../hooks/socket";
import { MANAGER, roles, ROP, DIRECTOR } from "../constants";

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
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Разрешение на уведомления:", permission);
        if (permission === "granted") {
          console.log("Уведомления разрешены!");
        } else if (permission === "denied") {
          console.warn("Пользователь запретил уведомления");
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!auth?.accessToken) return;

    const socket = createSocket(auth.accessToken);
    if (!socket) return;

    socket.connect();

    socket.on("application:created", (newApp: Application) => {
      setApplications((prev) => {
        if (prev.some((a) => a.id === newApp.id)) return prev;
        return [newApp, ...prev];
      });

      const currentUserId = auth?.user?.id;
      const currentUserRole = auth?.user?.role;
      const creatorId = newApp.userId; // ID создателя заявки

      // Создатель НЕ должен получать уведомление о своей заявке
      if (currentUserId === creatorId) return;

      // Кто должен получать уведомления:
      // 1. Директор
      // 2. РОП
      // 3. Назначенный бухгалтер (если есть)
      const shouldNotify =
        currentUserId &&
        (currentUserRole === roles.director ||
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
      setApplications((prev) =>
        prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)),
      );

      const currentUserId = auth?.user?.id;
      const currentUserRole = auth?.user?.role;
      const updaterId = updatedApp.updatedBy; // Кто обновил заявку
      const creatorId = updatedApp.userId; // Кто создал заявку

      // Тот, кто обновил заявку, НЕ должен получать уведомление
      if (currentUserId === updaterId) return;

      // Кто должен получать уведомления:
      // 1. Директор
      // 2. РОП
      // 3. Назначенный бухгалтер
      // 4. Создатель заявки (но только если это не он обновил)
      const shouldNotify =
        currentUserId &&
        (currentUserRole === roles.director ||
          currentUserRole === ROP ||
          (updatedApp.assignedAccountantId &&
            updatedApp.assignedAccountantId === currentUserId) ||
          (creatorId && creatorId === currentUserId));

      if (shouldNotify) {
        const appName = updatedApp.name || "Без названия";
        const updaterName = updatedApp.Updater?.username || MANAGER;

        setToast({
          message: `Заявка обновлена: ${appName} (изменения от ${updaterName})`,
          type: "success",
        });

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
      (payload: { id: string | number; deletedBy?: number }) => {
        const deletedId = String(payload.id);

        setApplications((prev) =>
          prev.filter((a) => String(a.id) !== deletedId),
        );

        const currentUserId = auth?.user?.id;
        const currentUserRole = auth?.user?.role;
        const deleterId = payload.deletedBy; // Кто удалил заявку

        // Тот, кто удалил заявку, НЕ должен получать уведомление
        if (currentUserId === deleterId) return;

        // Директор и РОП получают уведомления об удалении
        const shouldNotify =
          currentUserId &&
          (currentUserRole === roles.director || currentUserRole === ROP);

        if (shouldNotify) {
          setToast({
            message: `Заявка с ID ${payload.id} была удалена из системы`,
            type: "warning",
          });

          if (Notification.permission === "granted") {
            new Notification("Заявка удалена!", {
              body: `Заявка с ID ${payload.id} была удалена из системы`,
              icon: "/favicon.ico",
              tag: `delete-app-${payload.id}`,
            });
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
                  <div
                    ref={index === visibleCount - 1 ? lastCardRef : null}
                    key={application.id}
                  >
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
