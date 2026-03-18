const mongoose = require('mongoose');
const { Schema } = mongoose;

// --- 1. Movie Schema ---
const movieSchema = new Schema({
    title: { type: String, required: true },
    poster: { type: String, required: true },
    basePrice: { type: Number, required: true },
    rating: { type: String, default: 'N/A' }
}, { timestamps: true });
const Movie = mongoose.model('Movie', movieSchema);

// --- 2. Showtime Schema ---
const showtimeSchema = new Schema({
    // Link to the Movie document using its ID
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    time: { type: String, required: true }, // e.g., '6:00 PM'
    date: { type: Date, default: Date.now }
}, { timestamps: true });
const Showtime = mongoose.model('Showtime', showtimeSchema);

// --- 3. Booking Schema ---
const bookingSchema = new Schema({
    // CRITICAL FIX: The key must be 'showtime' to match Mongoose path validation.
    showtime: { type: Schema.Types.ObjectId, ref: 'Showtime', required: true },
    
    // The specific seats purchased, e.g., ['R1S1', 'R1S2']
    seats: { 
        type: [String], 
        required: true,
        validate: [v => v.length > 0, 'Booking must have at least one seat.']
    },
    
    // The user's snack order (saved as a JSON string or object)
    snacks: {
        type: Schema.Types.Mixed, 
        default: {} // Allow flexible object type for snacks
    },
    
    totalAmount: { type: Number, required: true },
    transactionId: { type: String, unique: true, required: true },
    bookingTime: { type: Date, default: Date.now } 
}, {
    // CRITICAL FIX: Force Mongoose to use the exact collection name 'bookings'
    collection: 'bookings' 
});
const Booking = mongoose.model('Booking', bookingSchema);

// Export all models so server.js can import them
module.exports = { Movie, Showtime, Booking };

