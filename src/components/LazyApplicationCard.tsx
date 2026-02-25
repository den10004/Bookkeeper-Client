import React, { Suspense, lazy } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import type { Application } from "../types/auth";

const ApplicationCard = lazy(() => import("./ApplicationCard"));

interface LazyApplicationCardProps {
  application: Application;
  onApplicationUpdated?: (
    updatedFields: Partial<Application> & { id: string },
  ) => void;
  onApplicationsUpdate?: () => void;
  preload?: boolean;
}

export const LazyApplicationCard: React.FC<LazyApplicationCardProps> = ({
  application,
  onApplicationUpdated,
  onApplicationsUpdate,
  preload = false,
}) => {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "200px",
    freezeOnceVisible: true,
  });

  const shouldLoad = preload || isVisible;

  return (
    <div ref={elementRef as any} className="lazy-card-container">
      {shouldLoad ? (
        <Suspense fallback={<h3>Загрузка...</h3>}>
          <ApplicationCard
            application={application}
            onApplicationUpdated={onApplicationUpdated}
            onApplicationsUpdate={onApplicationsUpdate}
          />
        </Suspense>
      ) : (
        <h3>Загрузка...</h3>
      )}
    </div>
  );
};
