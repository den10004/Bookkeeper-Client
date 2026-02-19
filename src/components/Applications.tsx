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
      <h2 style={{ marginBottom: "20px" }}>Заявки</h2>

      {loadingApps ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          Загрузка заявок...
        </div>
      ) : appsError ? (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "red",
            backgroundColor: "#ffeeee",
            borderRadius: "4px",
          }}
        >
          <p>{appsError}</p>
        </div>
      ) : applications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#f9f9f9",
            borderRadius: "4px",
            color: "#666",
          }}
        >
          Нет заявок
        </div>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
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
