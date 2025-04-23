import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaBars, FaUser, FaChartLine, FaCalendarAlt, FaCog, FaSignOutAlt, FaEnvelope, FaPhoneAlt, FaBuilding, FaChevronDown, FaChevronRight, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const App = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [facultyData, setFacultyData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [bookings, setBookings] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [branch, setBranch] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableDates, setAvailableDates] = useState([]);
  const navigate = useNavigate();

  const SidebarButton = ({ section, icon, label }) => (
    <button
      onClick={() => {
        setActiveSection(section);
        setIsSidebarOpen(false);
        setAlertMessage(""); // Clear alert message when switching sections
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
      const response = await fetch(`https://ind-54pe.onrender.com/faculty-profile/${facultyId}`);
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

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch("https://ind-54pe.onrender.com/admin/available-dates", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setAvailableDates(data);
    } catch (error) {
      console.error("Error Fetching Available Dates:", error);
    }
  };

  useEffect(() => {
    fetchFacultyData();
    fetchAvailableDates();
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
      const response = await fetch("https://ind-54pe.onrender.com/book-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: localStorage.getItem("facultyId"),
          date: selectedDate.toISOString().split("T")[0],
          timeSlot: selectedTimeSlot,
          dutyType: selectedDuty,
          year: selectedDate.getFullYear(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAlertMessage("");
        // First update the step
        setCurrentStep(5);
        // Then reset the selections
        setSelectedDuty(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        // Finally fetch updated data
        await fetchFacultyData();
      } else {
        // Show error message in the booking section
        setAlertMessage(data.message || "Booking failed! Please try again.");
        // Stay on the current step
        setCurrentStep(4);
      }
    } catch (error) {
      console.error("Booking Error:", error);
      setAlertMessage("Booking failed! Please try again.");
      setCurrentStep(4);
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
      const response = await fetch(`https://ind-54pe.onrender.com/update-profile`, {
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
    { name: "Relevel Duties", value: facultyData?.duties?.relevel || 0 },
  ];
  const colors = ["#4CAF50", "#F44336", "#8BC34A"]; // Add color for Relevel
  const timeslotData = [
    { name: "Morning", value: bookings.filter((b) => b.timeSlot === "Morning").length },
    { name: "Afternoon", value: bookings.filter((b) => b.timeSlot === "Afternoon").length },
  ];

  const dutyData = [
    { name: "Exam", value: bookings.filter((b) => b.dutyType === "Exam").length },
    { name: "Bundle", value: bookings.filter((b) => b.dutyType === "Bundle").length },
    { name: "Relevel", value: bookings.filter((b) => b.dutyType === "Relevel").length }, // Add Relevel
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Sidebar with z-index */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      <div
        className={`bg-blue-900 text-white w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out md:translate-x-0 shadow-lg z-50`}
      >
        <div className="text-white flex items-center space-x-2 px-4 font-bold text-lg">
          Menu
        </div>

        <nav>
          <SidebarButton section="dashboard" icon={<FaChartLine />} label="Dashboard" />
          <SidebarButton section="booking" icon={<FaCalendarAlt />} label="Booking" />
          <SidebarButton section="settings" icon={<FaCog />} label="Settings" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 py-3 px-4 rounded transition duration-200 hover:bg-gray-700"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Top Bar */}
        <div className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-md">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
            <FaBars />
          </button>
          <h1 className="text-xl font-bold">Exam Duty Allocator</h1>
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2"
            >
              <FaUser />
              <span>{name}</span>
              <FaChevronDown />
            </button>
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveSection("profile");
                      setIsProfileDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-6 flex-1">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && facultyData && (
            <section className="bg-white p-6 rounded-lg shadow-lg">
              {/* Title */}
              <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">
                Dashboard
              </h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-6">
                {[
                  { title: "Exam Duties", count: facultyData.duties.exam, color: "bg-green-500" },
                  { title: "Bundle Duties", count: facultyData.duties.bundle, color: "bg-red-500" },
                  { title: "Relevel Duties", count: facultyData.duties.relevel, color: "bg-purple-500" }, // Add Relevel Duties
                ].map((item, index) => (
                  <div key={index} className={`p-6 ${item.color} rounded-lg shadow-lg text-center text-white`}>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-3xl font-bold">{item.count}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
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
                        <th className="p-3 border border-gray-300">Duty Type</th> {/* Change Room to Duty Type */}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking, index) => (
                        <tr key={index} className="hover:bg-gray-200">
                          <td className="p-3 border border-gray-300">{booking.date}</td>
                          <td className="p-3 border border-gray-300">{booking.timeSlot}</td>
                          <td className="p-3 border border-gray-300">{booking.dutyType}</td> {/* Change Room to Duty Type */}
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
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8 flex-wrap">
                {['Date', 'Time', 'Duties', 'Confirm', 'Done'].map((step, index) => (
                  <div key={index} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep > index + 1 ? 'bg-blue-500 text-white' :
                      currentStep === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}>
                      {currentStep > index + 1 ? '✓' : index + 1}
                    </div>
                    {index < 4 && (
                      <div className={`h-1 w-1/2 bg-blue-500 ${currentStep > index + 1 ? "block" : "hidden"}`} />
                    )}
                  </div>
                ))}
              </div>

              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center text-gray-700">Please select a date:</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {availableDates.map((dateObj, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(new Date(dateObj.date))}
                        className={`p-4 rounded-lg border-2 transition-all hover:border-blue-500 ${
                          selectedDate?.toDateString() === new Date(dateObj.date).toDateString()
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-gray-600">{new Date(dateObj.date).toDateString().split(' ')[0]}</div>
                        <div className="text-2xl font-bold">{new Date(dateObj.date).getDate()}</div>
                        <div className="text-gray-600">{new Date(dateObj.date).toDateString().split(' ')[1]}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedDate}
                    className="w-full py-3 bg-blue-500 text-white rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center text-gray-700">Please select time slot:</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleTimeSlotSelect("Morning")}
                      className={`p-4 rounded-lg border-2 flex items-center space-x-4 transition-all ${
                        selectedTimeSlot === "Morning"
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">Morning Slot</div>
                        <div className="text-sm text-gray-500">8:00 AM - 12:00 PM</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleTimeSlotSelect("Afternoon")}
                      className={`p-4 rounded-lg border-2 flex items-center space-x-4 transition-all ${
                        selectedTimeSlot === "Afternoon"
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <div className="bg-blue-100 p-3 rounded-full">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">Afternoon Slot</div>
                        <div className="text-sm text-gray-500">1:00 PM - 5:00 PM</div>
                      </div>
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      disabled={!selectedTimeSlot}
                      className="px-6 py-3 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center text-gray-700">Please select duty type:</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleDutySelect("Exam")}
                      className={`p-4 rounded-lg border-2 flex flex-col items-center space-y-3 transition-all ${
                        selectedDuty === "Exam"
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <div className="bg-blue-100 p-3 rounded-full">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">Exam Duty</div>
                        <div className="text-sm text-gray-500">Examination hall supervision</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDutySelect("Relevel")}
                      className={`p-4 rounded-lg border-2 flex flex-col items-center space-y-3 transition-all ${
                        selectedDuty === "Relevel"
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <div className="bg-green-100 p-3 rounded-full">
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">Relevel Duty</div>
                        <div className="text-sm text-gray-500">Paper revaluation</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDutySelect("Bundle")}
                      className={`p-4 rounded-lg border-2 flex flex-col items-center space-y-3 transition-all ${
                        selectedDuty === "Bundle"
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <div className="bg-purple-100 p-3 rounded-full">
                        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">Bundle Duty</div>
                        <div className="text-sm text-gray-500">Answer sheet bundling</div>
                      </div>
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-6 py-3 bg-blue-500 text-white rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center text-gray-700">Please confirm your selection:</h2>
                  <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Selected Date</div>
                        <div className="font-semibold">{selectedDate?.toDateString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Time Slot</div>
                        <div className="font-semibold">{selectedTimeSlot} (8:00 AM - 12:00 PM)</div>
                      </div>
                    </div>
                    {alertMessage && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
                        {alertMessage}
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Duty Type</div>
                        <div className="font-semibold">{selectedDuty} Duty</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBooking}
                      className="px-6 py-3 bg-green-500 text-white rounded"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-green-500">Booking Confirmed!</h2>
                  <p className="text-gray-600">Your duty has been successfully booked!</p>
                  <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <p className="text-gray-500">Room allocation will be notified by the admin.</p>
                    <div className="text-sm text-gray-500">
                      Please arrive 10 minutes before your scheduled time.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setActiveSection("dashboard");
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
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

          {/* Profile Section */}
          {activeSection === "profile" && facultyData && (
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
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
