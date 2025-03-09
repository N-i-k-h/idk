app.post("/book-room", async (req, res) => {
//   try {
//     const { facultyId, date, timeSlot, room, dutyType } = req.body;

//     if (!facultyId || !date || !timeSlot || !room || !dutyType) {
//       return res.status(400).json({ message: "Missing required fields!" });
//     }

//     const faculty = await Faculty.findOne({ facultyId });
//     if (!faculty) return res.status(404).json({ message: "Faculty not found!" });

//     // Ensure faculty can only book one duty per slot
//     if (faculty.bookings.some((booking) => booking.date === date && booking.timeSlot === timeSlot)) {
//       return res.status(400).json({ message: "You have already booked a duty for this slot!" });
//     }

//     // Update Faculty's duties count
//     faculty.duties[dutyType.toLowerCase()] = (faculty.duties[dutyType.toLowerCase()] || 0) + 1;
//     faculty.bookings.push({ date, timeSlot, room, dutyType });
//     await faculty.save();

//     // Mark Room as Booked
//     let roomData = await Room.findOne({ name: room });
//     if (!roomData) roomData = new Room({ name: room, bookedDates: [] });

//     roomData.bookedDates.push({ date, timeSlot });
//     await roomData.save();

//     res.status(200).json({ message: "Booking successful!", duties: faculty.duties, bookings: faculty.bookings });
//   } catch (error) {
//     console.error("❌ Room Booking Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });