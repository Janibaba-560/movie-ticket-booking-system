// ==============================
// server.js (Corrected & Updated)
// ==============================

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { Movie, Showtime, Booking } = require('./models');
const app = express();
const PORT = 3000;

// -----------------------------
// CONFIGURATION
// -----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // In case form submissions need parsing

// Serve frontend files
app.use(express.static('public'));

// -----------------------------
// DATABASE CONNECTION
// -----------------------------
const ATLAS_URI = "YOUR_MONGODB_CONNECTION_STRING";

mongoose.connect(ATLAS_URI)
    .then(() => {
        console.log('MongoDB connected successfully!');
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
        initializeData();
    })
    .catch(err => console.error('DB Connection Error:', err));

// -----------------------------
// CONSTANTS
// -----------------------------
const SNACK_PRICES = { popcorn: 100, soda: 50, combo: 150 };
const SEAT_PRICES = { premium: 500, mid: 300, regular: 200 };

// -----------------------------
// HELPER: Calculate Total Price
// -----------------------------
function calculateTotal(seats, snacks) {
    let seatTotal = 0;
    seats.forEach(seatId => {
        const row = parseInt(seatId.substring(1, seatId.indexOf('S')));
        if (row <= 2) seatTotal += SEAT_PRICES.premium;
        else if (row <= 5) seatTotal += SEAT_PRICES.mid;
        else seatTotal += SEAT_PRICES.regular;
    });

    let snackTotal = 0;
    if (snacks && typeof snacks === 'object') {
        snackTotal += (parseInt(snacks.popcorn) || 0) * SNACK_PRICES.popcorn;
        snackTotal += (parseInt(snacks.soda) || 0) * SNACK_PRICES.soda;
        snackTotal += (parseInt(snacks.combo) || 0) * SNACK_PRICES.combo;
    }

    return seatTotal + snackTotal;
}

// -----------------------------
// ROUTES
// -----------------------------

// 1. Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Fetch Movies and Showtimes
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find();
        const data = await Promise.all(movies.map(async movie => {
            const showtimes = await Showtime.find({ movie: movie._id }).select('time _id').sort({ time: 1 });
            return {
                id: movie._id,
                title: movie.title,
                poster: movie.poster,
                rating: movie.rating,
                basePrice: movie.basePrice,
                showtimes: showtimes.map(st => ({ time: st.time, showtimeId: st._id }))
            };
        }));
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching movies.' });
    }
});

// 3. Fetch Showtime Details & Booked Seats
app.get('/api/showtimes/:showtimeId', async (req, res) => {
    try {
        const { showtimeId } = req.params;
        if (!showtimeId) return res.status(400).json({ message: 'Missing showtime ID.' });

        const showtime = await Showtime.findById(showtimeId).populate('movie');
        if (!showtime) return res.status(404).json({ message: 'Showtime not found.' });

        const bookedSeats = await Booking.find({ showtime: showtimeId }).select('seats -_id');
        const occupiedSeats = bookedSeats.flatMap(b => b.seats);

        res.json({
            movieName: showtime.movie.title,
            movieTime: showtime.time,
            poster: showtime.movie.poster,
            basePrice: showtime.movie.basePrice,
            occupiedSeats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching showtime details.' });
    }
});

// 4. Initiate Booking (calculate price server-side)
app.post('/api/booking/initiate', async (req, res) => {
    try {
        const { showtimeId, seats, snacks } = req.body;

        if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'Please select seats.' });
        }

        // Check if any seat is already booked
        const bookedCount = await Booking.countDocuments({ showtime: showtimeId, seats: { $in: seats } });
        if (bookedCount > 0) {
            return res.status(409).json({ message: 'One or more selected seats are already booked.' });
        }

        const totalAmount = calculateTotal(seats, snacks);

        res.json({
            totalAmount,
            seats,
            snacks,
            showtimeId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error initiating booking.' });
    }
});

// 5. Process Payment & Save Booking
app.post('/api/booking/pay', async (req, res) => {
    try {
        const { showtimeId, seats, snacks, totalAmount, paymentDetails } = req.body;

        console.log('--- Incoming Payment Request ---');
        console.log(`Showtime ID: ${showtimeId}`);
        console.log(`Seats: ${seats}`);
        console.log(`Total Amount: ${totalAmount}`);

      if (!showtimeId || !seats) {
  return res.status(400).json({ message: 'Incomplete booking data.' });
}

        if (!Array.isArray(seats)) {
            console.error('Seats must be an array.');
            return res.status(400).json({ message: 'Invalid seats format.' });
        }

        const snacksObj = typeof snacks === 'string' ? JSON.parse(snacks) : snacks;

        // Recalculate total securely
        const serverTotal = calculateTotal(seats, snacksObj);
        if (serverTotal !== totalAmount) {
            console.error(`PRICE MISMATCH: Calculated ${serverTotal}, Client sent ${totalAmount}`);
            return res.status(403).json({ message: 'Price mismatch. Transaction denied.' });
        }

        // Save booking
        const newBooking = new Booking({
            showtime: showtimeId,
            seats,
            snacks: snacksObj,
            totalAmount: serverTotal,
            transactionId: `TXN-${Date.now()}-${Math.random().toString(16).slice(2)}`
        });

        await newBooking.save();

        console.log(`Booking saved: ${newBooking.transactionId}`);

        res.json({
            success: true,
            transactionId: newBooking.transactionId,
            bookingId: newBooking._id
        });

    } catch (err) {
        console.error('SERVER ERROR during payment:', err);
        res.status(500).json({ message: 'Internal server error during booking.' });
    }
});

// 6. Fetch Booking Confirmation
app.get('/api/booking/confirmation/:txnId', async (req, res) => {
    try {
        const booking = await Booking.findOne({ transactionId: req.params.txnId })
            .populate({ path: 'showtime', populate: { path: 'movie' } });

        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        res.json({
            movieName: booking.showtime.movie.title,
            movieTime: booking.showtime.time,
            poster: booking.showtime.movie.poster,
            seats: booking.seats.join(', '),
            totalPrice: booking.totalAmount,
            txnID: booking.transactionId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching booking confirmation.' });
    }
});

// -----------------------------
// Dummy Data Initialization
// -----------------------------
async function initializeData() {
    try {
        const movieCount = await Movie.countDocuments();
        if (movieCount > 0) return;

        console.log('Inserting dummy data...');
        const movies = await Movie.insertMany([
            { title: 'Avengers: Endgame', poster: 'images/poster1.jpg', basePrice: 500, rating: '⭐ 4.8/5' },
            { title: 'Spider-Man: No Way Home', poster: 'images/poster2.jpg', basePrice: 500, rating: '⭐ 4.6/5' },
            { title: 'Inception', poster: 'images/poster3.jpg', basePrice: 500, rating: '⭐ 4.7/5' }
        ]);

        const today = new Date();

        await Showtime.insertMany([
            { movie: movies[0]._id, time: '6:00 PM', date: today },
            { movie: movies[0]._id, time: '8:30 PM', date: today },
            { movie: movies[1]._id, time: '5:30 PM', date: today },
            { movie: movies[1]._id, time: '8:00 PM', date: today },
            { movie: movies[2]._id, time: '6:45 PM', date: today },
        ]);

        console.log('Dummy data inserted successfully.');
    } catch (err) {
        console.error('Error initializing dummy data:', err);
    }
}
