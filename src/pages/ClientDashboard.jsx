import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});

  const fetchUserTasks = async (userId) => {
    const { data, error } = await supabase
      .from("user_tasks")
      .select(`
        id,
        status,
        created_at,
        tasks (
          id,
          title,
          description,
          task_type,
          options
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Görevler alınamadı: " + error.message);
      return;
    }

    setTasks(data || []);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("forwo_user");

    if (!storedUser) {
      window.location.href = "/";
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchUserTasks(parsedUser.id);
  }, []);

  const logout = () => {
    localStorage.removeItem("forwo_user");
    window.location.href = "/";
  };

  const saveAnswer = async (userTaskId, type) => {
    const value = answers[userTaskId];

    if (!value) {
      alert("Lütfen cevap girin/seçin.");
      return;
    }

    const { error } = await supabase.from("answers").insert([
      {
        user_task_id: userTaskId,
        answer_text: type === "text" ? value : null,
        selected_option: type === "choice" ? value : null,
      },
    ]);

    if (error) {
      alert("Cevap kaydedilemedi: " + error.message);
      return;
    }

    await supabase
      .from("user_tasks")
      .update({ status: "Yüklendi" })
      .eq("id", userTaskId);

    alert("Cevabınız kaydedildi.");
    fetchUserTasks(user.id);
  };

  const uploadFiles = async (userTaskId) => {
    const selectedFiles = files[userTaskId];

    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Lütfen dosya seçin.");
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > 100 * 1024 * 1024) {
        alert(`${file.name} dosyası 100 MB üzeri.`);
        return;
      }

      const filePath = `${user.id}/${userTaskId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) {
        alert("Dosya yüklenemedi: " + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      await supabase.from("uploads").insert([
        {
          user_task_id: userTaskId,
          file_name: file.name,
          file_url: urlData.publicUrl,
        },
      ]);
    }

    await supabase
      .from("user_tasks")
      .update({ status: "Yüklendi" })
      .eq("id", userTaskId);

    alert("Dosya başarıyla yüklendi.");
    fetchUserTasks(user.id);
  };

  const waitingCount = tasks.filter((item) => item.status === "Bekliyor").length;
  const completedCount = tasks.filter((item) => item.status === "Yüklendi").length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003527]">Forwo Enerji</h1>
          <p className="text-sm text-gray-500">Müşteri Portalı</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
        >
          Çıkış Yap
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <section className="bg-[#064e3b] text-white rounded-3xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Hoş geldiniz, {user?.company_name}
          </h2>
          <p className="text-green-100">
            Size atanmış görevleri, soruları ve dosya yükleme taleplerini buradan takip edebilirsiniz.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">Toplam İşlem</p>
            <h3 className="text-4xl font-bold text-[#003527] mt-2">{tasks.length}</h3>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">Bekleyen</p>
            <h3 className="text-4xl font-bold text-yellow-600 mt-2">{waitingCount}</h3>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">Tamamlanan</p>
            <h3 className="text-4xl font-bold text-green-700 mt-2">{completedCount}</h3>
          </div>
        </section>

        <section className="space-y-5">
          <h3 className="text-2xl font-bold text-[#003527]">Görevlerim ve Sorularım</h3>

          {tasks.map((item) => (
            <div key={item.id} className="bg-white border rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-[#003527]">
                    {item.tasks?.title}
                  </h4>

                  <p className="text-gray-600 mt-2">
                    {item.tasks?.description}
                  </p>

                  <span
                    className={`inline-block mt-4 px-3 py-1 rounded-full text-sm font-semibold ${
                      item.status === "Yüklendi"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="w-full md:w-[380px]">
                  {item.tasks?.task_type === "file" && (
                    <div className="border-2 border-dashed rounded-xl p-5 bg-gray-50">
                      <p className="text-sm text-gray-500 mb-3">
                        Dosyalarınızı buradan yükleyin.
                      </p>

                      <input
                        type="file"
                        multiple
                        className="block w-full text-sm"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setFiles({ ...files, [item.id]: Array.from(e.target.files) })
                        }
                      />

                      <button
                        onClick={() => uploadFiles(item.id)}
                        className="mt-4 w-full bg-[#003527] text-white rounded-lg p-3 hover:bg-[#006c49] transition"
                      >
                        Dosya Yükle
                      </button>
                    </div>
                  )}

                  {item.tasks?.task_type === "text" && (
                    <div className="space-y-3">
                      <textarea
                        rows="5"
                        className="w-full border rounded-xl p-4"
                        placeholder="Cevabınızı yazın..."
                        value={answers[item.id] || ""}
                        onChange={(e) =>
                          setAnswers({ ...answers, [item.id]: e.target.value })
                        }
                      />

                      <button
                        onClick={() => saveAnswer(item.id, "text")}
                        className="w-full bg-[#003527] text-white rounded-lg p-3 hover:bg-[#006c49] transition"
                      >
                        Cevabı Gönder
                      </button>
                    </div>
                  )}

                  {item.tasks?.task_type === "choice" && (
                    <div className="space-y-3">
                      {item.tasks?.options?.map((option, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name={item.id}
                            value={option}
                            checked={answers[item.id] === option}
                            onChange={(e) =>
                              setAnswers({ ...answers, [item.id]: e.target.value })
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}

                      <button
                        onClick={() => saveAnswer(item.id, "choice")}
                        className="w-full bg-[#003527] text-white rounded-lg p-3 hover:bg-[#006c49] transition"
                      >
                        Seçimi Gönder
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="bg-white border rounded-2xl p-8 text-center text-gray-500">
              Şu anda size atanmış görev veya soru bulunmuyor.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}