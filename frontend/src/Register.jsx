import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    facultyId: "",
    email: "",
    phone: "",
    designation: "",
    branch: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("❌ Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Registration Successful!");
        navigate("/login");
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("❌ Registration Error:", error);
      setError("❌ Registration failed! Please try again.");
    }
  };

  const branches = ["CSE", "ISE", "ME", "EEE", "ECE", "AIML", "Civil", "CSD", "CSDS"];
  const designations = ["Assistant Professor", "Associate Professor", "Non-Teaching Faculty", "HOD"];

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-blue-100">
      <div className="bg-white shadow-lg rounded-lg flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
        {/* Right Section - Image */}
        <div className="md:w-1/2 bg-blue-500 flex items-center justify-center p-6 order-1 md:order-2">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoJbEffHFykaiCR1H8gMG7lVar2rs5QvST6g&s"
            alt="Illustration"
            className="w-64"
          />
        </div>

        {/* Left Section - Form */}
        <div className="w-full md:w-1/2 p-8 order-2 md:order-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Register</h1>
          <p className="text-gray-600 mb-4">Fill in the details to create your faculty account</p>

          {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-2 border rounded-lg"
              required
            />
            <input
              type="text"
              name="facultyId"
              value={formData.facultyId}
              onChange={handleChange}
              placeholder="Faculty ID"
              className="w-full p-2 border rounded-lg"
              required
            />
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="" disabled>Select Designation</option>
              {designations.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="" disabled>Select Branch</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email ID"
              className="w-full p-2 border rounded-lg"
              required
            />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full p-2 border rounded-lg"
              required
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full p-2 border rounded-lg"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full p-2 border rounded-lg"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
            >
              Register
            </button>
          </form>

          <p className="text-center text-gray-600 mt-4">
            Already a customer?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
