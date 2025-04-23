import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ adminId: "", password: "", secretKey: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("https://ind-54pe.onrender.com/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Login Response:", data); // Log the response

      if (response.ok) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminId", data.faculty.facultyId);
        localStorage.setItem("adminData", JSON.stringify(data.faculty));
        alert("✅ Admin Login Successful!");
        navigate("/admin-dashboard", { replace: true }); // Navigate to admin dashboard
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("❌ Admin Login Error:", error);
      setError("Admin login failed! Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-blue-100">
      <div className="bg-white rounded-lg shadow-lg flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
        {/* Left Section - Form */}
        <div className="w-full md:w-1/2 p-8 order-2 md:order-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Login</h1>
          <p className="text-sm text-gray-500 mb-6">Admins, please login with your credentials</p>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="adminId"
                value={formData.adminId}
                onChange={handleChange}
                required
                placeholder="Admin ID"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="password"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                required
                placeholder="Secret Key"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-right text-sm">
              <a href="#" className="text-blue-600 hover:underline">Forgot Password?</a>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
              Login
            </button>
          </form>
          <p className="text-center text-gray-600 mt-4">
            Not an Admin?{" "}
            <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/login")}>
              Login as Faculty
            </span>
          </p>
        </div>

        {/* Right Section - Image */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-blue-500 rounded-r-lg p-6 order-1 md:order-2">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoJbEffHFykaiCR1H8gMG7lVar2rs5QvST6g&s"
            alt="Admin Login Illustration"
            className="w-3/4"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
