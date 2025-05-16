const form = document.getElementById('booking-form');
const list = document.getElementById('bookings-list');

// 👮‍♂️ Заранее определённые коды
const validCodes = {
  "Камил Абый": "1234",
  "Данил Абый": "5678",
  "Карим Абый": "9999",
};


// Удаление просроченных броней
function clearOldBookings() {
    const now = new Date();
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
  
    bookings = bookings.filter(b => {
      const endDateTime = new Date(`${b.date}T${b.endTime}`);
      return endDateTime > now;
    });
  
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return bookings;
  }
  
  // Загрузка и отображение
  function loadBookings() {
    list.innerHTML = '';
    const bookings = clearOldBookings();
    bookings.forEach((b, i) => {
      const li = document.createElement('li');
      li.className = 'booking-item';
  
      li.innerHTML = `
        <strong>${b.name}</strong><br>
        📅 ${b.date} (${b.startTime}) → ${b.endTime} <br>
        📆 Дата окончания: ${b.date}
        <button class="delete-button" data-index="${i}">Удалить</button>
      `;
  
      list.appendChild(li);
    });
  
    addDeleteListeners();
  }
  
  // Добавление событий на кнопки удаления
  function addDeleteListeners() {
    document.querySelectorAll('.delete-button').forEach(btn => {
      btn.addEventListener('click', function () {
        const index = this.dataset.index;
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const booking = bookings[index];
  
        const inputCode = prompt(`Введите код для удаления брони имени ${booking.name}:`);
  
        if (inputCode === validCodes[booking.name]) {
          bookings.splice(index, 1);
          localStorage.setItem('bookings', JSON.stringify(bookings));
          loadBookings();
          alert('Бронь удалена!');
        } else {
          alert('Неверный код! Удаление отклонено.');
        }
      });
    });
  }
  
  // Обработка бронирования
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  
    const name = document.getElementById('name').value;
    const code = document.getElementById('code').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
  
    if (!validCodes[name] || validCodes[name] !== code) {
      alert("Неверный код для выбранного имени!");
      return;
    }
  
    if (startTime >= endTime) {
      alert("Время окончания должно быть позже начала!");
      return;
    }
  
    const newBooking = { name, code, date, startTime, endTime };
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
  
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
  
    loadBookings();
    form.reset();
  });
  
  loadBookings();