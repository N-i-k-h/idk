import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaUser, FaChartLine, FaCalendarAlt, FaSignOutAlt, FaChevronDown, FaChevronLeft, FaChevronRight, FaCheckCircle, FaCheck, FaTrash } from "react-icons/fa";
import { Doughnut, Bar } from "react-chartjs-2";
import 'chart.js/auto';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Admin = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [name, setName] = useState("");
  const [adminData, setAdminData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [dateHistory, setDateHistory] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const navigate = useNavigate();

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDateHistory = async () => {
      try {
        const response = await fetch("https://idk-4-50nz.onrender.com/admin/date-history", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        const data = await response.json();
        setDateHistory(data);
      } catch (error) {
        console.error("❌ Error fetching date history:", error);
      }
    };

    const fetchAvailableDates = async () => {
      try {
        const response = await fetch("https://idk-4-50nz.onrender.com/admin/available-dates", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        const data = await response.json();
        setAvailableDates(data);
      } catch (error) {
        console.error("❌ Error fetching available dates:", error);
      }
    };

    fetchDateHistory();
    fetchAvailableDates();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminData");
    navigate("/admin");
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      const adminId = localStorage.getItem("adminId");
      if (adminId) {
        try {
          const response = await fetch("https://idk-4-50nz.onrender.com/admin/profile", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          });
          const data = await response.json();
          setAdminData(data);
          setName(data.name || "Admin");
        } catch (error) {
          console.error("❌ Error fetching admin profile:", error);
        }
      }
    };

    const fetchDashboardData = async () => {
      try {
        const response = await fetch("https://idk-4-50nz.onrender.com/admin/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        const data = await response.json();
        setDashboardData(data);
        setBranches(Object.keys(data.branchDistribution));
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      }
    };

    fetchAdminData();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchFacultyList = async () => {
      if (selectedBranch) {
        try {
          const response = await fetch(`https://idk-4-50nz.onrender.com/admin/faculty-list?branch=${selectedBranch}&page=${currentPage}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          });
          const data = await response.json();
          setFacultyList(data.faculties);
        } catch (error) {
          console.error("❌ Error fetching faculty list:", error);
        }
      }
    };

    fetchFacultyList();
  }, [selectedBranch, currentPage]);

  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch("https://idk-4-50nz.onrender.com/admin/add-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          year: selectedYear,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setStep(4);
        fetchDateHistory(); // Refresh date history
        fetchAvailableDates(); // Refresh available dates
      } else {
        console.error("❌ Error adding date:", data.message);
      }
    } catch (error) {
      console.error("❌ Error adding date:", error);
    }
  };

  const handleResetDates = async () => {
    try {
      const response = await fetch("https://idk-4-50nz.onrender.com/admin/reset-dates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAvailableDates([]);
        fetchAvailableDates(); // Refresh available dates
        alert("Dates have been reset successfully!"); // Show alert message
      } else {
        console.error("❌ Error resetting dates:", data.message);
        alert("Failed to reset dates. Please try again."); // Show error alert message
      }
    } catch (error) {
      console.error("❌ Error resetting dates:", error);
      alert("All dates are reset"); // Show error alert message
    }
  };

  const branchDistributionData = {
    labels: Object.keys(dashboardData?.branchDistribution || {}),
    datasets: [
      {
        label: "Faculty Distribution by Branch",
        data: Object.values(dashboardData?.branchDistribution || {}),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  const designationDistributionData = {
    labels: ["Associate Professors", "Assistant Professors", "Non-Teaching Staff", "HOD"],
    datasets: [
      {
        label: "Designation Distribution",
        data: [
          dashboardData?.associateProfessors || 0,
          dashboardData?.assistantProfessors || 0,
          dashboardData?.nonTeachingStaff || 0,
          dashboardData?.hod || 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCE56", "#FF6384", "#4BC0C0"],
      },
    ],
  };

  const years = [1, 2, 3, 4];

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
          <SidebarButton section="allot-room" icon={<FaCalendarAlt />} label="Allot Room" />
          <SidebarButton section="faculty-list" icon={<FaUser />} label="Faculty List" />
          <SidebarButton section="select-date" icon={<FaCalendarAlt />} label="Select Date" />
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
          {activeSection === "dashboard" && dashboardData && (
            <section className="bg-white p-6 rounded-lg shadow-lg">
              <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <h2 className="text-xl font-bold">Number of Faculties</h2>
                  <p className="text-2xl font-bold">{dashboardData.totalFaculties}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <h2 className="text-xl font-bold">Associate Professors</h2>
                  <p className="text-2xl font-bold">{dashboardData.associateProfessors}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <h2 className="text-xl font-bold">Assistant Professors</h2>
                  <p className="text-2xl font-bold">{dashboardData.assistantProfessors}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <h2 className="text-xl font-bold">Non-Teaching Staff</h2>
                  <p className="text-2xl font-bold">{dashboardData.nonTeachingStaff}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <h2 className="text-xl font-bold">HOD</h2>
                  <p className="text-2xl font-bold">{dashboardData.hod}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center" style={{ height: '600px' }}>
                  <h2 className="text-xl font-bold mb-4 text-center">Faculty Distribution by Branch</h2>
                  <div style={{ width: '100%', maxWidth: '700px', height: '500px' }}>
                    <Doughnut
                      data={branchDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">Designation Distribution</h2>
                  <Bar data={designationDistributionData} />
                </div>
              </div>
            </section>
          )}

          {/* Allot Room Section */}
          {activeSection === "allot-room" && (
            <section className="bg-white p-6 rounded-lg shadow-lg">
              <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">Allot Room</h1>
              {/* Add allot room content here */}
            </section>
          )}

          {/* Faculty List Section */}
          {activeSection === "faculty-list" && (
            <section className="bg-white p-6 rounded-lg shadow-lg">
              <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">Faculty List</h1>
              <div className="mb-4">
                <label htmlFor="branch" className="block text-lg font-bold mb-2">Select Branch:</label>
                <select
                  id="branch"
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              {selectedBranch && (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-blue-900 text-white">
                        <th className="py-2 px-4 border-b text-left">Name</th>
                        <th className="py-2 px-4 border-b text-left">Designation</th>
                        <th className="py-2 px-4 border-b text-left">Faculty ID</th>
                        <th className="py-2 px-4 border-b text-left">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyList.map((faculty) => (
                        <tr key={faculty.facultyId} className="border-b">
                          <td className="py-2 px-4">{faculty.name}</td>
                          <td className="py-2 px-4">{faculty.designation}</td>
                          <td className="py-2 px-4">{faculty.facultyId}</td>
                          <td className="py-2 px-4">{faculty.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={facultyList.length < itemsPerPage}
                      className="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Select Date Section */}
          {activeSection === "select-date" && (
            <section className="bg-white p-6 rounded-lg shadow-lg">
              <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">Select Date</h1>
              <div className="flex justify-center mb-4">
                <div className="w-full max-w-4xl">
                  <div className="flex justify-between mb-4">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`flex flex-col items-center justify-center w-1/4 ${step === s ? "text-blue-500" : "text-gray-400"}`}>
                        {s === 1 && <FaCalendarAlt className="text-2xl mb-2" />}
                        {s === 2 && <FaCheckCircle className="text-2xl mb-2" />}
                        {s === 3 && <FaCheckCircle className="text-2xl mb-2" />}
                        {s === 4 && <FaCheck className="text-2xl mb-2" />}
                        <span className="text-sm">Step {s}</span>
                        {s < 4 && <div className={`h-1 w-1/2 bg-blue-500 ${step > s ? "block" : "hidden"}`} />}
                      </div>
                    ))}
                  </div>
                  {step === 1 && (
                    <div className="flex flex-col items-center">
                      <h2 className="text-lg font-bold mb-4">Please select a date:</h2>
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        inline
                        minDate={new Date()}
                        highlightDates={[selectedDate].filter(Boolean)}
                        className="w-full max-w-xl"
                      />
                      <button
                        onClick={handleNext}
                        disabled={!selectedDate}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="flex flex-col items-center">
                      <h2 className="text-lg font-bold mb-4">Please select a year:</h2>
                      <div className="grid grid-cols-4 gap-4">
                        {years.map((year) => (
                          <div
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`p-4 border rounded cursor-pointer ${selectedYear === year ? "bg-blue-200" : "bg-white"}`}
                          >
                            {year}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-4 w-full max-w-xl">
                        <button
                          onClick={handleBack}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={!selectedYear}
                          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="flex flex-col items-center">
                      <h2 className="text-lg font-bold mb-4">Please confirm your selection:</h2>
                      <div className="p-4 border rounded bg-gray-100 w-full max-w-xl">
                        <p><strong>Selected Date:</strong> {selectedDate?.toDateString()}</p>
                        <p><strong>Selected Year:</strong> {selectedYear}</p>
                      </div>
                      <div className="flex justify-between mt-4 w-full max-w-xl">
                        <button
                          onClick={handleBack}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleConfirm}
                          className="px-4 py-2 bg-blue-500 text-white rounded"
                        >
                          Confirm Booking
                        </button>
                      </div>
                    </div>
                  )}
                  {step === 4 && (
                    <div className="flex flex-col items-center">
                      <h2 className="text-lg font-bold mb-4">Booking Confirmed!</h2>
                      <div className="p-4 border rounded bg-gray-100 w-full max-w-xl">
                        <p><strong>Selected Date:</strong> {selectedDate?.toDateString()}</p>
                        <p><strong>Selected Year:</strong> {selectedYear}</p>
                      </div>
                      <p className="mt-4 text-gray-600">Your date has been successfully booked!</p>
                      <button
                        onClick={() => setStep(1)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Date History Table */}
           

              {/* Reset Dates Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleResetDates}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                >
                  <FaTrash className="mr-2" />
                  Reset Dates
                </button>
              </div>
            </section>
          )}

          {/* Profile Section */}
          {activeSection === "profile" && adminData && (
            <section className="flex justify-center items-center min-h-screen bg-gray-100">
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden text-center">
                {/* Blue Header */}
                <div className="bg-blue-500 h-48 relative">
                  <img
                    src={adminData.imageUrl || "https://via.placeholder.com/150"}
                    alt="Admin"
                    className="w-52 h-52 border-4 border-white rounded-full absolute left-1/2 transform -translate-x-1/2 -bottom-14"
                  />
                </div>

                {/* Admin Information */}
                <div className="pt-16 pb-8 px-8">
                  <h2 className="text-2xl font-bold">{adminData.name}</h2>
                  <p className="text-gray-600 text-lg">{adminData.designation}</p>
                  <p className="text-gray-600 text-lg">{adminData.email}</p>
                  <p className="text-gray-600 text-lg">{adminData.phone}</p>
                  {/* Add more admin profile information here */}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;
