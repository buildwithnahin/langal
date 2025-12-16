import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CloudSun, 
  Droplets, 
  Thermometer, 
  Bug, 
  Sprout,
  Calendar,
  Plus,
  Eye,
  Trash2,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LocationSelector from '@/components/farmer/LocationSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
}

interface FieldReport {
  report_id: number;
  postal_code?: number;
  village: string;
  weather_condition: string;
  temperature?: number;
  rainfall?: number;
  crop_condition?: string;
  pest_disease?: string;
  soil_moisture?: string;
  irrigation_status?: string;
  notes?: string;
  report_date: string;
  location_info?: {
    division_bn?: string;
    district_bn?: string;
    upazila_bn?: string;
    post_office_bn?: string;
  };
}

const FieldDataCollection = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FieldReport | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    village: '',
    postal_code: 0,
    weather_condition: '',
    temperature: '',
    rainfall: '',
    crop_condition: '',
    pest_disease: '',
    soil_moisture: '',
    irrigation_status: '',
    notes: '',
    report_date: new Date().toISOString().split('T')[0]
  });

  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/data-operator/field-reports');
      setReports(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error(error.response?.data?.message || 'রিপোর্ট লোড করতে ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationData: LocationData) => {
    setLocation(locationData);
    setFormData(prev => ({
      ...prev,
      postal_code: locationData.postal_code
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.village) {
      toast.error('গ্রামের নাম দিন');
      return;
    }

    if (!formData.weather_condition) {
      toast.error('আবহাওয়ার অবস্থা নির্বাচন করুন');
      return;
    }

    try {
      setLoading(true);
      await api.post('/data-operator/field-reports', formData);
      
      toast.success('রিপোর্ট সফলভাবে সংরক্ষিত হয়েছে');
      
      // Reset form
      setFormData({
        village: '',
        postal_code: 0,
        weather_condition: '',
        temperature: '',
        rainfall: '',
        crop_condition: '',
        pest_disease: '',
        soil_moisture: '',
        irrigation_status: '',
        notes: '',
        report_date: new Date().toISOString().split('T')[0]
      });
      setLocation(null);
      setShowForm(false);
      
      // Refresh list
      fetchReports();
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(error.response?.data?.message || 'রিপোর্ট সংরক্ষণ করতে ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('আপনি কি এই রিপোর্ট মুছে ফেলতে চান?')) return;

    try {
      await api.delete(`/data-operator/field-reports/${reportId}`);
      toast.success('রিপোর্ট মুছে ফেলা হয়েছে');
      fetchReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'রিপোর্ট মুছতে ব্যর্থ');
    }
  };

  const getWeatherIcon = (condition: string) => {
    const icons: any = {
      'sunny': '☀️',
      'cloudy': '☁️',
      'rainy': '🌧️',
      'stormy': '⛈️'
    };
    return icons[condition] || '🌤️';
  };

  const getWeatherBadgeColor = (condition: string) => {
    const colors: any = {
      'sunny': 'bg-yellow-100 text-yellow-800',
      'cloudy': 'bg-gray-100 text-gray-800',
      'rainy': 'bg-blue-100 text-blue-800',
      'stormy': 'bg-purple-100 text-purple-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/data-operator-dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">মাঠ পর্যায়ের তথ্য</h1>
              <p className="text-sm text-gray-600">আবহাওয়া ও কৃষি তথ্য সংগ্রহ</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            নতুন রিপোর্ট
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <CloudSun className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">মোট রিপোর্ট</div>
                  <div className="text-2xl font-bold text-gray-800">{reports.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">আজকের রিপোর্ট</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {reports.filter(r => r.report_date === new Date().toISOString().split('T')[0]).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">এলাকা</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {new Set(reports.map(r => r.village)).size}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>নতুন মাঠ রিপোর্ট</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location Selector */}
                <div className="space-y-4">
                  <Label>এলাকা নির্বাচন করুন</Label>
                  <LocationSelector
                    onLocationSelect={handleLocationSelect}
                    initialPostalCode={formData.postal_code || undefined}
                  />
                  {location && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {location.division_bn}, {location.district_bn}, {location.upazila_bn}, {location.post_office_bn}
                    </div>
                  )}
                </div>

                {/* Village Name */}
                <div>
                  <Label htmlFor="village">গ্রামের নাম *</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="গ্রামের নাম লিখুন"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="report_date">তারিখ *</Label>
                  <Input
                    id="report_date"
                    type="date"
                    value={formData.report_date}
                    onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                    required
                  />
                </div>

                {/* Weather Condition */}
                <div>
                  <Label htmlFor="weather_condition">আবহাওয়ার অবস্থা *</Label>
                  <Select
                    value={formData.weather_condition}
                    onValueChange={(value) => setFormData({ ...formData, weather_condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="আবহাওয়া নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">☀️ রৌদ্রজ্জ্বল</SelectItem>
                      <SelectItem value="cloudy">☁️ মেঘলা</SelectItem>
                      <SelectItem value="rainy">🌧️ বৃষ্টি</SelectItem>
                      <SelectItem value="stormy">⛈️ ঝড়</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temperature */}
                  <div>
                    <Label htmlFor="temperature">তাপমাত্রা (°সে)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="যেমন: 28.5"
                    />
                  </div>

                  {/* Rainfall */}
                  <div>
                    <Label htmlFor="rainfall">বৃষ্টিপাত (মিমি)</Label>
                    <Input
                      id="rainfall"
                      type="number"
                      step="0.1"
                      value={formData.rainfall}
                      onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
                      placeholder="যেমন: 15.5"
                    />
                  </div>
                </div>

                {/* Soil Moisture */}
                <div>
                  <Label htmlFor="soil_moisture">মাটির আর্দ্রতা</Label>
                  <Select
                    value={formData.soil_moisture}
                    onValueChange={(value) => setFormData({ ...formData, soil_moisture: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="মাটির আর্দ্রতা নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry">শুষ্ক</SelectItem>
                      <SelectItem value="moderate">মাঝারি</SelectItem>
                      <SelectItem value="wet">ভেজা</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Irrigation Status */}
                <div>
                  <Label htmlFor="irrigation_status">সেচের অবস্থা</Label>
                  <Select
                    value={formData.irrigation_status}
                    onValueChange={(value) => setFormData({ ...formData, irrigation_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="সেচের অবস্থা নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">ভালো</SelectItem>
                      <SelectItem value="moderate">মাঝারি</SelectItem>
                      <SelectItem value="poor">খারাপ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Crop Condition */}
                <div>
                  <Label htmlFor="crop_condition">ফসলের অবস্থা</Label>
                  <Textarea
                    id="crop_condition"
                    value={formData.crop_condition}
                    onChange={(e) => setFormData({ ...formData, crop_condition: e.target.value })}
                    placeholder="ফসলের বর্তমান অবস্থা বর্ণনা করুন"
                    rows={3}
                  />
                </div>

                {/* Pest/Disease */}
                <div>
                  <Label htmlFor="pest_disease">পোকামাকড় / রোগবালাই</Label>
                  <Textarea
                    id="pest_disease"
                    value={formData.pest_disease}
                    onChange={(e) => setFormData({ ...formData, pest_disease: e.target.value })}
                    placeholder="পোকামাকড় বা রোগবালাইয়ের তথ্য লিখুন"
                    rows={3}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">অতিরিক্ত মন্তব্য</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="অন্যান্য গুরুত্বপূর্ণ তথ্য"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                    {loading ? 'সংরক্ষণ হচ্ছে...' : 'রিপোর্ট সংরক্ষণ করুন'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    বাতিল
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>সংরক্ষিত রিপোর্ট</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && reports.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CloudSun className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>কোন রিপোর্ট পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <Card key={report.report_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{report.village}</h3>
                            <p className="text-sm text-gray-600">
                              {report.location_info?.upazila_bn}, {report.location_info?.district_bn}
                            </p>
                          </div>
                          <Badge className={getWeatherBadgeColor(report.weather_condition)}>
                            {getWeatherIcon(report.weather_condition)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {report.temperature && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-4 w-4" />
                              {report.temperature}°সে
                            </div>
                          )}
                          {report.rainfall && (
                            <div className="flex items-center gap-1">
                              <Droplets className="h-4 w-4" />
                              {report.rainfall} মিমি
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-gray-600">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {new Date(report.report_date).toLocaleDateString('bn-BD')}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            বিস্তারিত
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(report.report_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>রিপোর্টের বিস্তারিত তথ্য</DialogTitle>
            <DialogDescription>
              মাঠ পর্যায়ের সংগৃহীত তথ্য
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{selectedReport.village}</h3>
                <p className="text-sm text-gray-600">
                  {selectedReport.location_info?.division_bn} › {selectedReport.location_info?.district_bn} › {selectedReport.location_info?.upazila_bn}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">তারিখ</Label>
                  <p className="font-medium">{new Date(selectedReport.report_date).toLocaleDateString('bn-BD')}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">আবহাওয়া</Label>
                  <p className="font-medium">
                    {getWeatherIcon(selectedReport.weather_condition)} {
                      selectedReport.weather_condition === 'sunny' ? 'রৌদ্রজ্জ্বল' :
                      selectedReport.weather_condition === 'cloudy' ? 'মেঘলা' :
                      selectedReport.weather_condition === 'rainy' ? 'বৃষ্টি' : 'ঝড়'
                    }
                  </p>
                </div>
                {selectedReport.temperature && (
                  <div>
                    <Label className="text-sm text-gray-500">তাপমাত্রা</Label>
                    <p className="font-medium">{selectedReport.temperature}°সে</p>
                  </div>
                )}
                {selectedReport.rainfall && (
                  <div>
                    <Label className="text-sm text-gray-500">বৃষ্টিপাত</Label>
                    <p className="font-medium">{selectedReport.rainfall} মিমি</p>
                  </div>
                )}
                {selectedReport.soil_moisture && (
                  <div>
                    <Label className="text-sm text-gray-500">মাটির আর্দ্রতা</Label>
                    <p className="font-medium">
                      {selectedReport.soil_moisture === 'dry' ? 'শুষ্ক' :
                       selectedReport.soil_moisture === 'moderate' ? 'মাঝারি' : 'ভেজা'}
                    </p>
                  </div>
                )}
                {selectedReport.irrigation_status && (
                  <div>
                    <Label className="text-sm text-gray-500">সেচের অবস্থা</Label>
                    <p className="font-medium">
                      {selectedReport.irrigation_status === 'good' ? 'ভালো' :
                       selectedReport.irrigation_status === 'moderate' ? 'মাঝারি' : 'খারাপ'}
                    </p>
                  </div>
                )}
              </div>

              {selectedReport.crop_condition && (
                <div>
                  <Label className="text-sm text-gray-500">ফসলের অবস্থা</Label>
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{selectedReport.crop_condition}</p>
                </div>
              )}

              {selectedReport.pest_disease && (
                <div>
                  <Label className="text-sm text-gray-500">পোকামাকড় / রোগবালাই</Label>
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{selectedReport.pest_disease}</p>
                </div>
              )}

              {selectedReport.notes && (
                <div>
                  <Label className="text-sm text-gray-500">অতিরিক্ত মন্তব্য</Label>
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldDataCollection;
