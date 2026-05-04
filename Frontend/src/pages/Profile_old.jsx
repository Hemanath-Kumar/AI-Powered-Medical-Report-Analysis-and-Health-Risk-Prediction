import React, { useEffect, useMemo, useState } from 'react';
import { User, Mail, Phone, Calendar, Edit3, Save, X } from 'lucide-react';
import HealthMetricsChart from '../components/Charts/HealthMetricsChart';
import { useAuth } from '../contexts/AuthContext';



const Profile = () => {
    const { user, getprofile, setprofile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '----',
        dateOfBirth: '',
        gender: '',
        bloodType: '',
        allergies: '',

    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getprofile();   // call the function
                // console.log(data)
                setProfileData(prev => ({
                    ...prev,
                    phone: data.phone || prev.phone,
                    dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
                    gender: data.gender || prev.gender,
                    bloodType: data.bloodType || prev.bloodType,
                    allergies: data.allergies || prev.allergies,
                }));


            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchProfile();
    }, [getprofile]);


    const healthHistory = useMemo(() => {
        return [
            { date: '2024-01', cholesterol: 195, sugar: 102, hemoglobin: 13.8, weight: 65 },
            { date: '2024-03', cholesterol: 190, sugar: 98, hemoglobin: 14.0, weight: 64 },
            { date: '2024-06', cholesterol: 185, sugar: 95, hemoglobin: 14.2, weight: 63 },
            { date: '2024-09', cholesterol: 180, sugar: 92, hemoglobin: 14.1, weight: 62 },
            { date: '2024-12', cholesterol: 175, sugar: 89, hemoglobin: 14.3, weight: 62 },
            { date: '2025-01', cholesterol: 170, sugar: 87, hemoglobin: 14.4, weight: 61 },
        ];
    }, []);


    const handleSave = async () => {
        setIsEditing(false);
        try {
            await setprofile(profileData);

        } catch (error) {
            console.error("Error fetching profile:", error);
        }

    };

    const handleCancel = () => setIsEditing(false);


    return (

        <div className="space-y-10">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center md:items-start md:space-x-8">
                <div className="flex flex-col items-center text-center md:text-left">
                    <div className="bg-blue-500 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                        <User className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                    <p className="text-gray-600 capitalize">{user?.role}</p>
                </div>

                <div className="flex-1 mt-6 md:mt-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Profile Overview</h3>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center text-blue-600 hover:text-blue-700"
                            >
                                <Edit3 className="h-4 w-4 mr-1" /> Edit
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center text-green-600 hover:text-green-700"
                                >
                                    <Save className="h-4 w-4 mr-1" /> Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center text-red-600 hover:text-red-700"
                                >
                                    <X className="h-4 w-4 mr-1" /> Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <div className="flex items-center text-gray-900">
                                    <User className="h-4 w-4 text-gray-400 mr-2" />
                                    {profileData.name}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <div className="flex items-center text-gray-900">
                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                    {profileData.email}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <div className="flex items-center text-gray-900">
                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                    {profileData.phone}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={profileData.dateOfBirth}
                                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <div className="flex items-center text-gray-900">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                    {new Date(profileData.dateOfBirth).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Medical Info Section */}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-1 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Details</h3>
                    <ul className="space-y-3">
                        {/* Blood Type */}
                        <li className="flex justify-between border-b pb-2 items-center">
                            <span className="text-gray-600">Blood Type:</span>
                            {isEditing ? (
                                <select
                                    value={profileData.bloodType || ""}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, bloodType: e.target.value })
                                    }
                                    className="w-1/2 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            ) : (
                                <span className="text-gray-900 font-medium">{profileData.bloodType}</span>
                            )}
                        </li>

                        {/* Gender */}
                        <li className="flex justify-between border-b pb-2 items-center">
                            <span className="text-gray-600">Gender:</span>
                            {isEditing ? (
                                <select
                                    value={profileData.gender || ""}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, gender: e.target.value })
                                    }
                                    className="w-1/2 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <span className="text-gray-900 font-medium">{profileData.gender}</span>
                            )}
                        </li>

                        {/* Allergies */}
                        <li className="flex justify-between border-b pb-2 items-center">
                            <span className="text-gray-600">Allergies:</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={profileData.allergies}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, allergies: e.target.value })
                                    }
                                    className="w-1/2 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </input>
                            ) : (
                                <span className="text-gray-900 font-medium">{profileData.allergies}</span>
                            )}
                        </li>
                    </ul>
                </div>
            </div>



            {/* Health Analytics Section */}
            <div className="space-y-6">
                <HealthMetricsChart
                    data={healthHistory}
                    type="line"
                    title="Cholesterol Trends (6 Months)"
                    dataKey="cholesterol"
                    color="#10B981"
                />
                <HealthMetricsChart
                    data={healthHistory}
                    type="bar"
                    title="Blood Sugar Levels (6 Months)"
                    dataKey="sugar"
                    color="#3B82F6"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <HealthMetricsChart
                        data={healthHistory}
                        type="line"
                        title="Hemoglobin Levels"
                        dataKey="hemoglobin"
                        color="#8B5CF6"
                    />
                    <HealthMetricsChart
                        data={healthHistory}
                        type="line"
                        title="Weight Tracking"
                        dataKey="weight"
                        color="#F59E0B"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Health Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                        <h4 className="font-medium text-green-900 mb-1">Cholesterol</h4>
                        <p className="text-2xl font-bold text-green-600">170 mg/dL</p>
                        <p className="text-sm text-green-700">Excellent improvement!</p>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-1">Blood Sugar</h4>
                        <p className="text-2xl font-bold text-blue-600">87 mg/dL</p>
                        <p className="text-sm text-blue-700">Within normal range</p>
                    </div>
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
                        <h4 className="font-medium text-purple-900 mb-1">Hemoglobin</h4>
                        <p className="text-2xl font-bold text-purple-600">14.4 g/dL</p>
                        <p className="text-sm text-purple-700">Healthy levels</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
