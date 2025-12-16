import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/services/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Eye, Users, ShoppingBag, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataOperatorHeader from '@/components/data-operator/DataOperatorHeader';

interface FarmerProfile {
  user_id: number;
  full_name: string;
  phone_number: string;
  profile_photo_url_full?: string;
  date_of_birth?: string;
  nid_number?: string;
  father_name?: string;
  mother_name?: string;
  division?: string;
  district?: string;
  upazila?: string;
  union?: string;
  post_office?: string;
  village?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verified_at?: string;
  verified_by?: number;
}

interface CustomerProfile {
  user_id: number;
  full_name: string;
  phone_number: string;
  profile_photo_url_full?: string;
  date_of_birth?: string;
  nid_number?: string;
  division?: string;
  district?: string;
  upazila?: string;
  address?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verified_at?: string;
  verified_by?: number;
}

const ProfileVerification = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('farmer');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchFarmers(), fetchCustomers()]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await api.get('/data-operator/farmers');
      setFarmers(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching farmers:', error);
      toast.error(error.response?.data?.message || 'কৃষক তালিকা লোড করতে ব্যর্থ');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/data-operator/customers');
      setCustomers(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error(error.response?.data?.message || 'ক্রেতা তালিকা লোড করতে ব্যর্থ');
    }
  };

  const handleViewDetails = (farmer: FarmerProfile) => {
    setSelectedFarmer(farmer);
    setSelectedCustomer(null);
    setIsViewOpen(true);
  };

  const handleViewDetailsCustomer = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setSelectedFarmer(null);
    setIsViewOpen(true);
  };

  const handleVerification = async (userId: number, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(userId);
      
      const response = await api.post('/data-operator/verify-profile', {
        user_id: userId,
        verification_status: status,
      });

      toast.success(
        status === 'approved' 
          ? 'প্রোফাইল অনুমোদিত হয়েছে' 
          : 'প্রোফাইল প্রত্যাখ্যাত হয়েছে'
      );

      // Update local state based on active tab
      if (selectedFarmer) {
        setFarmers(farmers.map(f => 
          f.user_id === userId 
            ? { ...f, verification_status: status, verified_at: new Date().toISOString() }
            : f
        ));
      } else if (selectedCustomer) {
        setCustomers(customers.map(c => 
          c.user_id === userId 
            ? { ...c, verification_status: status, verified_at: new Date().toISOString() }
            : c
        ));
      }

      setIsViewOpen(false);
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.message || 'যাচাইকরণ ব্যর্থ হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            অনুমোদিত
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            প্রত্যাখ্যাত
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            অপেক্ষমাণ
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/data-operator-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">প্রোফাইল যাচাই</h1>
          </div>
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">তথ্য লোড হচ্ছে...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DataOperatorHeader />
      
      <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-[calc(100vh-73px)] p-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/data-operator-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">প্রোফাইল যাচাই</h1>
            </div>
          </div>

          {/* Tabs for different user types */}
          <Tabs defaultValue="farmer" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="farmer" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                কৃষক
                <Badge variant="secondary" className="ml-2">{farmers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                ক্রেতা
                <Badge variant="secondary" className="ml-2">{customers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="expert" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                কৃষি বিশেষজ্ঞ
                <Badge variant="secondary" className="ml-2">0</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Farmer Tab */}
            <TabsContent value="farmer" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">মোট কৃষক</div>
            <div className="text-2xl font-bold text-gray-800">{farmers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">অপেক্ষমাণ</div>
            <div className="text-2xl font-bold text-yellow-600">
              {farmers.filter(f => f.verification_status === 'pending' || !f.verification_status).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">অনুমোদিত</div>
            <div className="text-2xl font-bold text-green-600">
              {farmers.filter(f => f.verification_status === 'approved').length}
            </div>
          </div>
        </div>

        {/* Farmers List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    কৃষক
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    মোবাইল নম্বর
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    এলাকা
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    অবস্থা
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    কার্যক্রম
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {farmers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      কোন কৃষক পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  farmers.map((farmer) => (
                    <tr key={farmer.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {farmer.profile_photo_url_full ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={farmer.profile_photo_url_full}
                                alt={farmer.full_name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-600 font-medium">
                                  {farmer.full_name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {farmer.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{farmer.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {farmer.village && farmer.upazila 
                            ? `${farmer.village}, ${farmer.upazila}`
                            : farmer.district || 'তথ্য নেই'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(farmer.verification_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(farmer)}
                          className="mr-2"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          বিস্তারিত দেখুন
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
            </TabsContent>

            {/* Customer Tab */}
            <TabsContent value="customer" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">মোট ক্রেতা</div>
                  <div className="text-2xl font-bold text-gray-800">{customers.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">অপেক্ষমাণ</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {customers.filter(c => c.verification_status === 'pending' || !c.verification_status).length}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">অনুমোদিত</div>
                  <div className="text-2xl font-bold text-green-600">
                    {customers.filter(c => c.verification_status === 'approved').length}
                  </div>
                </div>
              </div>

              {/* Customers List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ক্রেতা
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          মোবাইল নম্বর
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          এলাকা
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          অবস্থা
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          কার্যক্রম
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            কোন ক্রেতা পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        customers.map((customer) => (
                          <tr key={customer.user_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {customer.profile_photo_url_full ? (
                                    <img
                                      className="h-10 w-10 rounded-full object-cover"
                                      src={customer.profile_photo_url_full}
                                      alt={customer.full_name}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <span className="text-blue-600 font-medium">
                                        {customer.full_name.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {customer.full_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{customer.phone_number}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {customer.address || customer.upazila 
                                  ? `${customer.address || customer.upazila}`
                                  : customer.district || 'তথ্য নেই'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(customer.verification_status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetailsCustomer(customer)}
                                className="mr-2"
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                বিস্তারিত দেখুন
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Agricultural Expert Tab */}
            <TabsContent value="expert" className="space-y-6">
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <GraduationCap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">শীঘ্রই আসছে</h3>
                <p className="text-gray-600">কৃষি বিশেষজ্ঞ প্রোফাইল যাচাই ফিচার শীঘ্রই যুক্ত হবে</p>
              </div>
            </TabsContent>
          </Tabs>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFarmer ? 'কৃষক প্রোফাইল' : 'ক্রেতা প্রোফাইল'}
            </DialogTitle>
            <DialogDescription>
              {selectedFarmer ? 'কৃষকের বিস্তারিত তথ্য' : 'ক্রেতার বিস্তারিত তথ্য'}
            </DialogDescription>
          </DialogHeader>

          {selectedFarmer && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="flex justify-center">
                {selectedFarmer.profile_photo_url_full ? (
                  <img
                    src={selectedFarmer.profile_photo_url_full}
                    alt={selectedFarmer.full_name}
                    className="h-32 w-32 rounded-full object-cover border-4 border-green-200"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-200">
                    <span className="text-4xl text-green-600 font-bold">
                      {selectedFarmer.full_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                {getStatusBadge(selectedFarmer.verification_status)}
              </div>

              {/* Rejection Alert */}
              {selectedFarmer.verification_status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">প্রোফাইল প্রত্যাখ্যাত</h4>
                      <p className="text-sm text-red-700 mt-1">
                        আপনার প্রোফাইল প্রত্যাখ্যাত হয়েছে। সঠিক তথ্য দিয়ে পুনরায় আপডেট করার জন্য অনুগ্রহ করে অফিসে যোগাযোগ করুন।
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  ব্যক্তিগত তথ্য
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">পূর্ণ নাম</label>
                    <p className="text-base text-gray-800 mt-1">{selectedFarmer.full_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">মোবাইল নম্বর</label>
                    <p className="text-base text-gray-800 mt-1">{selectedFarmer.phone_number}</p>
                  </div>
                  
                  {selectedFarmer.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">জন্ম তারিখ</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.date_of_birth}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.nid_number && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">জাতীয় পরিচয়পত্র নম্বর</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.nid_number}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.father_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">পিতার নাম</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.father_name}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.mother_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">মাতার নাম</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.mother_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  ঠিকানা
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedFarmer.division && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">বিভাগ</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.division}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.district && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">জেলা</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.district}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.upazila && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">উপজেলা</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.upazila}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.union && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">ইউনিয়ন</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.union}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.post_office && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">পোস্ট অফিস</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.post_office}</p>
                    </div>
                  )}
                  
                  {selectedFarmer.village && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">গ্রাম</label>
                      <p className="text-base text-gray-800 mt-1">{selectedFarmer.village}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {(!selectedFarmer.verification_status || selectedFarmer.verification_status === 'pending') && (
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => handleVerification(selectedFarmer.user_id, 'approved')}
                    disabled={processingId === selectedFarmer.user_id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {processingId === selectedFarmer.user_id ? 'প্রক্রিয়াকরণ...' : 'অনুমোদন করুন'}
                  </Button>
                  
                  <Button
                    onClick={() => handleVerification(selectedFarmer.user_id, 'rejected')}
                    disabled={processingId === selectedFarmer.user_id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {processingId === selectedFarmer.user_id ? 'প্রক্রিয়াকরণ...' : 'প্রত্যাখ্যান করুন'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="flex justify-center">
                {selectedCustomer.profile_photo_url_full ? (
                  <img
                    src={selectedCustomer.profile_photo_url_full}
                    alt={selectedCustomer.full_name}
                    className="h-32 w-32 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                    <span className="text-4xl text-blue-600 font-bold">
                      {selectedCustomer.full_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                {getStatusBadge(selectedCustomer.verification_status)}
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">পূর্ণ নাম</label>
                    <p className="text-base text-gray-800 mt-1">{selectedCustomer.full_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">মোবাইল নম্বর</label>
                    <p className="text-base text-gray-800 mt-1">{selectedCustomer.phone_number}</p>
                  </div>

                  {selectedCustomer.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">জন্ম তারিখ</label>
                      <p className="text-base text-gray-800 mt-1">
                        {new Date(selectedCustomer.date_of_birth).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                  )}

                  {selectedCustomer.nid_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">এনআইডি নম্বর</label>
                      <p className="text-base text-gray-800 mt-1">{selectedCustomer.nid_number}</p>
                    </div>
                  )}
                </div>

                {/* Address Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">ঠিকানা তথ্য</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCustomer.division && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">বিভাগ</label>
                        <p className="text-base text-gray-800 mt-1">{selectedCustomer.division}</p>
                      </div>
                    )}

                    {selectedCustomer.district && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">জেলা</label>
                        <p className="text-base text-gray-800 mt-1">{selectedCustomer.district}</p>
                      </div>
                    )}

                    {selectedCustomer.upazila && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">উপজেলা</label>
                        <p className="text-base text-gray-800 mt-1">{selectedCustomer.upazila}</p>
                      </div>
                    )}

                    {selectedCustomer.address && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-500">সম্পূর্ণ ঠিকানা</label>
                        <p className="text-base text-gray-800 mt-1">{selectedCustomer.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(!selectedCustomer.verification_status || selectedCustomer.verification_status === 'pending') && (
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => handleVerification(selectedCustomer.user_id, 'approved')}
                    disabled={processingId === selectedCustomer.user_id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {processingId === selectedCustomer.user_id ? 'প্রক্রিয়াকরণ...' : 'অনুমোদন করুন'}
                  </Button>
                  
                  <Button
                    onClick={() => handleVerification(selectedCustomer.user_id, 'rejected')}
                    disabled={processingId === selectedCustomer.user_id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {processingId === selectedCustomer.user_id ? 'প্রক্রিয়াকরণ...' : 'প্রত্যাখ্যান করুন'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProfileVerification;
