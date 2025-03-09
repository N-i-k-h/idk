import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaBars, FaUser, FaChartLine, FaCalendarAlt, FaCog, FaSignOutAlt, FaEnvelope, FaPhoneAlt, FaBuilding } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const App = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [facultyData, setFacultyData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [bookings, setBookings] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [branch, setBranch] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  const SidebarButton = ({ section, icon, label }) => (
    <button
      onClick={() => {
        setActiveSection(section);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center space-x-2 py-3 px-4 rounded transition duration-200 ${
        activeSection === section ? "bg-blue-700 text-white" : "hover:bg-gray-300"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  const fetchFacultyData = async () => {
    const facultyId = localStorage.getItem("facultyId");
    if (!facultyId) return;

    try {
      const response = await fetch(`http://localhost:5000/faculty-profile/${facultyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch faculty data");
      }
      const data = await response.json();
      localStorage.setItem("facultyData", JSON.stringify(data));
      setFacultyData(data);
      setBookings(data.bookings || []);
      setName(data.name);
      setDesignation(data.designation);
      setBranch(data.branch);
      setEmail(data.email);
      setPhone(data.phone);
    } catch (error) {
      console.error("Error Fetching Faculty Data:", error);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, [activeSection]);

  useEffect(() => {
    const storedFacultyData = localStorage.getItem("facultyData");
    if (storedFacultyData) {
      setFacultyData(JSON.parse(storedFacultyData));
    }
  }, [activeSection]);

  const handleDutySelect = (duty) => {
    if (selectedDuty) {
      setAlertMessage("Only one duty can be chosen per booking.");
      return;
    }
    setSelectedDuty(duty);
    setAlertMessage("");
  };

  const handleTimeSlotSelect = (slot) => {
    if (selectedTimeSlot) {
      setAlertMessage("Only one time slot can be chosen.");
      return;
    }
    setSelectedTimeSlot(slot);
    setAlertMessage("");
  };

  const handleBooking = async () => {
    if (!selectedDuty || !selectedDate || !selectedTimeSlot) {
      setAlertMessage("Please select Date, Time Slot, and Duty.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/book-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: localStorage.getItem("facultyId"),
          date: selectedDate.toISOString().split("T")[0],
          timeSlot: selectedTimeSlot,
          dutyType: selectedDuty,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAlertMessage("Booking Successful!");
        fetchFacultyData();
        setSelectedDuty(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
      } else {
        setAlertMessage(data.message);
      }
    } catch (error) {
      console.error("Booking Error:", error);
      setAlertMessage("Booking failed! Please try again.");
    }
  };

  const handleProfileUpdate = async () => {
    const facultyId = localStorage.getItem("facultyId");
    if (!facultyId) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("designation", designation);
    formData.append("branch", branch);
    formData.append("email", email);
    formData.append("phone", phone);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const response = await fetch(`http://localhost:5000/update-profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setAlertMessage("Profile Updated Successfully!");
        fetchFacultyData();
      } else {
        setAlertMessage(data.message || "Profile update failed! Please try again.");
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      setAlertMessage("Profile update failed! Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("facultyId");
    localStorage.removeItem("token");
    localStorage.removeItem("facultyData");
    navigate("/login");
  };

  const chartData = [
    { name: "Exam Duties", value: facultyData?.duties?.exam || 0 },
    { name: "Bundle Duties", value: facultyData?.duties?.bundle || 0 },
    { name: "Renewal Duties", value: facultyData?.duties?.renewal || 0 },
  ];
  const colors = ["#8884d8", "#82ca9d", "#ffc658"];

  const timeslotData = [
    { name: "Morning", value: bookings.filter((b) => b.timeSlot === "Morning").length },
    { name: "Afternoon", value: bookings.filter((b) => b.timeSlot === "Afternoon").length },
  ];

  const dutyData = [
    { name: "Exam", value: bookings.filter((b) => b.duty === "Exam").length },
    { name: "Bundle", value: bookings.filter((b) => b.duty === "Bundle").length },
    { name: "Renewal", value: bookings.filter((b) => b.duty === "Renewal").length },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* Sidebar with z-index */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      <div
        className={`bg-white text-gray-900 w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out md:translate-x-0 shadow-lg z-50`}
      >
        <div className="text-gray-900 flex items-center space-x-2 px-4 font-bold text-lg">
          Menu
        </div>

        <nav>
          <SidebarButton section="profile" icon={<FaUser />} label="Profile" />
          <SidebarButton section="dashboard" icon={<FaChartLine />} label="Dashboard" />
          <SidebarButton section="booking" icon={<FaCalendarAlt />} label="Booking" />
          <SidebarButton section="settings" icon={<FaCog />} label="Settings" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 py-3 px-4 rounded transition duration-200 hover:bg-gray-300"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top Bar */}
        <div className="bg-white text-gray-900 p-4 flex justify-between items-center shadow-md">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
            <FaBars />
          </button>
          <h1 className="text-xl font-bold">Exam Duty Slot Booker</h1>
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-6">
          {/* Profile Section */}
          {activeSection === "profile" && facultyData ? (
          <section className="flex justify-center items-center min-h-screen bg-gray-100">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden text-center">
            {/* Blue Header */}
            <div className="bg-blue-500 h-48 relative">
              <img
                src={facultyData.imageUrl ? `http://localhost:5000${facultyData.imageUrl}` : "https://via.placeholder.com/150"}
                alt="Faculty"
                className="w-52 h-52 border-4 border-white rounded-full absolute left-1/2 transform -translate-x-1/2 -bottom-14"
              />
            </div>

            {/* Faculty Information */}
            <div className="pt-16 pb-8 px-8">
              <h2 className="text-2xl font-bold">{facultyData.name}</h2>
              <p className="text-gray-600 text-lg">{facultyData.designation}</p>

              <div className="mt-4 text-gray-700 space-y-3 text-lg">
                <p className="flex items-center justify-center space-x-2">
                  <FaBuilding className="text-blue-500" /> <span>{facultyData.branch}</span>
                </p>
                <p className="flex items-center justify-center space-x-2">
                  <FaEnvelope className="text-red-500" /> <span>{facultyData.email}</span>
                </p>
                <p className="flex items-center justify-center space-x-2">
                  <FaPhoneAlt className="text-green-500" /> <span>{facultyData.phone}</span>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-center space-x-6 mt-6">

              </div>

              {/* Statistics */}

            </div>
          </div>
            </section>
          ) : (
            <div></div>
          )}

          {/* Dashboard Section */}
          {activeSection === "dashboard" && facultyData && (
            <section className="bg-white p-6 rounded-lg shadow-lg">
              {/* Title */}
              <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">
                Dashboard
              </h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-6">
                {[
                  { title: "Exam Duties", count: facultyData.duties.exam },
                  { title: "Bundle Duties", count: facultyData.duties.bundle },
                  { title: "Renewal Duties", count: facultyData.duties.renewal },
                ].map((item, index) => (
                  <div key={index} className="p-6 bg-gray-100 rounded-lg shadow-lg text-center">
                    <h3 className="text-lg font-semibold text-gray-700">{item.title}</h3>
                    <p className="text-3xl font-bold text-blue-700">{item.count}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {/* Donut Chart */}
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg flex flex-col items-center">
                  <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                    Duties Overview
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="70%"
                        dataKey="value"
                        label
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        ))}
                      </Pie>
                      <Legend layout="vertical" align="center" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Timeslot Chart */}
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg flex flex-col items-center">
                  <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                    Timeslots Booked
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeslotData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Booking History Table */}
              <div className="max-w-6xl mx-auto mt-6">
                <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">Booking History</h2>
                <div className="overflow-x-auto bg-gray-100 p-6 rounded-lg shadow-lg">
                  <table className="w-full text-center border border-gray-300">
                    <thead className="bg-gray-700 text-white">
                      <tr>
                        <th className="p-3 border border-gray-300">Date</th>
                        <th className="p-3 border border-gray-300">Time Slot</th>
                        <th className="p-3 border border-gray-300">Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking, index) => (
                        <tr key={index} className="hover:bg-gray-200">
                          <td className="p-3 border border-gray-300">{booking.date}</td>
                          <td className="p-3 border border-gray-300">{booking.timeSlot}</td>
                          <td className="p-3 border border-gray-300">{booking.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Booking Section */}
          {activeSection === "booking" && (
            <section className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl shadow-xl mx-auto transition-all duration-300 mt-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-6 text-center">
                Duty Booking
              </h1>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Select Date:</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all"
                  placeholderText="Choose a date"
                />
              </div>

              {/* Time Slot Selection */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Select Time Slot:</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleTimeSlotSelect("Morning")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      selectedTimeSlot === "Morning"
                        ? "bg-blue-700 text-white shadow-md scale-105"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    Morning
                  </button>
                  <button
                    onClick={() => handleTimeSlotSelect("Afternoon")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      selectedTimeSlot === "Afternoon"
                        ? "bg-blue-700 text-white shadow-md scale-105"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    Afternoon
                  </button>
                </div>
              </div>

              {/* Duty Selection */}
              <h2 className="text-2xl font-bold text-blue-700 mt-8 mb-4 text-center">Select Duty</h2>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleDutySelect("Exam")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    selectedDuty === "Exam"
                      ? "bg-blue-700 text-white shadow-md scale-105"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Exam Duty
                </button>
                <button
                  onClick={() => handleDutySelect("Renewal")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    selectedDuty === "Renewal"
                      ? "bg-blue-700 text-white shadow-md scale-105"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Renewal Duty
                </button>
                <button
                  onClick={() => handleDutySelect("Bundle")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    selectedDuty === "Bundle"
                      ? "bg-blue-700 text-white shadow-md scale-105"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Bundle Duty
                </button>
              </div>

              {/* Alert Message */}
              {alertMessage && <div className="mt-6 text-red-600 font-semibold text-center">{alertMessage}</div>}

              {/* Confirm Button */}
              <button
                onClick={handleBooking}
                className="mt-8 w-full py-4 bg-blue-700 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:bg-blue-800 shadow-lg"
              >
                Confirm Booking
              </button>
            </section>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <section className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl shadow-xl mx-auto transition-all duration-300 mt-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-6 text-center">
                Profile Settings
              </h1>

              {/* Profile Image Upload */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Profile Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all"
                />
              </div>

              {/* Name */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all"
                />
              </div>

              {/* Designation */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Designation:</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all"
                />
              </div>

              {/* Branch */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Branch:</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all"
                />
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all"
                />
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Phone:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all"
                />
              </div>

              {/* Alert Message */}
              {alertMessage && <div className="mt-6 text-red-600 font-semibold text-center">{alertMessage}</div>}

              {/* Save Button */}
              <button
                onClick={handleProfileUpdate}
                className="mt-8 w-full py-4 bg-blue-700 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:bg-blue-800 shadow-lg"
              >
                Save Changes
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
