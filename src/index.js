document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  let nickname = '';
  let socket;

  // Показываем модальное окно для ввода никнейма
  function showNicknameModal() {
    const modal = document.createElement('div');
    modal.id = 'nickname-modal';

    modal.innerHTML = `
      <h2>Введите псевдоним</h2>
      <input type="text" id="nickname-input" placeholder="Введите псевдоним">
      <button id="submit-nickname">Продолжить</button>
      <p id="error-message" style="color: red;"></p>
    `;

    app.appendChild(modal);

    const input = document.getElementById('nickname-input');
    const submitButton = document.getElementById('submit-nickname');
    const errorMessage = document.getElementById('error-message');

    submitButton.onclick = () => {
      nickname = input.value.trim();
      if (!nickname) {
        errorMessage.textContent = 'Псевдоним не может быть пустым';
        return;
      }

      connectToChat(nickname);
    };
  }

  // Подключаемся к серверу WebSocket
  function connectToChat(name) {
    socket = new WebSocket(`wss://your-backend-url/chat?name=${encodeURIComponent(name)}`);

    socket.onopen = () => {
      console.log('Connected to chat');
      app.innerHTML = ''; // Очищаем модальное окно
      renderChatUI();
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMessage(message);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('Disconnected from chat');
    };
  }

  // Рендеринг интерфейса чата
  function renderChatUI() {
    app.innerHTML = `
      <div id="chat-container">
        <div id="user-list">
          <h3>Участники:</h3>
          <ul id="users"></ul>
        </div>
        <div id="message-list">
          <div id="messages"></div>
          <input type="text" id="message-input" placeholder="Введите сообщение">
          <button id="send-message">Отправить</button>
        </div>
      </div>
    `;

    const messageInput = document.getElementById('message-input');
    const sendMessageButton = document.getElementById('send-message');

    sendMessageButton.onclick = () => {
      const message = messageInput.value.trim();
      if (message) {
        socket.send(JSON.stringify({ type: 'send', message }));
        messageInput.value = '';
      }
    };
  }

  // Обработка входящих сообщений
  function handleMessage(data) {
    const messagesContainer = document.getElementById('messages');
    const usersList = document.getElementById('users');

    switch (data.type) {
      case 'user-connected':
        updateUsersList(data.users);
        break;

      case 'user-disconnected':
        updateUsersList(data.users);
        break;

      case 'message':
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', data.user.name === nickname ? 'you' : 'other');
        messageDiv.innerHTML = `
          <strong>${data.user.name === nickname ? 'You' : data.user.name}</strong>: ${data.message}
          <span class="timestamp">${new Date().toLocaleTimeString()}</span>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  // Обновление списка участников
  function updateUsersList(users) {
    const usersList = document.getElementById('users');
    usersList.innerHTML = '';
    users.forEach((user) => {
      const userItem = document.createElement('li');
      userItem.textContent = user.name;
      usersList.appendChild(userItem);
    });
  }

  // Показываем модальное окно при загрузке страницы
  showNicknameModal();
});