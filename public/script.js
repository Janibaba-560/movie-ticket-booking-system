// ================== URL & Page Setup ==================
const params = new URLSearchParams(window.location.search);
const movieName = params.get('movie');
const movieTime = params.get('time');
const poster = params.get('poster');
const basePrice = parseInt(params.get('price'));
const showtimeId = params.get('showtimeId');

// Check if element exists on page
function pageExists(id) {
  return document.getElementById(id) !== null;
}

// Snack prices
const snackPrices = { popcorn: 100, soda: 50, combo: 150 };

// ================== Booking Page ==================
if (pageExists('seat-total')) {

  const posterEl = document.getElementById('poster');
  const movieNameEl = document.getElementById('movie-name');
  const movieTimeEl = document.getElementById('movie-time');

  posterEl.src = poster || 'images/default-poster.jpg';
  movieNameEl.textContent = movieName || 'Unknown Movie';
  movieTimeEl.textContent = movieTime || 'Unknown Time';

  const seatsGrid = document.querySelector('.seats-grid');
  const selectedSeatsEl = document.getElementById('selected-seats');
  const seatTotalEl = document.getElementById('seat-total');
  const snackTotalEl = document.getElementById('snack-total');
  const grandTotalEl = document.getElementById('grand-total');

  let selectedSeats = [];

  // Seat types and pricing
  const seatTypes = [
    { rows: [1, 2], price: 500, type: 'Premium' },
    { rows: [3, 4, 5], price: 300, type: 'Mid' },
    { rows: [6, 7, 8], price: 200, type: 'Regular' }
  ];

  // Generate seats layout
  seatTypes.forEach(group => {
    group.rows.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.classList.add('seats-row', group.type.toLowerCase());
      for (let i = 1; i <= 8; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat', group.type.toLowerCase());
        seat.dataset.price = group.price;
        seat.dataset.type = group.type;
        seat.dataset.seat = `R${row}S${i}`;
        seat.textContent = i;
        if (Math.random() < 0.1) seat.classList.add('booked');
        rowDiv.appendChild(seat);
      }
      seatsGrid.appendChild(rowDiv);
    });
  });

  // ================== Seat Selection ==================
  seatsGrid.addEventListener('click', e => {
    if (!e.target.classList.contains('seat') || e.target.classList.contains('booked')) return;
    const seatNum = e.target.dataset.seat;
    if (e.target.classList.contains('selected')) {
      e.target.classList.remove('selected');
      selectedSeats = selectedSeats.filter(s => s !== seatNum);
    } else {
      e.target.classList.add('selected');
      selectedSeats.push(seatNum);
    }
    selectedSeatsEl.textContent = selectedSeats.length ? selectedSeats.join(', ') : 'None';
    updateSeatTotal();
  });

  // ================== Snack Selection ==================
  ['popcorn', 'soda', 'combo'].forEach(snack => {
    document.getElementById(snack).addEventListener('input', updateTotals);
  });

  // ================== Totals Calculation ==================
  function updateSeatTotal() {
    let total = 0;
    document.querySelectorAll('.seat.selected').forEach(seat => {
      total += parseInt(seat.dataset.price);
    });
    seatTotalEl.textContent = total;
    updateTotals();
  }

  function updateTotals() {
    let snackTotal = 0;
    ['popcorn', 'soda', 'combo'].forEach(snack => {
      snackTotal += document.getElementById(snack).value * snackPrices[snack];
    });
    snackTotalEl.textContent = snackTotal;
    const grandTotal = parseInt(seatTotalEl.textContent) + snackTotal;
    grandTotalEl.textContent = grandTotal;
  }

  // ================== Proceed to Payment ==================
  document.getElementById('proceed-btn').addEventListener('click', () => {
    if (!selectedSeats.length) {
      alert('Please select at least one seat.');
      return;
    }
    const snacks = {
      popcorn: parseInt(document.getElementById('popcorn').value),
      soda: parseInt(document.getElementById('soda').value),
      combo: parseInt(document.getElementById('combo').value)
    };
    const grandTotal = parseInt(grandTotalEl.textContent);

    const url = `payment.html?showtimeId=${encodeURIComponent(showtimeId)}&seats=${encodeURIComponent(selectedSeats.join(','))}&snacks=${encodeURIComponent(JSON.stringify(snacks))}&total=${grandTotal}&movie=${encodeURIComponent(movieName)}&time=${encodeURIComponent(movieTime)}&poster=${encodeURIComponent(poster)}`;
    window.location.href = url;
  });
}

// ==============================
// Confirmation Page ==================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const txnID = params.get("txn");
  const poster = params.get("poster");
  const movieName = params.get("movie");
  const movieTime = params.get("time");
  const seats = params.get("seats") ? params.get("seats").split(",") : [];
  const total = params.get("price");

  const posterEl = document.getElementById("poster");
  const movieNameEl = document.getElementById("movie-name");
  const movieTimeEl = document.getElementById("movie-time");
  const seatsEl = document.getElementById("selected-seats");
  const totalEl = document.getElementById("total-price");
  const txnEl = document.getElementById("txn-id");

  if (poster) posterEl.src = poster;
  if (movieName) movieNameEl.textContent = movieName;
  if (movieTime) movieTimeEl.textContent = movieTime;
  seatsEl.textContent = seats.length ? seats.join(", ") : "None";
  if (total) totalEl.textContent = total;
  if (txnID) txnEl.textContent = txnID;

  // Fetch from backend if txnID exists but some info missing
  if (txnID && (!poster || !movieName || !movieTime || !total)) {
    fetch(`/api/booking/confirmation/${txnID}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.booking) {
          posterEl.src = data.booking.poster || "images/default-poster.jpg";
          movieNameEl.textContent = data.booking.movieTitle || movieNameEl.textContent;
          movieTimeEl.textContent = data.booking.showtime || movieTimeEl.textContent;
          seatsEl.textContent = data.booking.seats ? data.booking.seats.join(", ") : seatsEl.textContent;
          totalEl.textContent = data.booking.totalAmount || totalEl.textContent;
          txnEl.textContent = data.booking.transactionId || txnEl.textContent;
        }
      })
      .catch(err => console.error("Error fetching booking info:", err));
  }
});
