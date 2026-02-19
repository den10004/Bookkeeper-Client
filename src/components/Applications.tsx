import type { Application } from "../types/auth";
import ApplicationCard from "./ApplicationCard";

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
  applications,
  onApplicationUpdated,
  onApplicationsUpdate,
}: ApplicationsProps) {
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
        <div className="cards__block">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onApplicationUpdated={onApplicationUpdated}
              onApplicationsUpdate={onApplicationsUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
