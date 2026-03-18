// ================== Booking Page ==================
if (pageExists('seat-total')) {
  // Set movie info from URL
  const params = new URLSearchParams(window.location.search);
  const poster = params.get("poster");
  const movieName = params.get("movie");
  const movieTime = params.get("time");
  const showtimeId = params.get('showtimeId'); 
console.log("DEBUG: showtimeId from URL =", showtimeId);


  document.getElementById('poster').src = poster;
  document.getElementById('movie-name').textContent = movieName;
  document.getElementById('movie-time').textContent = movieTime;

  const seatsGrid = document.querySelector('.seats-grid');
  const selectedSeatsEl = document.getElementById('selected-seats');
  const seatTotalEl = document.getElementById('seat-total');
  const snackTotalEl = document.getElementById('snack-total');
  const grandTotalEl = document.getElementById('grand-total');

  let selectedSeats = [];

  const seatTypes = [
    { rows: [1, 2], price: 500, type: 'Premium' },
    { rows: [3, 4, 5], price: 300, type: 'Mid' },
    { rows: [6, 7, 8], price: 200, type: 'Regular' }
  ];

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

  const snackPrices = { popcorn: 100, soda: 50, combo: 150 };
  ['popcorn', 'soda', 'combo'].forEach(snack => {
    document.getElementById(snack).addEventListener('input', updateTotals);
  });

  function updateSeatTotal() {
    let total = 0;
    document.querySelectorAll('.seat.selected').forEach(seat => total += parseInt(seat.dataset.price));
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

  document.getElementById('proceed-btn').addEventListener('click', () => {
    const snacks = {
      popcorn: parseInt(document.getElementById('popcorn').value),
      soda: parseInt(document.getElementById('soda').value),
      combo: parseInt(document.getElementById('combo').value)
    };
    const grandTotal = parseInt(grandTotalEl.textContent);
    if (!selectedSeats.length) {
      alert("Please select at least one seat.");
      return;
    }

    const url = `payment.html?showtimeId=${showtimeId}&seats=${encodeURIComponent(selectedSeats.join(','))}&snacks=${encodeURIComponent(JSON.stringify(snacks))}&total=${grandTotal}&movie=${encodeURIComponent(movieName)}&time=${encodeURIComponent(movieTime)}&poster=${encodeURIComponent(poster)}`;
    window.location.href = url;
  });
}
