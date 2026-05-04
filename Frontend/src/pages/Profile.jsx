import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Save, X } from "lucide-react";
import HealthMetricsChart from "../Components/Charts/HealthMetricsChart";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

function getLatestValue(arr) {
  if (!arr || arr.length === 0) return "No Data";

  const sorted = [...arr].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return sorted[0].value;
}

const Profile = () => {
  const { user, getprofile, setprofile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  //profile pic
const [profileImage, setProfileImage] = useState(null);
const [previewImage, setPreviewImage] = useState(user?.profilePic || null);

  const [profileData, setProfileData] = useState({
    user: user?.name || "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodType: "",
    allergies: "",
  });
  const [errors, setErrors] = useState({});

  const medicalFields = [
                        {           
                        key: "bloodType",
                        label: "Blood Type",
                        type: "select",
                        options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
                      },
                      {
                        key: "gender",
                        label: "Gender",
                        type: "select",
                        options: ["Male", "Female", "Other"],
                      },
                      {
                        key: "allergies",
                        label: "Allergies",
                        type: "text",
                      },
                    ];


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getprofile();
        setProfileData((prev) => ({
          ...prev,
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          bloodType: data.bloodType || "",
          allergies: data.allergies || "",
        }));
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [getprofile]);



 const handleSave = async () => {
  try {
    console.log("Save clicked");

    const newErrors = {};
    if (!profileData.user || profileData.user.trim().length < 3) {
      newErrors.user = "Name must be at least 3 characters long.";
    }
    
    if (profileData.phone && !/^\+?[0-9\s\-]{7,15}$/.test(profileData.phone)) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    const sanitizedData = { ...profileData };

    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === "") {
        delete sanitizedData[key];
      }
    });

    await setprofile(sanitizedData);

    await getprofile(); // refresh data

    setIsEditing(false);
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

  const formatDate = (date) => {
    if (!date) return "Not Provided";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">

      {/* ================= PROFILE HEADER ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-10 flex flex-col md:flex-row gap-12">

        {/* Left Side */}
        <div className="flex flex-col items-center md:items-start">
          <div className="w-28 h-28 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {profileData.user?.charAt(0) || "U"}
          </div>

          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {profileData.user || "Not Provided"}
          </h2>

          <span className="mt-2 px-4 py-1 text-sm rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 capitalize">
            {user?.role}
          </span>
        </div>

        {/* Right Side */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile Overview
            </h3>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition flex items-center gap-2"
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-medium transition"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                  }}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-600 px-5 py-2 rounded-full text-sm font-medium transition"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Full Name */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={profileData.user}
                    onChange={(e) => {
                      setProfileData({ ...profileData, user: e.target.value });
                      if (errors.user) setErrors({ ...errors, user: null });
                    }}
                    className={`w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 ${errors.user ? "border-red-500" : ""}`}
                  />
                  {errors.user && <p className="text-red-500 text-xs mt-1">{errors.user}</p>}
                </>
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profileData.user || "Not Provided"}
                </p>
              )}
            </div>

            {/* Email */}
           
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profileData.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              {isEditing ? (
                <>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => {
                      setProfileData({ ...profileData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    className={`w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 ${errors.phone ? "border-red-500" : ""}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </>
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profileData.phone || "Not Provided"}
                </p>
              )}
            </div>

            {/* DOB */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
              {isEditing ? (
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) =>
                    setProfileData({ ...profileData, dateOfBirth: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(profileData.dateOfBirth)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MEDICAL DETAILS ================= */}


    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Medical Details
        </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {medicalFields.map(({ key, label, type, options }) => (
          <div key={key} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>

            {isEditing ? (
              type === "select" ? (
                <select
                  value={profileData[key]}
                  onChange={(e) =>
                    setProfileData({ ...profileData, [key]: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select --</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={profileData[key]}
                  onChange={(e) =>
                    setProfileData({ ...profileData, [key]: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
                />
              )
            ) : (
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {profileData[key] || "Not Provided"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
    
    </div>
  );
};

export default Profile;