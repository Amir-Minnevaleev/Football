// Класс для работы с базой данных
class Database {
    constructor() {
        this.storageKey = 'footballFieldBookingDB';
        this.init();
    }

    init() {
        try {
            // Загружаем данные из localStorage
            const savedData = localStorage.getItem(this.storageKey);

            if (savedData) {
                this.data = JSON.parse(savedData);
            } else {
                // Инициализируем пустую базу данных
                this.data = {
                    users: [],
                    bookings: [],
                    admin: [{ username: 'admin', password: '7070' }]
                };
                this.save();
            }

            console.log("База данных инициализирована");
        } catch (error) {
            console.error("Ошибка инициализации базы данных:", error);
            // Создаем пустую базу в случае ошибки
            this.data = {
                users: [],
                bookings: [],
                admin: [{ username: 'admin', password: '7070' }]
            };
        }
    }

    // Сохраняем данные в localStorage
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error("Ошибка сохранения данных:", error);
        }
    }

    // Получить всех пользователей
    getUsers() {
        return this.data.users;
    }

    // Получить бронирования
    getBookings() {
        return this.data.bookings.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.start_time.localeCompare(b.start_time);
        });
    }

    // Добавить бронирование
    addBooking(userId, date, startTime, endTime, userName, userCode) {
        try {
            const newBooking = {
                id: Date.now(),
                user_id: userId,
                user_name: userName,
                user_code: userCode,
                date: date,
                start_time: startTime,
                end_time: endTime
            };

            this.data.bookings.push(newBooking);
            this.save();
            return true;
        } catch (error) {
            console.error("Ошибка добавления бронирования:", error);
            return false;
        }
    }

    // Удалить бронирование
    deleteBooking(id, code) {
        try {
            const index = this.data.bookings.findIndex(booking =>
                booking.id === id && booking.user_code === code
            );

            if (index === -1) {
                throw new Error("Бронирование не найдено или неверный код");
            }

            this.data.bookings.splice(index, 1);
            this.save();
            return true;
        } catch (error) {
            console.error("Ошибка удаления бронирования:", error);
            throw error;
        }
    }

    // Проверить код пользователя
    validateUserCode(name, code) {
        return this.data.users.some(user => user.name === name && user.code === code);
    }

    // Получить ID пользователя
    getUserId(name) {
        const user = this.data.users.find(user => user.name === name);
        return user ? user.id : null;
    }

    // Получить пользователя по ID
    getUserById(id) {
        return this.data.users.find(user => user.id === id);
    }

    // Добавить пользователя
    addUser(name, code) {
        try {
            // Проверяем, нет ли уже пользователя с таким именем или кодом
            const existingUser = this.data.users.find(user =>
                user.name === name || user.code === code
            );

            if (existingUser) {
                throw new Error("Пользователь с таким именем или кодом уже существует");
            }

            const newUser = {
                id: Date.now(),
                name: name,
                code: code
            };

            this.data.users.push(newUser);
            this.save();
            return true;
        } catch (error) {
            console.error("Ошибка добавления пользователя:", error);
            throw error;
        }
    }

    // Удалить пользователя
    deleteUser(id) {
        try {
            const index = this.data.users.findIndex(user => user.id === id);

            if (index === -1) {
                throw new Error("Пользователь не найден");
            }

            // Удаляем все бронирования этого пользователя
            this.data.bookings = this.data.bookings.filter(
                booking => booking.user_id !== id
            );

            this.data.users.splice(index, 1);
            this.save();
            return true;
        } catch (error) {
            console.error("Ошибка удаления пользователя:", error);
            throw error;
        }
    }

    // Обновить пользователя
    updateUser(id, name, code) {
        try {
            const userIndex = this.data.users.findIndex(user => user.id === id);

            if (userIndex === -1) {
                throw new Error("Пользователь не найден");
            }

            // Проверяем, нет ли другого пользователя с таким именем или кодом
            const existingUser = this.data.users.find(
                (user, index) => index !== userIndex && (user.name === name || user.code === code)
            );

            if (existingUser) {
                throw new Error("Пользователь с таким именем или кодом уже существует");
            }

            // Обновляем пользователя
            this.data.users[userIndex].name = name;
            this.data.users[userIndex].code = code;

            // Обновляем имя пользователя в бронированиях
            this.data.bookings.forEach(booking => {
                if (booking.user_id === id) {
                    booking.user_name = name;
                }
            });

            this.save();
            return true;
        } catch (error) {
            console.error("Ошибка обновления пользователя:", error);
            throw error;
        }
    }

    // Проверить администратора
    validateAdmin(username, password) {
        return this.data.admin.some(
            admin => admin.username === username && admin.password === password
        );
    }
}

// Создаем глобальный экземпляр базы данных
const db = new Database();