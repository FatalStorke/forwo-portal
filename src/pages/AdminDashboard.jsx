import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("clients");

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [answersList, setAnswersList] = useState([]);
  const [uploadsList, setUploadsList] = useState([]);

  const [clientForm, setClientForm] = useState({
    company_name: "",
    authorized_person: "",
    username: "",
    password: "",
    email: "",
    phone: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    task_type: "file",
    options: "",
    allowed_file_types: [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "jpg",
      "jpeg",
      "png",
    ],
    multiple_files: true,
  });

  const [selectedTask, setSelectedTask] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    setClients(data || []);
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    setTasks(data || []);
  };

  const fetchAssignedTasks = async () => {
    const { data } = await supabase
      .from("user_tasks")
      .select(`
        id,
        status,
        created_at,
        users (
          company_name,
          authorized_person
        ),
        tasks (
          title,
          description,
          task_type
        )
      `)
      .order("created_at", { ascending: false });

    setAssignedTasks(data || []);
  };

  const fetchAnswers = async () => {
    const { data } = await supabase
      .from("answers")
      .select(`
        id,
        answer_text,
        selected_option,
        created_at,
        user_tasks (
          id,
          users (
            company_name,
            authorized_person
          ),
          tasks (
            title,
            task_type
          )
        )
      `)
      .order("created_at", { ascending: false });

    setAnswersList(data || []);
  };

  const fetchUploads = async () => {
    const { data } = await supabase
      .from("uploads")
      .select(`
        id,
        file_name,
        file_url,
        uploaded_at,
        user_tasks (
          id,
          users (
            company_name,
            authorized_person
          ),
          tasks (
            title
          )
        )
      `)
      .order("uploaded_at", { ascending: false });

    setUploadsList(data || []);
  };

  useEffect(() => {
    fetchClients();
    fetchTasks();
    fetchAssignedTasks();
    fetchAnswers();
    fetchUploads();
  }, []);

  const createClient = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("users").insert([
      {
        ...clientForm,
        role: "client",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setClientForm({
      company_name: "",
      authorized_person: "",
      username: "",
      password: "",
      email: "",
      phone: "",
    });

    fetchClients();
  };

  const createTask = async (e) => {
    e.preventDefault();

    let formattedOptions = null;

    if (taskForm.task_type === "choice") {
      formattedOptions = taskForm.options
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    const { error } = await supabase.from("tasks").insert([
      {
        title: taskForm.title,
        description: taskForm.description,
        task_type: taskForm.task_type,
        options: formattedOptions,
        allowed_file_types: taskForm.allowed_file_types,
        multiple_files: true,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setTaskForm({
      title: "",
      description: "",
      task_type: "file",
      options: "",
      allowed_file_types: [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "jpg",
        "jpeg",
        "png",
      ],
      multiple_files: true,
    });

    fetchTasks();
  };

  const toggleClientSelection = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(
        selectedClients.filter((id) => id !== clientId)
      );
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const assignTask = async () => {
    const inserts = selectedClients.map((clientId) => ({
      user_id: clientId,
      task_id: selectedTask,
      status: "Bekliyor",
    }));

    const { error } = await supabase
      .from("user_tasks")
      .insert(inserts);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Görev atandı.");
    fetchAssignedTasks();
  };

  const deleteUpload = async (uploadId) => {
    if (!confirm("Dosya silinsin mi?")) return;

    const { error } = await supabase
      .from("uploads")
      .delete()
      .eq("id", uploadId);

    if (error) {
      alert(error.message);
      return;
    }

    fetchUploads();
  };

  const logout = () => {
    localStorage.removeItem("forwo_user");
    window.location.href = "/";
  };

  const getTaskTypeLabel = (type) => {
    if (type === "file") return "Dosya";
    if (type === "text") return "Açık Uçlu";
    if (type === "choice") return "Şıklı";
    return "Görev";
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <aside className="w-72 bg-white border-r min-h-screen p-6">
        <h1 className="text-2xl font-bold text-[#003527]">
          Forwo Enerji
        </h1>

        <p className="text-xs text-gray-500 uppercase tracking-widest mb-8">
          Admin Panel
        </p>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("clients")}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold ${
              activeTab === "clients"
                ? "bg-[#6cf8bb] text-[#003527]"
                : "hover:bg-gray-100"
            }`}
          >
            Müşteriler
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold ${
              activeTab === "tasks"
                ? "bg-[#6cf8bb] text-[#003527]"
                : "hover:bg-gray-100"
            }`}
          >
            Görevler ve Sorular
          </button>

          <button
            onClick={() => setActiveTab("assigned")}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold ${
              activeTab === "assigned"
                ? "bg-[#6cf8bb] text-[#003527]"
                : "hover:bg-gray-100"
            }`}
          >
            Atananlar
          </button>

          <button
            onClick={() => setActiveTab("answers")}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold ${
              activeTab === "answers"
                ? "bg-[#6cf8bb] text-[#003527]"
                : "hover:bg-gray-100"
            }`}
          >
            Cevaplar
          </button>

          <button
            onClick={() => setActiveTab("uploads")}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold ${
              activeTab === "uploads"
                ? "bg-[#6cf8bb] text-[#003527]"
                : "hover:bg-gray-100"
            }`}
          >
            Yüklenen Dosyalar
          </button>

          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-semibold"
          >
            Çıkış Yap
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {activeTab === "clients" && (
          <div>
            <h2 className="text-3xl font-bold text-[#003527] mb-6">
              Müşteri Yönetimi
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form
                onSubmit={createClient}
                className="bg-white border rounded-2xl p-6 space-y-4"
              >
                <input
                  className="w-full border rounded-lg p-3"
                  placeholder="Firma Adı"
                  value={clientForm.company_name}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      company_name: e.target.value,
                    })
                  }
                />

                <input
                  className="w-full border rounded-lg p-3"
                  placeholder="Yetkili"
                  value={clientForm.authorized_person}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      authorized_person: e.target.value,
                    })
                  }
                />

                <input
                  className="w-full border rounded-lg p-3"
                  placeholder="Kullanıcı Adı"
                  value={clientForm.username}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      username: e.target.value,
                    })
                  }
                />

                <input
                  className="w-full border rounded-lg p-3"
                  placeholder="Şifre"
                  value={clientForm.password}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      password: e.target.value,
                    })
                  }
                />

                <button className="w-full bg-[#003527] text-white rounded-lg p-3">
                  Müşteri Oluştur
                </button>
              </form>

              <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4">Firma</th>
                      <th className="p-4">Yetkili</th>
                      <th className="p-4">Kullanıcı</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-t">
                        <td className="p-4">{client.company_name}</td>
                        <td className="p-4">{client.authorized_person}</td>
                        <td className="p-4">{client.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div>
            <h2 className="text-3xl font-bold text-[#003527] mb-6">
              Görev ve Sorular
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form
                onSubmit={createTask}
                className="bg-white border rounded-2xl p-6 space-y-4"
              >
                <select
                  className="w-full border rounded-lg p-3"
                  value={taskForm.task_type}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      task_type: e.target.value,
                    })
                  }
                >
                  <option value="file">Dosya Görevi</option>
                  <option value="text">Açık Uçlu Soru</option>
                  <option value="choice">Şıklı Soru</option>
                </select>

                <input
                  className="w-full border rounded-lg p-3"
                  placeholder="Başlık"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      title: e.target.value,
                    })
                  }
                />

                <textarea
                  className="w-full border rounded-lg p-3"
                  rows="4"
                  placeholder="Açıklama"
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      description: e.target.value,
                    })
                  }
                />

                {taskForm.task_type === "choice" && (
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows="4"
                    placeholder="Şıkları alt alta yazın"
                    value={taskForm.options}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        options: e.target.value,
                      })
                    }
                  />
                )}

                <button className="w-full bg-[#003527] text-white rounded-lg p-3">
                  Oluştur
                </button>
              </form>

              <div className="lg:col-span-2 bg-white border rounded-2xl p-6">
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-xl p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-[#003527]">
                            {task.title}
                          </h4>

                          <p className="text-sm text-gray-500 mt-1">
                            {task.description}
                          </p>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-[#6cf8bb] text-[#003527] text-xs font-semibold">
                          {getTaskTypeLabel(task.task_type)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="font-bold text-[#003527] mb-4">
                    Toplu Atama
                  </h3>

                  <select
                    className="w-full border rounded-lg p-3 mb-4"
                    value={selectedTask}
                    onChange={(e) =>
                      setSelectedTask(e.target.value)
                    }
                  >
                    <option value="">Görev seçin</option>

                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {clients.map((client) => (
                      <label
                        key={client.id}
                        className="border rounded-lg p-3 flex gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(
                            client.id
                          )}
                          onChange={() =>
                            toggleClientSelection(client.id)
                          }
                        />

                        {client.company_name}
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={assignTask}
                    className="bg-[#006c49] text-white rounded-lg px-6 py-3"
                  >
                    Seçilen Müşterilere Ata
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assigned" && (
          <div>
            <h2 className="text-3xl font-bold text-[#003527] mb-6">
              Atananlar
            </h2>

            <div className="bg-white border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4">Firma</th>
                    <th className="p-4">Görev</th>
                    <th className="p-4">Tip</th>
                    <th className="p-4">Durum</th>
                  </tr>
                </thead>

                <tbody>
                  {assignedTasks.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">
                        {item.users?.company_name}
                      </td>

                      <td className="p-4">
                        {item.tasks?.title}
                      </td>

                      <td className="p-4">
                        {getTaskTypeLabel(
                          item.tasks?.task_type
                        )}
                      </td>

                      <td className="p-4">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "answers" && (
          <div>
            <h2 className="text-3xl font-bold text-[#003527] mb-6">
              Cevaplar
            </h2>

            <div className="bg-white border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4">Firma</th>
                    <th className="p-4">Soru</th>
                    <th className="p-4">Cevap</th>
                  </tr>
                </thead>

                <tbody>
                  {answersList.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">
                        {
                          item.user_tasks?.users
                            ?.company_name
                        }
                      </td>

                      <td className="p-4">
                        {item.user_tasks?.tasks?.title}
                      </td>

                      <td className="p-4">
                        {item.answer_text ||
                          item.selected_option}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "uploads" && (
          <div>
            <h2 className="text-3xl font-bold text-[#003527] mb-6">
              Yüklenen Dosyalar
            </h2>

            <div className="bg-white border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4">Firma</th>
                    <th className="p-4">Görev</th>
                    <th className="p-4">Dosya</th>
                    <th className="p-4">İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  {uploadsList.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">
                        {
                          item.user_tasks?.users
                            ?.company_name
                        }
                      </td>

                      <td className="p-4">
                        {item.user_tasks?.tasks?.title}
                      </td>

                      <td className="p-4">
                        {item.file_name}
                      </td>

                      <td className="p-4 flex gap-2">
                        <a
                          href={item.file_url}
                          target="_blank"
                          className="px-3 py-2 rounded-lg bg-[#003527] text-white text-sm"
                        >
                          İndir
                        </a>

                        <button
                          onClick={() =>
                            deleteUpload(item.id)
                          }
                          className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}