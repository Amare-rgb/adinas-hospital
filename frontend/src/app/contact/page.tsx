// app/contact/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Header } from '@/components/Header';

import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  User, 
  MessageSquare, 
  Tag, 
  PhoneCall,
  Map,
  Lock,
  Loader2
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Handle hash navigation
  useEffect(() => {
    if (window.location.hash === '#contact') {
      const element = document.getElementById('contact');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus({
        type: 'success',
        message: '✅ Your message has been sent successfully! We\'ll get back to you within 24 hours.',
      });
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: '❌ Something went wrong. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <section id="contact" className="min-h-screen bg-gray-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              <MapPin className="inline-block w-7 h-7 text-[#2A3380] mr-2" />
              Contact & Location
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Get in touch with us or visit our location
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Contact Form */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#2A3380]" />
                    Send us a message
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">We'll respond within 24 hours</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 mb-1">
                      <User className="inline-block w-3.5 h-3.5 text-[#2A3380] mr-1.5" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Abebe Kebede"
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-all bg-gray-50 hover:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                      <Mail className="inline-block w-3.5 h-3.5 text-[#2A3380] mr-1.5" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-all bg-gray-50 hover:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                      <Phone className="inline-block w-3.5 h-3.5 text-[#2A3380] mr-1.5" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+251 9XX XXX XXX"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-all bg-gray-50 hover:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold text-gray-700 mb-1">
                      <Tag className="inline-block w-3.5 h-3.5 text-[#2A3380] mr-1.5" />
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief subject"
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-all bg-gray-50 hover:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1">
                      <MessageSquare className="inline-block w-3.5 h-3.5 text-[#2A3380] mr-1.5" />
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe your inquiry..."
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-all bg-gray-50 hover:bg-white resize-y text-sm"
                    />
                  </div>

                  {submitStatus.type && (
                    <div
                      className={`p-2.5 rounded-lg text-xs ${
                        submitStatus.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {submitStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-2.5 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm ${
                      isSubmitting
                        ? 'bg-[#2A3380]/60 cursor-not-allowed'
                        : 'bg-[#2A3380] hover:bg-[#1E3A8A] hover:shadow-md transform hover:scale-[1.01] active:scale-[0.98]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 text-center mt-1.5 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-gray-300" />
                    Your information is secure
                  </p>
                </form>
              </div>
            </div>

            {/* Right Column - Contact Information */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="space-y-4">
                  {/* Address */}
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-[#2A3380]" />
                      Address
                    </h3>
                    <p className="text-gray-600 text-sm mt-0.5 ml-6">
                      Bahir Dar, Kebele 13
                    </p>
                    <p className="text-gray-600 text-sm ml-6">
                      Around Felege Hiwot Hospital
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5 ml-6 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      8:00 – 20:00 (Mon–Sat)
                    </p>
                  </div>

                  {/* Emergency Line */}
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                      <PhoneCall className="w-4 h-4 text-red-500" />
                      Emergency Line
                    </h3>
                    <p className="text-2xl font-bold text-red-600 mt-0.5 ml-6">8560</p>
                    <p className="text-gray-500 text-[10px] ml-6">Emergency Hotline</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-[#2A3380]" />
                      Phone
                    </h3>
                    <p className="text-gray-700 text-sm mt-0.5 ml-6">
                      +251 58 320 4167
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-[#2A3380]" />
                      Email
                    </h3>
                    <p className="text-gray-700 text-sm mt-0.5 ml-6">
                      info@adinashospital.com
                    </p>
                  </div>

                  {/* Working Hours */}
                  <div className="pt-3 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[#2A3380]" />
                      Working Hours
                    </h3>
                    <p className="text-gray-700 text-sm mt-0.5 ml-6">Monday - Saturday</p>
                    <p className="text-gray-700 font-semibold text-sm ml-6">8:00 AM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="p-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <Map className="w-4 h-4 text-[#2A3380]" />
                  Find Us Here
                </h3>
              </div>
              <div className="h-[300px] md:h-[350px] w-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.234567890123!2d37.390123!3d11.601234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDM2JzA0LjQiTiAzN8KwMjMnMjQuMCJF!5e0!3m2!1sen!2set!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Adinas Hospital Location Map"
                ></iframe>
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2A3380]" />
                    Bahir Dar, Kebele 13
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#2A3380]" />
                    +251 58 320 4167
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#2A3380]" />
                    8:00 AM - 8:00 PM (Mon-Sat)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    
    </>
  );
}