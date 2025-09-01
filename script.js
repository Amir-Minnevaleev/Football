document.addEventListener('DOMContentLoaded', function () {
    // Проверяем, есть ли необходимые элементы на странице
    if (!document.getElementById('booking-form')) {
        return; // Если это не страница бронирования, выходим
    }

    const form = document.getElementById('booking-form');
    const nameSelect = document.getElementById('name');
    const codeInput = document.getElementById('code');
    const dateInput = document.getElementById('date');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const bookingsList = document.getElementById('bookings-list');
    const deleteModal = document.getElementById('delete-modal');
    const deleteCodeInput = document.getElementById('delete-code');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');

    let currentDeleteId = null;
    let users = [];

    // Загружаем пользователей
    function loadUsers() {
        users = db.getUsers();
        updateUserSelect();
    }

    // Обновляем список пользователей в select
    function updateUserSelect() {
        nameSelect.innerHTML = '<option value="">Выберите воспитателя</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.name;
            option.textContent = user.name;
            nameSelect.appendChild(option);
        });
    }

    // Загружаем бронирования
    function loadBookings() {
        const bookings = db.getBookings();
        const now = new Date();

        bookingsList.innerHTML = '';

        if (bookings.length === 0) {
            bookingsList.innerHTML = '<div class="no-bookings">Нет активных бронирований</div>';
            return;
        }

        bookings.forEach(booking => {
            const bookingDate = new Date(`${booking.date}T${booking.end_time}`);
            if (bookingDate < now) return; // Пропускаем прошедшие бронирования

            const bookingElement = document.createElement('div');
            bookingElement.className = 'booking-item';

            const start = new Date(`${booking.date}T${booking.start_time}`);
            const end = new Date(`${booking.date}T${booking.end_time}`);
            const isNowActive = now >= start && now <= end;

            if (isNowActive) {
                bookingElement.classList.add('active-booking');
            }

            const formattedDate = formatDate(booking.date);
            bookingElement.innerHTML = `
        <div class="booking-info">
          <div class="booking-date-time">${formattedDate}, с ${booking.start_time} до ${booking.end_time}</div>
          <div class="booking-name">${booking.user_name}</div>
        </div>
        <button class="delete-btn btn-red" data-id="${booking.id}" data-name="${booking.user_name}">Удалить</button>
      `;

            bookingsList.appendChild(bookingElement);
        });

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                currentDeleteId = parseInt(this.getAttribute('data-id'));
                const userName = this.getAttribute('data-name');
                deleteModal.setAttribute('data-name', userName);
                deleteModal.style.display = 'flex';
            });
        });
    }

    // Форматирование даты
    function formatDate(inputDate) {
        const date = new Date(inputDate);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Обработка отправки формы
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = nameSelect.value.trim();
        const code = codeInput.value.trim();
        const date = dateInput.value;
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;

        // Валидация
        if (!name || !code || !date || !startTime || !endTime) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        // Проверка кода
        const isValid = db.validateUserCode(name, code);
        if (!isValid) {
            alert('Неверный код для выбранного имени!');
            return;
        }

        // Проверка времени
        const bookingStartDateTime = new Date(`${date}T${startTime}`);
        const now = new Date();

        if (bookingStartDateTime < now) {
            alert('Нельзя бронировать прошедшее время!');
            return;
        }

        if (endTime <= startTime) {
            alert('Время окончания должно быть позже времени начала!');
            return;
        }

        // Проверка на пересечение с другими бронированиями
        const bookings = db.getBookings();
        const conflict = bookings.some(booking => {
            if (booking.date !== date) return false;

            return (
                (startTime >= booking.start_time && startTime < booking.end_time) ||
                (endTime > booking.start_time && endTime <= booking.end_time) ||
                (startTime <= booking.start_time && endTime >= booking.end_time)
            );
        });

        if (conflict) {
            alert('Это время уже занято! Пожалуйста, выберите другое время.');
            return;
        }

        // Добавляем бронирование
        const userId = db.getUserId(name);
        if (userId === null) {
            alert('Ошибка: пользователь не найден');
            return;
        }

        try {
            const success = db.addBooking(userId, date, startTime, endTime, name, code);
            if (success) {
                alert('Бронирование успешно создано!');
                form.reset();
                loadBookings();
            } else {
                alert('Ошибка при создании бронирования');
            }
        } catch (error) {
            alert('Ошибка при создании бронирования: ' + error.message);
        }
    });

    // Обработка удаления бронирования
    confirmDeleteBtn.addEventListener('click', function () {
        if (!currentDeleteId) return;

        const code = deleteCodeInput.value.trim();
        if (!code) {
            alert('Пожалуйста, введите код для удаления');
            return;
        }

        const userName = deleteModal.getAttribute('data-name');

        try {
            const success = db.deleteBooking(currentDeleteId, code);
            if (success) {
                deleteModal.style.display = 'none';
                deleteCodeInput.value = '';
                alert('Бронирование успешно удалено!');
                loadBookings();
            } else {
                alert('Ошибка при удалении бронирования');
            }
        } catch (error) {
            alert('Ошибка при удалении: ' + error.message);
        }
    });

    cancelDeleteBtn.addEventListener('click', function () {
        deleteModal.style.display = 'none';
        deleteCodeInput.value = '';
        currentDeleteId = null;
    });

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function (e) {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
            deleteCodeInput.value = '';
            currentDeleteId = null;
        }
    });

    // Устанавливаем минимальную дату как сегодняшнюю
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // Инициализация
    loadUsers();
    loadBookings();
});