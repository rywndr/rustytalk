#[macro_use]
extern crate rocket;

use rocket::{State, Shutdown};
use rocket::fs::{relative, FileServer};
use rocket::form::Form;
use rocket::response::stream::{EventStream, Event};
use rocket::serde::{Serialize, Deserialize};
use rocket::tokio::sync::broadcast::{channel, Sender, error::RecvError};
use rocket::tokio::select;

// Define the Message struct in a separate module for clarity
mod models {
    use super::*;

    #[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
    #[cfg_attr(test, derive(PartialEq, UriDisplayQuery))]
    #[serde(crate = "rocket::serde")]
    pub struct Message {
        // The room name, validated to be less than 30 characters
        #[field(validate = len(..30))]
        pub room: String,

        // The username, validated to be less than 20 characters
        #[field(validate = len(..20))]
        pub username: String,

        // The message content with no specific length validation
        pub message: String,
    }
}

// Define routes in a separate module
mod routes {
    use super::*;
    use crate::models::Message;

    /// This handler returns an infinite stream of server-sent events.
    /// Each event is a JSON-formatted message pulled from a broadcast queue.
    #[get("/events")]
    pub async fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
        let mut rx = queue.subscribe();

        EventStream! {
            loop {
                let msg = select! {
                    msg = rx.recv() => match msg {
                        Ok(msg) => msg,
                        Err(RecvError::Closed) => break,
                        Err(RecvError::Lagged(_)) => continue,
                    },
                    _ = &mut end => break,
                };

                yield Event::json(&msg);
            }
        }
    }

    /// This handler receives a message from a form submission and broadcasts it to all subscribers.
    #[post("/message", data = "<form>")]
    pub fn post(form: Form<Message>, queue: &State<Sender<Message>>) {
        let _res = queue.send(form.into_inner());
    }
}

// Define the application setup in a separate function
fn create_rocket_app() -> rocket::Rocket<rocket::Build> {
    rocket::build()
        .manage(channel::<models::Message>(1024).0)
        .mount("/", routes![routes::post, routes::events])
        .mount("/", FileServer::from(relative!("static")))
}

// Entry point of the application
#[launch]
fn rocket() -> _ {
    create_rocket_app()
}
