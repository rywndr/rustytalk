
# RustyTalk: A Real-Time Chat Application

**Introduction**

<p align="center">
  <img src="https://github.com/rywndr/rustytalk/blob/main/static/logo.png" alt="RustyTalk Logo" width="200"/>
</p>

RustyTalk is a lightweight, real-time chat application built using Rust and Rocket, designed for seamless communication across multiple rooms. Its focus on simplicity, speed, and reliability makes it an ideal choice for teams, communities, and social groups seeking a straightforward chat tool. RustyTalk’s clean interface and robust backend ensure a user-friendly experience with minimal latency, allowing users to exchange messages in real-time across different chat rooms.

**Why Choose RustyTalk?**

- **Performance**: Leveraging Rust's powerful concurrency model, RustyTalk handles multiple connections with ease, ensuring fast message delivery and low resource consumption.
- **Simplicity**: The minimalist design and intuitive interface make it easy to create rooms, send messages, and switch between conversations.
- **Reliability**: Built with Rocket, a fast and secure web framework, RustyTalk ensures reliable connections and smooth real-time communication.

**How It Works**

RustyTalk uses Server-Sent Events (SSE) to push messages to clients in real-time. Users can join different chat rooms, and the application automatically updates all participants in a room when a new message is sent. The application maintains a persistent connection with the server, ensuring that messages are delivered instantaneously.

**Key Features**

- **Multiple Chat Rooms**: Create and join rooms dynamically to organize conversations.
- **Real-Time Updates**: Messages are instantly broadcasted to all clients in the selected room.
- **User Customization**: Set your custom username

## Installation and Setup

1. **Prerequisites**
   - Ensure you have [Rust](https://www.rust-lang.org/tools/install) installed on your system.


2. **Building the Application**
   - Clone the repository:
     ```bash
     git clone https://github.com/rywndr/rustytalk
     cd rustytalk
     ```
   - Build the project:
     ```bash
     cargo build --release
     ```

3. **Running the Application**
   - Start the server:
     ```bash
     cargo run --release
     ```
   - Open your browser and navigate to `http://localhost:8000` to start using RustyTalk.

RustyTalk is not just a chat application; it’s a showcase of Rust’s potential in building fast, reliable, and user-friendly tools. Its simplicity, coupled with powerful real-time capabilities, makes it a must-have for any group looking for an efficient communication solution.
