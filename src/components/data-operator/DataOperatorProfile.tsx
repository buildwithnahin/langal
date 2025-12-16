import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import LocationSelector from "@/components/farmer/LocationSelector";
import { User, Phone, Mail, IdCard, Edit2, Save, X, Camera, Upload } from "lucide-react";

interface DataOperatorProfileProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface LocationData {
    postal_code: number;
    division: string;
    division_bn: string;
    district: string;
    district_bn: string;
    upazila: string;
    upazila_bn: string;
    post_office: string;
    post_office_bn: string;
    village?: string;
}

const DataOperatorProfile = ({ open, onOpenChange }: DataOperatorProfileProps) => {
    const { user, setAuthUser } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string>("");
    
    const [profileData, setProfileData] = useState({
        fullName: "",
        phone: "",
        email: "",
        nidNumber: "",
        dateOfBirth: "",
        fatherName: "",
        motherName: "",
        address: "",
        village: "",
        profilePhotoUrl: "",
        postalCode: 0
    });

    const [location, setLocation] = useState<LocationData | null>(null);

    useEffect(() => {
        if (open && user) {
            loadProfile();
        }
    }, [open, user]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/data-operator/profile');
            
            if (response.data.success) {
                const profile = response.data.data;
                
                // Format date of birth to YYYY-MM-DD if it exists
                let formattedDob = "";
                if (profile.profile?.date_of_birth) {
                    const dobDate = new Date(profile.profile.date_of_birth);
                    if (!isNaN(dobDate.getTime())) {
                        formattedDob = dobDate.toISOString().split('T')[0];
                    }
                }

                setProfileData({
                    fullName: profile.profile?.full_name || "",
                    phone: profile.phone || "",
                    email: profile.email || "",
                    nidNumber: profile.profile?.nid_number || "",
                    dateOfBirth: formattedDob,
                    fatherName: profile.profile?.father_name || "",
                    motherName: profile.profile?.mother_name || "",
                    address: profile.profile?.address || "",
                    village: profile.profile?.village || "",
                    profilePhotoUrl: profile.profile?.profile_photo_url_full || "",
                    postalCode: profile.profile?.postal_code || 0
                });

                setProfileImagePreview(profile.profile?.profile_photo_url_full || "");

                // Set location if available
                if (profile.location_info) {
                    setLocation({
                        postal_code: profile.location_info.postal_code,
                        division: profile.location_info.division || "",
                        division_bn: profile.location_info.division_bn || "",
                        district: profile.location_info.district || "",
                        district_bn: profile.location_info.district_bn || "",
                        upazila: profile.location_info.upazila || "",
                        upazila_bn: profile.location_info.upazila_bn || "",
                        post_office: profile.location_info.post_office || "",
                        post_office_bn: profile.location_info.post_office_bn || "",
                        village: profile.location_info.village || ""
                    });
                }
            }
        } catch (error) {
            console.error('Profile load error:', error);
            toast({
                title: "ত্রুটি",
                description: "প্রোফাইল লোড করতে সমস্যা হয়েছে",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "ত্রুটি",
                    description: "ছবির সাইজ ৫ এমবি এর বেশি হতে পারবে না",
                    variant: "destructive"
                });
                return;
            }

            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLocationChange = (newLocation: LocationData) => {
        setLocation(newLocation);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            
            const formData = new FormData();
            formData.append('full_name', profileData.fullName);
            formData.append('email', profileData.email || '');
            formData.append('father_name', profileData.fatherName || '');
            formData.append('mother_name', profileData.motherName || '');
            
            if (location) {
                formData.append('postal_code', location.postal_code.toString());
                formData.append('village', location.village || '');
                
                const addressParts = [];
                if (location.village) addressParts.push(`গ্রাম: ${location.village}`);
                if (location.post_office_bn) addressParts.push(`ডাকঘর: ${location.post_office_bn}`);
                if (location.upazila_bn) addressParts.push(`উপজেলা: ${location.upazila_bn}`);
                if (location.district_bn) addressParts.push(`জেলা: ${location.district_bn}`);
                if (location.division_bn) addressParts.push(`বিভাগ: ${location.division_bn}`);
                const address = addressParts.join(', ');
                formData.append('address', address);
            }

            if (profileImage) {
                formData.append('profile_photo', profileImage);
            }

            const response = await api.post('/data-operator/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const updatedUser = response.data.data;
                
                toast({
                    title: "সফল",
                    description: "প্রোফাইল সফলভাবে আপডেট হয়েছে",
                });
                
                // Update user in AuthContext to reflect changes in dashboard
                const currentToken = localStorage.getItem('auth_token');
                if (currentToken) {
                    setAuthUser(
                        {
                            id: updatedUser.user_id.toString(),
                            name: updatedUser.profile?.full_name || updatedUser.phone,
                            type: 'data_operator' as const,
                            email: updatedUser.email || '',
                            phone: updatedUser.phone,
                            profilePhoto: updatedUser.profile?.profile_photo_url_full,
                            location: updatedUser.profile?.address || 'Bangladesh',
                            location_info: updatedUser.location_info || undefined
                        },
                        currentToken
                    );
                }

                setIsEditing(false);
                setProfileImage(null);
                loadProfile(); // Reload to sync with backend
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast({
                title: "ত্রুটি",
                description: error.response?.data?.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setProfileImage(null);
        loadProfile();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold text-orange-800 flex items-center gap-2">
                            <User className="h-6 w-6" />
                            ডাটা অপারেটর প্রোফাইল
                        </DialogTitle>
                        {!isEditing && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                                <Edit2 className="h-4 w-4 mr-2" />
                                সম্পাদনা
                            </Button>
                        )}
                    </div>
                    <DialogDescription>
                        আপনার ব্যক্তিগত তথ্য দেখুন এবং আপডেট করুন
                    </DialogDescription>
                </DialogHeader>

                {loading && !profileData.fullName ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-4 py-4 border-b">
                            <div className="relative">
                                <Avatar className="h-32 w-32 border-4 border-orange-200">
                                    <AvatarImage src={profileImagePreview} alt={profileData.fullName} />
                                    <AvatarFallback className="bg-orange-100 text-orange-800 text-3xl">
                                        {profileData.fullName.charAt(0) || 'D'}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="absolute bottom-0 right-0 rounded-full bg-white shadow-lg hover:bg-orange-50"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="h-4 w-4 text-orange-600" />
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-900">{profileData.fullName}</h3>
                                <p className="text-sm text-gray-600">ডাটা অপারেটর</p>
                                {isEditing && profileImage && (
                                    <p className="text-xs text-orange-600 mt-1 flex items-center justify-center gap-1">
                                        <Upload className="h-3 w-3" />
                                        নতুন ছবি নির্বাচিত
                                    </p>
                                )}
                            </div>
                        </div>

                        <Card>
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <IdCard className="h-5 w-5 text-orange-600" />
                                    ব্যক্তিগত তথ্য
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                                <div>
                                    <Label htmlFor="fullName" className="text-gray-700 font-semibold">সম্পূর্ণ নাম *</Label>
                                    <Input
                                        id="fullName"
                                        value={profileData.fullName}
                                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                        disabled={!isEditing}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="nidNumber" className="text-gray-700 font-semibold">জাতীয় পরিচয়পত্র নম্বর</Label>
                                    <Input
                                        id="nidNumber"
                                        value={profileData.nidNumber}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="dateOfBirth" className="text-gray-700 font-semibold">জন্ম তারিখ</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={profileData.dateOfBirth}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="fatherName" className="text-gray-700 font-semibold">পিতার নাম</Label>
                                    <Input
                                        id="fatherName"
                                        value={profileData.fatherName}
                                        onChange={(e) => setProfileData({ ...profileData, fatherName: e.target.value })}
                                        disabled={!isEditing}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="motherName" className="text-gray-700 font-semibold">মাতার নাম</Label>
                                    <Input
                                        id="motherName"
                                        value={profileData.motherName}
                                        onChange={(e) => setProfileData({ ...profileData, motherName: e.target.value })}
                                        disabled={!isEditing}
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Phone className="h-5 w-5 text-blue-600" />
                                    যোগাযোগের তথ্য
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                                <div>
                                    <Label htmlFor="phone" className="text-gray-700 font-semibold">মোবাইল নম্বর</Label>
                                    <Input
                                        id="phone"
                                        value={profileData.phone}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email" className="text-gray-700 font-semibold">ইমেইল</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        disabled={!isEditing}
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-green-600" />
                                    ঠিকানা
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {isEditing ? (
                                    <LocationSelector
                                        value={location}
                                        onChange={handleLocationChange}
                                    />
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-800 whitespace-pre-line">{profileData.address || 'ঠিকানা যুক্ত করুন'}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {isEditing && (
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    বাতিল
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            সংরক্ষণ হচ্ছে...
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            সংরক্ষণ করুন
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DataOperatorProfile;
