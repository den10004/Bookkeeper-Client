import { useAuth } from "../context/AuthContext";
import type { Application } from "../types/auth";
import { LazyApplicationCard } from "./LazyApplicationCard";
import { useState, useEffect, useRef, useCallback } from "react";
import { createSocket } from "../hooks/socket";

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

    if (!auth.accessToken) {
      console.warn("Нет токена → сокет не подключается");
      return;
    }

    const socket = createSocket(auth.accessToken);
    if (!socket) return;

    socket.connect();

    socket.on("connect", () => {
      console.log("Socket успешно подключён");
    });

    socket.on("connect_error", (err) => {
      console.error("Ошибка подключения сокета:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Сокет отключён:", reason);
    });

    // твои слушатели
    socket.on("application:created", (newApp) => {
      console.log("Получена новая заявка:", newApp.id);
      setApplications((prev) => [
        newApp,
        ...prev.filter((a) => a.id !== newApp.id),
      ]);
    });

    socket.on("application:updated", (updatedApp) => {
      console.log("Обновлена заявка:", updatedApp.id);
      setApplications((prev) =>
        prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)),
      );
    });

    socket.on("application:deleted", ({ id }) => {
      console.log("Удалена заявка:", id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, [auth?.accessToken]);

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
