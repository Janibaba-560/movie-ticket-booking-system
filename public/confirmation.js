// ==============================
// confirmation.js — Booking Confirmation Page
// ==============================

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const txnId = params.get("txn");

  if (!txnId) {
    alert("Invalid transaction. Please try again.");
    return;
  }

  try {
    const res = await fetch(`/api/booking/confirmation/${txnId}`);
    const data = await res.json();

    if (res.ok && data.success) {
      document.getElementById("poster").src = data.booking.poster || "images/default-poster.jpg";
      document.getElementById("movie-name").textContent = data.booking.movieTitle;
      document.getElementById("movie-time").textContent = data.booking.showtime;
      document.getElementById("selected-seats").textContent = data.booking.seats.join(", ");
      document.getElementById("total-price").textContent = data.booking.totalAmount;
      document.getElementById("txn-id").textContent = data.booking.transactionId;
    } else {
      alert(data.message || "Booking not found!");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again later.");
  }
});
