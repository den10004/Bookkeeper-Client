import { useState } from "react";

const mockRequests = [
  {
    id: 1,
    title: "Заявка на ремонт принтера",
    status: "Новая",
    date: "2025-02-10",
  },
  { id: 2, title: "Запрос на отпуск", status: "В работе", date: "2025-02-09" },
  {
    id: 3,
    title: "Покупка нового монитора",
    status: "Выполнена",
    date: "2025-02-05",
  },
  {
    id: 4,
    title: "Доступ к облачному хранилищу",
    status: "Новая",
    date: "2025-02-12",
  },
];

function RequestsList({ onLogout }) {
  const [requests] = useState(mockRequests);

  return (
    <div className="requests-page">
      <div className="header">
        <h1>Список заявок</h1>
        <button onClick={onLogout} className="logout-btn">
          Выйти
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Статус</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.title}</td>
              <td className={`status ${req.status.toLowerCase()}`}>
                {req.status}
              </td>
              <td>{req.date}</td>
              <td>
                <button>Исправить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {requests.length === 0 && <p>Заявок пока нет</p>}
    </div>
  );
}

export default RequestsList;
