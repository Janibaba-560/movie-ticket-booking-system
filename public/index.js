// ==============================
// index.js — Populate showtime buttons dynamically
// ==============================

const movies = [
  {
    title: "Avengers: Endgame",
    poster: "images/poster1.jpg",
    price: 500,
    showtimes: [
      { id: "68fca2508097e37f20ad4c8d", time: "6:00 PM" },
      { id: "68fca2508097e37f20ad4c9", time: "8:30 PM" },
      { id: "68fca2508097e37f20ad4ca", time: "11:00 PM" }
    ]
  },
  {
    title: "Spider-Man: No Way Home",
    poster: "images/poster2.jpg",
    price: 500,
    showtimes: [
      { id: "68fca2508097e37f20ad4cb", time: "5:30 PM" },
      { id: "68fca2508097e37f20ad4cc", time: "8:00 PM" },
      { id: "68fca2508097e37f20ad4cd", time: "10:30 PM" }
    ]
  },
  {
    title: "Inception",
    poster: "images/poster3.jpg",
    price: 500,
    showtimes: [
      { id: "68fca2508097e37f20ad4ce", time: "6:45 PM" },
      { id: "68fca2508097e37f20ad4cf", time: "9:15 PM" },
      { id: "68fca2508097e37f20ad4d0", time: "11:45 PM" }
    ]
  }
];

// Populate showtime buttons dynamically
document.querySelectorAll(".movie-card").forEach((card, idx) => {
  const showtimesDiv = card.querySelector(".showtimes");

  movies[idx].showtimes.forEach(st => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = st.time;

    btn.addEventListener("click", () => {
      // Redirect to booking page with proper showtimeId and movie info
      const bookingURL = `booking.html?movie=${encodeURIComponent(movies[idx].title)}&time=${encodeURIComponent(st.time)}&poster=${encodeURIComponent(movies[idx].poster)}&price=${movies[idx].price}&showtimeId=${st.id}`;

      console.log("Redirecting to booking with URL:", bookingURL); // Debug
      window.location.href = bookingURL;
    });

    showtimesDiv.appendChild(btn);
  });
});
