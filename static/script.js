document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const roomListDiv = document.getElementById('room-list');
  const messagesDiv = document.getElementById('messages');
  const newMessageForm = document.getElementById('new-message');
  const roomTemplate = document.getElementById('room-template');
  const messageTemplate = document.getElementById('message-template');
  const addRoomBtn = document.getElementById('add-room-btn');
  // const statusIndicator = document.getElementById('status-indicator'); // commented out as the status indicator is not in use
  const roomTitle = document.getElementById('room-title');

  // state object to keep track of the current room, available rooms, and connection status
  const STATE = {
    room: '💬 | general-chat', // default room on load
    rooms: {}, // obj to store messages for each room
    connected: false, // conn status to the server
  };

  // func to generate a consistent color based on a string input (e.g., username)
  function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      // generate a hash code from the string
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // convert to 32bit integer
    }
    // return a HSL color string where the hue is determined by the hash
    return `hsl(${hash % 360}, 100%, 70%)`;
  }

  // function to add a new room to the room list
  function addRoom(name) {
    // check if the room already exists; if so, switch to it
    if (STATE.rooms[name]) {
      changeRoom(name);
      return false;
    }

    // clone the room template and configure it
    const node = roomTemplate.content.cloneNode(true);
    const room = node.querySelector('.room');
    room.textContent = name;
    room.dataset.name = name;
    room.addEventListener('click', () => changeRoom(name)); // add click event to change to this room
    roomListDiv.appendChild(node);  // add new room to the room list

    // init the room in the STATE object
    STATE.rooms[name] = [];
    changeRoom(name); //automatically switch to the new room
    return true;
  }

  // function to change the currently active room
  function changeRoom(name) {
    // if the new room is already the active one, do nothing
    if (STATE.room === name) return;

    // find the new room and the old (currently active) room in the DOM
    const newRoom = roomListDiv.querySelector(`.room[data-name='${name}']`);
    const oldRoom = roomListDiv.querySelector(`.room[data-name='${STATE.room}']`);

    //iIf either room doesn't exist, exit the function
    if (!newRoom || !oldRoom) return;

    // update the state and UI to reflect the change
    STATE.room = name;
    oldRoom.classList.remove('active');
    newRoom.classList.add('active');

    roomTitle.textContent = name; // update the room title display
    messagesDiv.innerHTML = ''; // clear the message display

    // load msgs for the new room
    STATE.rooms[name].forEach(data =>
      addMessage(name, data.username, data.message)
    );
  }

  // function to add a message to a room
  function addMessage(room, username, message, push = false) {
    // if `push` is true, add the message to the room's message list in the state
    if (push) {
      STATE.rooms[room].push({ username, message });
    }

    // only display the message if it's in the currently active room
    if (STATE.room === room) {
      const node = messageTemplate.content.cloneNode(true);
      const usernameSpan = node.querySelector('.username');
      const messageSpan = node.querySelector('.text');

      // set the username text and color based on the username hash
      usernameSpan.textContent = username;
      usernameSpan.style.color = hashColor(username);
      messageSpan.textContent = message; // Set the message text

      messagesDiv.appendChild(node); // Add the message to the message display
      messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
    }
  }

  // function to subscribe to server-sent events
  function subscribe(uri) {
    let retryTime = 1; // Initial retry time in seconds

    // function to establish a connection to the server
    function connect() {
      const events = new EventSource(uri); // Create a new EventSource for real-time updates

      // listen for incoming messages from the server
      events.addEventListener('message', ev => {
        const msg = JSON.parse(ev.data);
        // ensure the message is valid before processing it
        if (!msg.message || !msg.room || !msg.username) return;
        // add the message to the correct room
        addMessage(msg.room, msg.username, msg.message, true);
      });

      // handle a successful connection
      events.addEventListener('open', () => {
        setConnectedStatus(true);
        retryTime = 1; // reset retry time on successful connection
      });

      // handle connection errors (e.g., server down)
      events.addEventListener('error', () => {
        setConnectedStatus(false);
        events.close();

        const timeout = retryTime; // store the current retry time
        retryTime = Math.min(64, retryTime * 2); // exponentially increase retry time, up to a maximum of 64 seconds
        setTimeout(connect, timeout * 1000); // retry connection after timeout
      });
    }

    connect(); // start the initial connection attempt
  }

  // function to set the connection status (connected or disconnected)
  function setConnectedStatus(status) {
    STATE.connected = status; // update the connection status in the state
  }

  // event listener for submitting a new message
  newMessageForm.addEventListener('submit', e => {
    e.preventDefault(); // prevent the default form submission behavior

    const room = STATE.room; // get the currently active room
    const message = newMessageForm.querySelector('#message').value.trim(); // get the message text and trim whitespace
    const username = newMessageForm.querySelector('#username').value.trim() || 'guest'; // get username, default to 'guest' if empty

    // only send the message if it is non-empty and the client is connected to the server
    if (message && STATE.connected) {
      fetch('/message', {
        method: 'POST',
        body: new URLSearchParams({ room, username, message }), // send the room, username, and message as POST data
      }).then(response => {
        // if the message was successfully sent, clear the message input field
        if (response.ok) {
          newMessageForm.querySelector('#message').value = '';
        }
      });
    }
  });

  // event listener for adding a new room
  addRoomBtn.addEventListener('click', () => {
    const roomName = prompt('Enter new room name:').trim(); // prompt the user for a new room name and trim whitespace
    // only add the room if the name is non-empty and doesn't already exist
    if (roomName && !STATE.rooms[roomName]) {
      addRoom(roomName); // add the new room
      addMessage(roomName, 'StackUp', `Welcome to the "${roomName}" room!`, true); // welcome msgs
    }
  });

  // Initial setup: add some default rooms and msgs
  addRoom('💬 | general-chat');
  addRoom('🐸 | memes');
  changeRoom('💬 | general-chat');
  addMessage('💬 | general-chat', 'StackUp', 'Welcome to general chat!', true);
  addMessage('🐸 | memes', 'StackUp', 'This is the memes room.', true);

  subscribe('/events');
});
