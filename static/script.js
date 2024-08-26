document.addEventListener('DOMContentLoaded', () => {
  const roomListDiv = document.getElementById('room-list');
  const messagesDiv = document.getElementById('messages');
  const newMessageForm = document.getElementById('new-message');
  const roomTemplate = document.getElementById('room-template');
  const messageTemplate = document.getElementById('message-template');
  const addRoomBtn = document.getElementById('add-room-btn');
  //   const statusIndicator = document.getElementById('status-indicator');
  const roomTitle = document.getElementById('room-title');

  const STATE = {
    room: '💬 | general-chat',
    rooms: {},
    connected: false,
  };

  function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    return `hsl(${hash % 360}, 100%, 70%)`;
  }

  function addRoom(name) {
    if (STATE.rooms[name]) {
      changeRoom(name);
      return false;
    }

    const node = roomTemplate.content.cloneNode(true);
    const room = node.querySelector('.room');
    room.textContent = name;
    room.dataset.name = name;
    room.addEventListener('click', () => changeRoom(name));
    roomListDiv.appendChild(node);

    STATE.rooms[name] = [];
    changeRoom(name);
    return true;
  }

  function changeRoom(name) {
    if (STATE.room === name) return;

    const newRoom = roomListDiv.querySelector(`.room[data-name='${name}']`);
    const oldRoom = roomListDiv.querySelector(
      `.room[data-name='${STATE.room}']`
    );

    if (!newRoom || !oldRoom) return;

    STATE.room = name;
    oldRoom.classList.remove('active');
    newRoom.classList.add('active');

    roomTitle.textContent = name;
    messagesDiv.innerHTML = '';

    STATE.rooms[name].forEach(data =>
      addMessage(name, data.username, data.message)
    );
  }

  function addMessage(room, username, message, push = false) {
    if (push) {
      STATE.rooms[room].push({ username, message });
    }

    if (STATE.room === room) {
      const node = messageTemplate.content.cloneNode(true);
      const usernameSpan = node.querySelector('.username');
      const messageSpan = node.querySelector('.text');

      usernameSpan.textContent = username;
      usernameSpan.style.color = hashColor(username);
      messageSpan.textContent = message;

      messagesDiv.appendChild(node);
      messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
    }
  }

  function subscribe(uri) {
    let retryTime = 1;

    function connect() {
      const events = new EventSource(uri);

      events.addEventListener('message', ev => {
        const msg = JSON.parse(ev.data);
        if (!msg.message || !msg.room || !msg.username) return;
        addMessage(msg.room, msg.username, msg.message, true);
      });

      events.addEventListener('open', () => {
        setConnectedStatus(true);
        retryTime = 1;
      });

      events.addEventListener('error', () => {
        setConnectedStatus(false);
        events.close();

        const timeout = retryTime;
        retryTime = Math.min(64, retryTime * 2);
        setTimeout(connect, timeout * 1000);
      });
    }

    connect();
  }

  function setConnectedStatus(status) {
    STATE.connected = status;
  }

  newMessageForm.addEventListener('submit', e => {
    e.preventDefault();

    const room = STATE.room;
    const message = newMessageForm.querySelector('#message').value.trim();
    const username =
      newMessageForm.querySelector('#username').value.trim() || 'guest';

    if (message && STATE.connected) {
      fetch('/message', {
        method: 'POST',
        body: new URLSearchParams({ room, username, message }),
      }).then(response => {
        if (response.ok) {
          newMessageForm.querySelector('#message').value = '';
        }
      });
    }
  });

  addRoomBtn.addEventListener('click', () => {
    const roomName = prompt('Enter new room name:').trim();
    if (roomName && !STATE.rooms[roomName]) {
      addRoom(roomName);
      addMessage(
        roomName,
        'StackUp',
        `Welcome to the "${roomName}" room!`,
        true
      );
    }
  });

  addRoom('💬 | general-chat');
  addRoom('🐸 | memes');
  changeRoom('💬 | general-chat');
  addMessage('💬 | general-chat', 'StackUp', 'Welcome to general chat!', true);
  addMessage('🐸 | memes', 'StackUp', 'This is the memes room.', true);

  subscribe('/events');
});
