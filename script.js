
const supabaseUrl = 'https://fdcvooegcdzhcxyxwukz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkY3Zvb2VnY2R6aGN4eXh3dWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODQ1NDcsImV4cCI6MjA2Mjk2MDU0N30.v4SxwvEQ0A0LC1SKwbvqBLUyl2Gcmyej55V_5pY1gkc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
// Допустимые коды
const validCodes = {
  "Марат Абый": "1525",
  "Камил Абый": "1234",
  "Данил Абый": "5678",
  "Карим Абый": "9999",
  "Рамазан Абый": "5642",
  "Мунир Абый": "0976",
  "Нияз Абый": "7639",
  "Яхъя Абый": "7298",
  "Гумар Абый": "6483",
  "Райнур Абый": "3409",
  "Айдар Абый": "1074",
  "Рустам Саматович": "4507",
  "Роберт Абый": "3900",
  "Руслан Абый" : "2953"
};

const bookingsList = document.getElementById("bookings-list");
const form = document.getElementById("booking-form");

async function loadBookings() {
  const now = new Date();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("date_start", { ascending: true })
    .order("time_start", { ascending: true });

  if (error) {
    bookingsList.innerHTML = `<li>Ошибка загрузки бронирований: ${error.message}</li>`;
    return;
  }

  bookingsList.innerHTML = "";

  data.forEach(booking => {
    const bookingDate = new Date(`${booking.date_start}T${booking.time_end}`);
    if (bookingDate < now) return; // ⛔️ Пропускаем старые

    const start = new Date(`${booking.date_start}T${booking.time_start}`);
    const end = new Date(`${booking.date_start}T${booking.time_end}`);
    const isNowActive = now >= start && now <= end;

    const li = document.createElement("li");

    if (isNowActive) {
      li.style.borderLeft = "4px solid #4CAF50";
      li.style.backgroundColor = "#d4f9d5"; // Светло-зелёный
    }

    const formattedDate = formatDate(booking.date_start);
    li.innerHTML = `<div class="booking-date-time">${formattedDate}, с ${booking.time_start} до ${booking.time_end}</div>
                    <div class="booking-name">${booking.name}</div>`;

    bookingsList.appendChild(li);
  });

  if (bookingsList.children.length === 0) {
    bookingsList.innerHTML = "<li>Нет активных или будущих бронирований.</li>";
  }
}

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const code = document.getElementById("code").value.trim();
  const date = document.getElementById("date").value;
  const timeStart = document.getElementById("start-time").value;
  const timeEnd = document.getElementById("end-time").value;

  if (!validCodes[name] || validCodes[name] !== code) {
    alert("Неверный код для выбранного имени!");
    return;
  }

  const bookingStartDateTime = new Date(`${date}T${timeStart}`);
  const now = new Date();

  if (bookingStartDateTime < now) {
    alert("❌ Нельзя бронировать прошедшее время!");
    return;
  }

  if (timeEnd <= timeStart) {
    alert("Время окончания должно быть позже времени начала!");
    return;
  }

  const { data: existingBookings, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("date_start", date);

  if (fetchError) {
    alert("Ошибка при получении бронирований.");
    return;
  }

  const conflict = existingBookings.some(booking => {
    return (
      (timeStart >= booking.time_start && timeStart < booking.time_end) ||
      (timeEnd > booking.time_start && timeEnd <= booking.time_end) ||
      (timeStart <= booking.time_start && timeEnd >= booking.time_end)
    );
  });

  if (conflict) {
    alert("❌ Это время уже занято! Пожалуйста, выберите другое.");
    return;
  }

  const { error: insertError } = await supabase.from("bookings").insert([
    {
      name,
      code,
      date_start: date,
      time_start: timeStart,
      date_end: date,
      time_end: timeEnd
    }
  ]);

  if (insertError) {
    alert("Ошибка при отправке данных.");
  } else {
    alert("✅ Бронирование успешно!");
    form.reset();
    loadBookings();
  }
});

// Пример функции форматирования даты
function formatDate(inputDate) {
  const date = new Date(inputDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Пример добавления брони в список:
function displayBooking(booking) {
  const { date, startTime, endTime, name } = booking;

  const li = document.createElement("li");

  const topLine = document.createElement("div");
  topLine.className = "booking-date-time";
  topLine.textContent = `${formatDate(date)}, с ${startTime} до ${endTime}`;

  const bottomLine = document.createElement("div");
  bottomLine.className = "booking-name";
  bottomLine.textContent = name;

  li.appendChild(topLine);
  li.appendChild(bottomLine);
  document.getElementById("bookings-list").appendChild(li);
}
loadBookings();