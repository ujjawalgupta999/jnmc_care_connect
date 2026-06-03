"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2, Copy, Printer } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function RegisterPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    phone: "",
    address: "",
    patientType: "general", // general, student, employee
    enrollmentNumber: "",
    employeeId: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/patient/register`, formData);
      if (response.data.success) {
        toast.success("Patient registered successfully!");
        setSuccessData({
          uhid: response.data.uhid,
          name: formData.name
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (successData?.uhid) {
      navigator.clipboard.writeText(successData.uhid);
      toast.success("UHID copied to clipboard!");
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
        <Card className="w-full max-w-md shadow-lg border-green-100 print:shadow-none print:border-none print:max-w-none">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 print:hidden">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Patient Registration Details</CardTitle>
            <CardDescription className="text-gray-500 print:hidden">
              Your patient profile has been created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center space-y-2 print:border-gray-300 print:bg-white">
              <p className="text-sm text-gray-500 font-medium">Your Unique Health ID (UHID)</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-mono font-bold tracking-wider text-[#1D3108]">
                  {successData.uhid}
                </p>
                <Button variant="ghost" size="icon" onClick={copyToClipboard} className="text-gray-500 hover:text-black">
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 print:hidden">Please save this number. You will need it to download your reports and at the registration desk.</p>
            </div>
            
            {/* Print Only Details */}
            <div className="hidden print:block text-left mt-8 space-y-2 border-t pt-4">
              <p><strong>Name:</strong> {successData.name}</p>
              <p className="text-sm text-gray-500 mt-4">Please present this UHID at the registration desk.</p>
            </div>

            <div className="flex flex-col gap-3 print:hidden">
              <Button 
                className="w-full h-12 bg-[#1D3108] hover:bg-[#1D3108]/90 text-white rounded-xl"
                onClick={() => window.print()}
              >
                <Printer className="w-5 h-5 mr-2" />
                Print UHID Card
              </Button>
              <Button 
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => router.push("/")}
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 text-gray-500 hover:text-gray-900"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
          <div className="bg-[#1D3108] p-8 text-white">
            <h1 className="text-3xl font-bold">Patient Registration</h1>
            <p className="mt-2 text-white/80">Register to get your Unique Health ID (UHID)</p>
          </div>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="h-12 rounded-xl" placeholder="John Doe" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="h-12 rounded-xl" placeholder="9876543210" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} required className="h-12 rounded-xl" placeholder="25" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select onValueChange={(value) => handleSelectChange("gender", value)} required>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea id="address" name="address" value={formData.address} onChange={handleChange} required className="rounded-xl min-h-[100px]" placeholder="123 Main St, City, State" />
                </div>
              </div>

              {/* Patient Category */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Patient Category</h3>
                
                <RadioGroup 
                  defaultValue="general" 
                  onValueChange={(value) => handleSelectChange("patientType", value)}
                  className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0 mt-4"
                >
                  <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-xl border flex-1">
                    <RadioGroupItem value="general" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer">General Public</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-xl border flex-1">
                    <RadioGroupItem value="student" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-xl border flex-1">
                    <RadioGroupItem value="employee" id="r3" />
                    <Label htmlFor="r3" className="cursor-pointer">Employee</Label>
                  </div>
                </RadioGroup>

                {/* Conditional Fields */}
                {formData.patientType === "student" && (
                  <div className="space-y-2 mt-4 animate-in slide-in-from-top-2">
                    <Label htmlFor="enrollmentNumber">Enrollment Number *</Label>
                    <Input id="enrollmentNumber" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} required className="h-12 rounded-xl" placeholder="e.g. EN123456" />
                  </div>
                )}

                {formData.patientType === "employee" && (
                  <div className="space-y-2 mt-4 animate-in slide-in-from-top-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} required className="h-12 rounded-xl" placeholder="e.g. EMP98765" />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1D3108] hover:bg-[#1D3108]/90 text-white text-lg rounded-xl">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Register Patient"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
