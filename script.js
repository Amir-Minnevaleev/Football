const { createClient } = window.supabase;

const supabaseUrl = 'https://fdcvooegcdzhcxyxwukz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkY3Zvb2VnY2R6aGN4eXh3dWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODQ1NDcsImV4cCI6MjA2Mjk2MDU0N30.v4SxwvEQ0A0LC1SKwbvqBLUyl2Gcmyej55V_5pY1gkc';

const supabase = createClient(supabaseUrl, supabaseKey);

// Получаем элемент списка бронирований
const bookingsList = document.getElementById("bookings-list");

// Допустимые коды
const validCodes = {
  "Камил Абый": "1234",
  "Данил Абый": "5678",
  "Карим Абый": "9999",
};

async function loadBookings() {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .gte("date_start", today)
    .order("date_start", { ascending: true })
    .order("time_start", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки бронирований:", error.message);
    return;
  }

  bookingsList.innerHTML = ""; // Очистка списка

  data.forEach(booking => {
    const li = document.createElement("li");
    li.textContent = `${booking.date_start} с ${booking.time_start} до ${booking.time_end} — ${booking.name}`;
    bookingsList.appendChild(li);
  });
}

loadBookings(); // Вызываем при загрузке

document.getElementById("booking-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target; // Получаем форму, чтобы потом сбросить

  const name = form.querySelector("#name").value.trim();
  const code = form.querySelector("#code").value.trim();
  const date = form.querySelector("#date").value;
  const timeStart = form.querySelector("#start-time").value;
  const timeEnd = form.querySelector("#end-time").value;

  if (!validCodes[name] || validCodes[name] !== code) {
    alert("Неверный код для выбранного имени!");
    return;
  }

  // Проверка на пересечение по дате
  const { data: existingBookings, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("date_start", date);

  if (fetchError) {
    console.error("Ошибка при получении бронирований:", fetchError.message);
    return;
  }

  const newStart = timeStart;
  const newEnd = timeEnd;

  const conflict = existingBookings.some(booking => {
    const existingStart = booking.time_start;
    const existingEnd = booking.time_end;

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });

  if (conflict) {
    alert("❌ Это время уже занято! Пожалуйста, выберите другое.");
    return;
  }

  // Отправка брони
  try {
    const { error: insertError } = await supabase.from("bookings").insert([
      {
        name,
        code,
        date_start: date,
        time_start: timeStart,
        date_end: date, // пока так
        time_end: timeEnd
      }
    ]);

    if (insertError) {
      console.error("❌ Ошибка добавления:", insertError.message);
      alert("Ошибка при отправке данных.");
    } else {
      alert("✅ Бронирование успешно!");
      form.reset();  // Очистка формы
      loadBookings(); // обновим список
    }
  } catch (err) {
    console.error("Ошибка:", err.message);
    alert("Ошибка при бронировании.");
  }
});