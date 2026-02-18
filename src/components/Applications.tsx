export default function Applications({ loadingApps, appsError, applications }) {
  console.log(applications);

  const downloadFile = (fileData, downloadLink, e) => {
    e.stopPropagation();

    if (!downloadLink || !downloadLink.url) {
      console.error("Ссылка для скачивания отсутствует");
      return;
    }

    const link = document.createElement("a");
    link.href = downloadLink.url;
    link.download = fileData.original || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          {applications.map((app) => (
            <div
              key={app.id}
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
                transition: "box-shadow 0.3s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ margin: 0 }}>{app.name || "Без названия"}</h3>{" "}
              </div>

              {app.Creator?.username && (
                <p
                  style={{
                    margin: "10px 0",
                    color: "#555",
                    lineHeight: "1.5",
                  }}
                >
                  Создано: {app.Creator.username}
                </p>
              )}

              {app.AssignedAccountant?.username && (
                <p
                  style={{
                    margin: "10px 0",
                    color: "#555",
                    lineHeight: "1.5",
                  }}
                >
                  Назначено: {app.AssignedAccountant.username}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  fontSize: "0.85rem",
                  color: "#777",
                  marginTop: "10px",
                }}
              >
                {app.createdAt && (
                  <span>
                    📅 Создано: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  fontSize: "0.85rem",
                  color: "#777",
                  marginTop: "10px",
                }}
              >
                {app.organization && (
                  <span>Организация: {app.organization}</span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  fontSize: "0.85rem",
                  color: "#777",
                  marginTop: "10px",
                }}
              >
                {app.quantity && <span>Количество лидов: {app.quantity}</span>}
              </div>

              {app.cost && (
                <p
                  style={{
                    margin: "10px 0",
                    color: "#555",
                    lineHeight: "1.5",
                  }}
                >
                  Стоимость лида: {app.cost}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  fontSize: "0.85rem",
                  color: "#777",
                  marginTop: "10px",
                }}
              >
                {app.comment && <span>Комментарии: {app.comment}</span>}
              </div>

              {app.files && app.files.length > 0 && (
                <div>
                  <p style={{ marginBottom: "5px", fontWeight: "500" }}>
                    Файлы:
                  </p>
                  {app.files.map((file, index) => {
                    const downloadLink =
                      app.downloadLinks && app.downloadLinks[index];

                    return (
                      <div
                        key={index}
                        onClick={(e) => downloadFile(file, downloadLink, e)}
                        style={{
                          padding: "8px",
                          marginBottom: "5px",
                          backgroundColor: "#f5f5f5",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          cursor: downloadLink ? "pointer" : "default",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (downloadLink) {
                            e.currentTarget.style.backgroundColor = "#e9e9e9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: "500" }}>
                          {file.original}
                          {downloadLink && " ⬇️"}
                        </p>
                        <p
                          style={{
                            margin: "3px 0 0 0",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          Размер: {(file.size / 1024).toFixed(2)} KB
                        </p>
                        {!downloadLink && (
                          <p
                            style={{
                              margin: "3px 0 0 0",
                              fontSize: "12px",
                              color: "#ff6b6b",
                            }}
                          >
                            Ссылка для скачивания недоступна
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px",
                  borderTop: "1px solid #eee",
                  paddingTop: "15px",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Редактирование заявки:", app.id);
                  }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Редактировать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
