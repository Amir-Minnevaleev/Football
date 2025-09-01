document.addEventListener('DOMContentLoaded', function () {
    // Проверяем, есть ли необходимые элементы на странице
    if (!document.getElementById('login-form')) {
        return; // Если это не страница администратора, выходим
    }

    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const addUserForm = document.getElementById('add-user-form');
    const addUserBtn = document.getElementById('add-user-btn');
    const cancelAddUserBtn = document.getElementById('cancel-add-user');
    const usersContainer = document.getElementById('users-container');
    const adminBookingsList = document.getElementById('admin-bookings-list');

    let isAdmin = false;

    // Проверка входа администратора
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        const isValid = db.validateAdmin(username, password);
        if (isValid) {
            isAdmin = true;
            loginSection.style.display = 'none';
            adminPanel.style.display = 'block';
            loadUsers();
            loadAllBookings();
        } else {
            alert('Неверные учетные данные администратора');
        }
    });

    // Показать форму добавления пользователя
    addUserBtn.addEventListener('click', function () {
        addUserForm.style.display = 'block';
        addUserBtn.style.display = 'none';
    });

    // Скрыть форму добавления пользователя
    cancelAddUserBtn.addEventListener('click', function () {
        addUserForm.style.display = 'none';
        addUserBtn.style.display = 'block';
        addUserForm.reset();
    });

    // Добавление нового пользователя
    addUserForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!isAdmin) {
            alert('Требуются права администратора');
            return;
        }

        const name = document.getElementById('new-user-name').value.trim();
        const code = document.getElementById('new-user-code').value.trim();

        if (!name || !code) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        try {
            const success = db.addUser(name, code);
            if (success) {
                alert('Пользователь успешно добавлен');
                addUserForm.reset();
                addUserForm.style.display = 'none';
                addUserBtn.style.display = 'block';
                loadUsers();
            }
        } catch (error) {
            alert('Ошибка при добавлении пользователя: ' + error.message);
        }
    });

    // Загрузка списка пользователей
    function loadUsers() {
        if (!isAdmin) return;

        const users = db.getUsers();
        usersContainer.innerHTML = '';

        if (users.length === 0) {
            usersContainer.innerHTML = '<p>Пользователи не найдены</p>';
            return;
        }

        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          <div class="user-code">Код: ${user.code}</div>
        </div>
        <div class="user-actions">
          <button class="edit-user btn-yellow" data-id="${user.id}">Редактировать</button>
          <button class="delete-user btn-red" data-id="${user.id}">Удалить</button>
        </div>
      `;

            usersContainer.appendChild(userElement);
        });

        // Добавляем обработчики для кнопок
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', function () {
                if (!isAdmin) return;

                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
                    try {
                        const success = db.deleteUser(id);
                        if (success) {
                            alert('Пользователь удален');
                            loadUsers();
                        }
                    } catch (error) {
                        alert('Ошибка при удалении пользователя: ' + error.message);
                    }
                }
            });
        });

        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', function () {
                if (!isAdmin) return;

                const id = parseInt(this.getAttribute('data-id'));
                const userItem = this.closest('.user-item');
                const userName = userItem.querySelector('.user-name').textContent;
                const userCode = userItem.querySelector('.user-code').textContent.replace('Код: ', '');

                userItem.innerHTML = `
          <div class="user-edit">
            <input type="text" value="${userName}" class="edit-name">
            <input type="text" value="${userCode}" class="edit-code">
            <button class="save-edit btn-green" data-id="${id}">Сохранить</button>
            <button class="cancel-edit btn-gray">Отмена</button>
          </div>
        `;

                userItem.querySelector('.save-edit').addEventListener('click', function () {
                    const newName = userItem.querySelector('.edit-name').value;
                    const newCode = userItem.querySelector('.edit-code').value;

                    if (!newName || !newCode) {
                        alert('Пожалуйста, заполните все поля');
                        return;
                    }

                    try {
                        const success = db.updateUser(id, newName, newCode);
                        if (success) {
                            alert('Пользователь обновлен');
                            loadUsers();
                        }
                    } catch (error) {
                        alert('Ошибка при обновлении пользователя: ' + error.message);
                    }
                });

                userItem.querySelector('.cancel-edit').addEventListener('click', function () {
                    loadUsers();
                });
            });
        });
    }

    // Загрузка всех бронирований
    function loadAllBookings() {
        if (!isAdmin) return;

        const bookings = db.getBookings();
        adminBookingsList.innerHTML = '';

        if (bookings.length === 0) {
            adminBookingsList.innerHTML = '<p>Бронирования не найдены</p>';
            return;
        }

        const now = new Date();

        bookings.forEach(booking => {
            const bookingElement = document.createElement('div');
            bookingElement.className = 'booking-item';

            const bookingDate = new Date(`${booking.date}T${booking.end_time}`);
            const isPast = bookingDate < now;

            if (isPast) {
                bookingElement.classList.add('past-booking');
            }

            const formattedDate = formatDate(booking.date);
            bookingElement.innerHTML = `
        <div class="booking-info">
          <div class="booking-date-time">${formattedDate}, с ${booking.start_time} до ${booking.end_time}</div>
          <div class="booking-name">${booking.user_name}</div>
        </div>
        ${isPast ? '<div class="booking-status">Завершено</div>' : ''}
      `;

            adminBookingsList.appendChild(bookingElement);
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
});