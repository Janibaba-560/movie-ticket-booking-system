// ==============================
// payment.js — Handles Payment Page
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const showtimeId = params.get("showtimeId");
  const seats = params.get("seats") ? params.get("seats").split(",") : [];
  const snacks = params.get("snacks") ? JSON.parse(params.get("snacks")) : {};
  const totalAmount = parseInt(params.get("total")) || 0;

  const poster = params.get("poster");
  const movieNameParam = params.get("movie");
  const movieTimeParam = params.get("time");

  // Display movie info
  if (poster) document.getElementById("poster").src = poster;
  if (movieNameParam) document.getElementById("movie-name").textContent = movieNameParam;
  if (movieTimeParam) document.getElementById("movie-time").textContent = movieTimeParam;

  // Display seats & total
  document.getElementById("selected-seats").textContent = seats.join(", ");
  document.getElementById("total-price").textContent = totalAmount;

  console.log("DEBUG Payment Page showtimeId:", showtimeId);
  console.log("DEBUG Seats:", seats);
  console.log("DEBUG Total Amount:", totalAmount);

  // Handle payment button
  document.getElementById("pay-btn").addEventListener("click", async () => {
    const paymentDetails = {
      name: document.getElementById("name").value.trim(),
      account: document.getElementById("account").value.trim(),
      cvv: document.getElementById("cvv").value.trim(),
    };

    if (!paymentDetails.name || !paymentDetails.account || !paymentDetails.cvv) {
      alert("Please fill all payment fields.");
      return;
    }

    // Ensure mandatory data exists before sending
    if (!showtimeId || !seats.length || !totalAmount) {
      alert("Incomplete booking data. Cannot proceed.");
      console.error("Missing booking info:", { showtimeId, seats, totalAmount });
      return;
    }

    const payload = {
      showtimeId,
      seats,
      snacks,
      totalAmount,
      paymentDetails,
      movieTitle: movieNameParam,
      poster,
      movieTime: movieTimeParam
    };

    console.log("Sending payment payload:", payload);

    try {
      const res = await fetch("/api/booking/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert("Payment Successful!");
        const txnID = result.transactionId || "TXN" + Math.floor(Math.random() * 90000000 + 10000000);
        window.location.href = `confirmation.html?txn=${encodeURIComponent(txnID)}&movie=${encodeURIComponent(movieNameParam)}&time=${encodeURIComponent(movieTimeParam)}&poster=${encodeURIComponent(poster)}&seats=${encodeURIComponent(seats.join(","))}&price=${totalAmount}`;
      } else {
        alert("Payment Failed: " + (result.message || "Server error."));
      }
    } catch (err) {
      console.error("Payment request error:", err);
      alert("A network error occurred during payment. Make sure you opened this page via http://localhost:3000/");
    }
  });
});
