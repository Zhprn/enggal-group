import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, API_BASE_URL } from '../lib/api-client';
import { fetchProvinces, fetchRegenciesByProvince } from '../lib/wilayah';
import brandIcon from '../assets/images/brand_icon.svg';
import outletIcon from '../assets/images/outlet_icon.svg';
import cityIcon from '../assets/images/city_icon.svg';
import heroIllustration from '../assets/images/hero_illustration.webp';
import vectorLine from '../assets/images/vector_line.svg';
import comfortIcon from '../assets/images/comfort_icon.svg';
import trainingIcon from '../assets/images/training_icon.svg';
import careerIcon from '../assets/images/career_icon.svg';
import multibrandIcon from '../assets/images/multibrand_icon.svg';
import uploadIcon from '../assets/images/upload_icon.svg';
import careerGroup from '../assets/images/career_group.webp';
import LogoCarousel from '../components/LogoCarousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Button } from '../components/ui/button';

type Brand = {
  id: string;
  nama: string;
  logo: string;
  coverImage?: string;
  description: string;
};

type BrandListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

// Zod validation schema
const careerFormSchema = z.object({
  name: z.string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z\s]+$/, 'Nama hanya boleh berisi huruf dan spasi'),
  whatsapp: z.string()
    .min(10, 'Nomor WhatsApp minimal 10 digit')
    .max(15, 'Nomor WhatsApp maksimal 15 digit')
    .regex(/^[0-9]+$/, 'Nomor WhatsApp hanya boleh berisi angka'),
  email: z.string()
    .email('Format email tidak valid')
    .min(5, 'Email terlalu pendek')
    .max(100, 'Email terlalu panjang'),
  address: z.string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  cv: z.instanceof(File, { message: 'CV harus diupload' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Ukuran file CV maksimal 5MB')
    .refine((file) => file.type === 'application/pdf', 'File CV harus berformat PDF'),
  jenis_kelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN'], {
    error: () => ({ message: 'Jenis kelamin harus dipilih' })
  }),
  kota: z.string().min(3, 'Kota minimal 3 karakter').max(100, 'Kota maksimal 100 karakter'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir harus dipilih'),
});

type CareerFormData = z.infer<typeof careerFormSchema>;

async function fetchBrands() {
  const response = await apiClient.get<Brand[], BrandListMeta>(
    `/brand?page=1&limit=100`,
  );

  const items = response.data ?? [];
  const meta = response.meta ?? {};

  return {
    data: items,
    meta: {
      total: meta.total ?? items.length,
      page: 1,
      limit: 100
    },
  };
}

type UserCareerFormData = {
  tanggal: string;
  nama: string;
  no_hp: string;
  email: string;
  alamat: string;
  cv: File;
  jenis_kelamin: string;
  kota: string;
  tanggal_lahir: string;
};

async function submitCareerApplication(formData: UserCareerFormData) {
  const data = new FormData();
  data.append('tanggal', formData.tanggal);
  data.append('nama', formData.nama);
  data.append('no_hp', formData.no_hp);
  data.append('email', formData.email);
  data.append('alamat', formData.alamat);
  data.append('cv', formData.cv);
  data.append('jenis_kelamin', formData.jenis_kelamin);
  data.append('kota', formData.kota);
  data.append('tanggal_lahir', formData.tanggal_lahir);

  const response = await apiClient.post('/user-career', data);
  return response.data;
}

type DashboardCounts = {
  totalUserCareer: number;
  totalBrand: number;
  totalBerita: number;
  totalOutlet: number;
};

async function fetchDashboardCounts() {
  const response = await apiClient.get<DashboardCounts>(
    `/dashboard`,
  );

  return response.data;
}

function Career() {

  const { data: dashboardCounts } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboardCounts()
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: fetchProvinces,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const [selectedProvince, setSelectedProvince] = useState('');
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('');

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedProvince],
    queryFn: () => fetchRegenciesByProvince(selectedProvince),
    enabled: !!selectedProvince,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CareerFormData>({
    resolver: zodResolver(careerFormSchema),
    mode: 'onBlur',
    defaultValues: {
      kota: ''
    }
  });

  const cvFile = watch('cv');

  const [dialogState, setDialogState] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchBrands()
  });

  const brands = brandsData?.data ?? [];

  const brandLogos = brands.map(brand => ({
    src: `${API_BASE_URL}${brand.logo}`,
    alt: brand.nama
  }));

  const careerMutation = useMutation({
    mutationFn: submitCareerApplication,
    onSuccess: () => {
      setDialogState({
        open: true,
        type: 'success',
        title: 'Lamaran Berhasil Dikirim!',
        message: 'Terima kasih telah melamar. Kami akan menghubungi Anda segera jika profil Anda sesuai dengan kebutuhan kami.'
      });
      reset();
      setSelectedDate(undefined);
      setSelectedProvince('');
      setProvinceSearchQuery('');
      setCitySearchQuery('');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage = error?.message || 'Terjadi kesalahan saat mengirim lamaran';
      setDialogState({
        open: true,
        type: 'error',
        title: 'Gagal Mengirim Lamaran',
        message: errorMessage
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('cv', file, { shouldValidate: true });
    }
  };

  const onSubmit = (data: CareerFormData) => {
    const today = new Date().toISOString().split('T')[0];

    careerMutation.mutate({
      tanggal: today,
      nama: data.name,
      no_hp: data.whatsapp,
      email: data.email,
      alamat: data.address,
      cv: data.cv,
      jenis_kelamin: data.jenis_kelamin,
      kota: data.kota,
      tanggal_lahir: data.tanggal_lahir
    });
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('form');
    if (formElement) {
      const offset = 80; // Offset in pixels to prevent form from being hidden behind headers
      const elementPosition = formElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-[#F9F9F9] py-16 md:py-24 m-2 md:m-0 rounded-md md:rounded-none">
        <div className="absolute inset-0 z-0 pointer-events-none bg-[url('/images/dots.png')] bg-center bg-cover bg-no-repeat opacity-20"></div>
        <div className="container mx-auto max-w-6xl relative px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="bg-white rounded-lg py-2 px-3 sm:px-4 shadow-sm flex items-center space-x-3">
                  <img src={brandIcon} alt="Brand" className="w-5 h-5" />
                  <span className="font-semibold text-xs sm:text-sm text-[#6E0112] font-jakarta">
                    {dashboardCounts?.totalBrand} Brand Besar
                  </span>
                </div>
                <div className="bg-white rounded-lg py-2 px-3 sm:px-4 shadow-sm flex items-center space-x-3">
                  <img src={outletIcon} alt="Outlet" className="w-5 h-5" />
                  <span className="font-semibold text-xs sm:text-sm text-[#6E0112] font-jakarta">{dashboardCounts?.totalOutlet} Outlet</span>
                </div>
                <div className="bg-white rounded-lg py-2 px-3 sm:px-4 shadow-sm flex items-center space-x-3">
                  <img src={cityIcon} alt="City" className="w-4 h-5" />
                  <span className="font-semibold text-xs sm:text-sm text-[#6E0112] font-jakarta ">12 kota besar Indonesia</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="">
                  <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl sm:text-4xl lg:text-5xl font-runestars text-white whitespace-normal md:whitespace-nowrap">
                    Bergabunglah dengan Keluarga
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl sm:text-4xl lg:text-5xl font-runestars text-white whitespace-normal md:whitespace-nowrap">
                    Besar
                  </span>
                  <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-bold text-3xl sm:text-4xl lg:text-5xl text-[#FFB835] font-runestars whitespace-normal md:whitespace-nowrap">
                    Enggal Group Indonesia
                  </span>
                </div>
                <p className="text-base/relaxed text-[#585858] max-w-lg font-jakarta">
                  Jadilah bagian dari komunitas yang tumbuh bersama, menciptakan pengalaman kuliner terbaik untuk semua.
                </p>
              </div>

              <button
                onClick={scrollToForm}
                className="bg-black hover:bg-[#333] text-white font-semibold px-8 py-3 rounded-xl transition-colors w-3/4 sm:w-auto"
              >
                Lamar Di sini!
              </button>
            </div>

            <div className="flex justify-center mt-8 lg:mt-0">
              <img src={heroIllustration} alt="Career Illustration" className="max-w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <div className="w-full py-9">
        <LogoCarousel brands={brandLogos} isLoading={brandsLoading} />
      </div>

      {/* Why Join Us Section */}
      <section className=" py-16">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start px-4">
          <div className="mb-12 max-w-[400px]">
            <div className="flex items-start justify-start mb-4">
              <img src={vectorLine} alt="Decorative line" className="w-16 h-5" />
            </div>
            <h2 className="font-runestars mb-6">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-2xl sm:text-3xl md:text-4xl text-white whitespace-normal md:whitespace-nowrap">
                Mengapa bergabung bersama kami?
              </span>
            </h2>
            <p className="text-base/relaxed text-[#585858] font-jakarta font-normal">
              Kami tumbuh bersama dalam satu keluarga besar yang saling mendukung.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <img src={comfortIcon} alt="Comfort" className="w-8 h-8" />
              </div>
              <p className="font-normal text-[#303030] font-jakarta">Lingkungan kerja yang nyaman & suportif.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <img src={trainingIcon} alt="Training" className="w-8 h-8" />
              </div>
              <p className="font-normal text-[#303030] font-jakarta">Program training & pengembangan diri.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <img src={careerIcon} alt="Career" className="w-8 h-8" />
              </div>
              <p className="font-normal text-[#303030] font-jakarta">Jenjang karir untuk tumbuh bersama grup.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <img src={multibrandIcon} alt="Multi-brand" className="w-8 h-8" />
              </div>
              <p className="font-normal text-[#303030] font-jakarta">Kesempatan karir multi-brand</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-8 lg:py-16" id="form">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-[#FFB835] rounded-lg p-6 text-white relative overflow-hidden h-fit flex flex-col">
              <div className="absolute inset-0 z-0 pointer-events-none bg-[url('/images/dots.png')] bg-center bg-cover bg-no-repeat opacity-20"></div>
              <div className="relative z-10 space-y-6 max-w-[450px] w-full mx-auto flex-1 flex flex-col justify-start">
                <div className='bg-white h-48 sm:h-64 md:h-80 lg:h-[380px] mx-auto rounded-md flex items-center justify-center overflow-hidden w-full'>
                  <img src={careerGroup} alt="Career Group" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-runestars">
                    <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-2xl sm:text-3xl md:text-4xl text-white whitespace-normal md:whitespace-nowrap">
                      Yuk, Daftar Sekarang!
                    </span>
                  </h3>
                  <p className="font-jakarta font-medium text-black">
                    Silakan isi data kamu di form ini, kami akan hubungi kamu jika kita cocok!
                  </p>
                </div>
                <div className="bg-[#9C0000] rounded-lg p-4 w-full">
                  <h4 className="text-2xl md:text-3xl text-[#FFB835] font-runestars mb-2">Visi</h4>
                  <p className="font-jakarta text-white font-semibold font-normal/relaxed">
                    Menjadi F&B group terkemuka di Indonesia yang nyaman untuk semua kalangan.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Application Form */}
            <div className="h-full flex flex-col">
              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col justify-between">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nama*</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Masukan nama kamu di sini"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 ${errors.name ? 'border-red-500' : 'border-gray-200'
                      }`}
                    disabled={careerMutation.isPending || isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* WhatsApp Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nomor Whatsapp*</label>
                  <input
                    type="tel"
                    {...register('whatsapp')}
                    placeholder="Masukan nomor WA Kamu di sini"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 ${errors.whatsapp ? 'border-red-500' : 'border-gray-200'
                      }`}
                    disabled={careerMutation.isPending || isSubmitting}
                  />
                  {errors.whatsapp && (
                    <p className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email*</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="Masukan Email"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 ${errors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                    disabled={careerMutation.isPending || isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Address Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Alamat Rumah*</label>
                  <textarea
                    {...register('address')}
                    placeholder="Masukan Alamat Lengkap"
                    rows={3}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none disabled:opacity-50 ${errors.address ? 'border-red-500' : 'border-gray-200'
                      }`}
                    disabled={careerMutation.isPending || isSubmitting}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                  )}
                </div>

                {/* Gender Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Jenis Kelamin*</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register('jenis_kelamin')}
                        value="LAKI_LAKI"
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        disabled={careerMutation.isPending || isSubmitting}
                      />
                      <span className="text-sm text-gray-700">Laki-laki</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register('jenis_kelamin')}
                        value="PEREMPUAN"
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        disabled={careerMutation.isPending || isSubmitting}
                      />
                      <span className="text-sm text-gray-700">Perempuan</span>
                    </label>
                  </div>
                  {errors.jenis_kelamin && (
                    <p className="text-red-500 text-xs mt-1">{errors.jenis_kelamin.message}</p>
                  )}
                </div>

                {/* Province Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Provinsi*</label>
                  <Select
                    value={selectedProvince}
                    onValueChange={(value) => {
                      setSelectedProvince(value);
                      setValue('kota', '');
                      setCitySearchQuery('');
                      setProvinceSearchQuery('');
                    }}
                    disabled={careerMutation.isPending || isSubmitting}
                    onOpenChange={(open) => {
                      if (!open) {
                        setProvinceSearchQuery('');
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-200">
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Cari provinsi..."
                          value={provinceSearchQuery}
                          onChange={(e) => setProvinceSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      {provinces
                        .filter(province =>
                          province.name.toLowerCase().includes(provinceSearchQuery.toLowerCase())
                        )
                        .map((province) => (
                          <SelectItem key={province.id} value={province.id}>
                            {province.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Kota/Kabupaten*</label>
                  <Select
                    value={watch('kota')}
                    onValueChange={(value) => {
                      setValue('kota', value);
                      setCitySearchQuery('');
                    }}
                    disabled={careerMutation.isPending || isSubmitting || !selectedProvince}
                    onOpenChange={(open) => {
                      if (!open) {
                        setCitySearchQuery('');
                      }
                    }}
                  >
                    <SelectTrigger
                      className={`w-full ${errors.kota ? 'border-red-500' : 'border-gray-200'
                        }`}
                    >
                      <SelectValue placeholder={!selectedProvince ? "Pilih provinsi terlebih dahulu" : "Pilih kota/kabupaten"} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Cari kota/kabupaten..."
                          value={citySearchQuery}
                          onChange={(e) => setCitySearchQuery(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      {cities
                        .filter(city =>
                          city.name.toLowerCase().includes(citySearchQuery.toLowerCase())
                        )
                        .map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.kota && (
                    <p className="text-red-500 text-xs mt-1">{errors.kota.message}</p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tanggal Lahir*</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!selectedDate ? 'text-gray-400' : ''
                          } ${errors.tanggal_lahir ? 'border-red-500' : 'border-gray-200'}`}
                        disabled={careerMutation.isPending || isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'dd-MM-yyyy') : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout='dropdown'
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            setValue('tanggal_lahir', date.toISOString().split('T')[0]);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.tanggal_lahir && (
                    <p className="text-red-500 text-xs mt-1">{errors.tanggal_lahir.message}</p>
                  )}
                </div>

                {/* CV Upload Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Upload CV*</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={careerMutation.isPending || isSubmitting}
                    />
                    <div className={`w-full px-4 py-6 bg-gray-50 border-2 border-dashed rounded-lg text-center hover:border-orange-500 transition-colors ${errors.cv ? 'border-red-500' : 'border-gray-300'
                      }`}>
                      <div className="flex flex-col items-center space-y-2">
                        <img src={uploadIcon} alt="Upload" className="w-8 h-9" />
                        <div className="text-sm text-gray-600">
                          {cvFile ? (
                            <span className="text-orange-500 font-medium">{cvFile.name}</span>
                          ) : (
                            <>
                              <span> Pilih file atau drop CV kamu di sini!</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">PDF (Max. 5MB)</p>
                      </div>
                    </div>
                  </div>
                  {errors.cv && (
                    <p className="text-red-500 text-xs mt-1">{errors.cv.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={careerMutation.isPending || isSubmitting}
                  className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-base/relaxed py-3 rounded-lg transition-colors mt-auto"
                >
                  {careerMutation.isPending || isSubmitting ? 'Mengirim...' : 'Submit'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Success/Error Dialog */}
      <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState({ ...dialogState, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-bold">
              {dialogState.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              {dialogState.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <button
              type="button"
              onClick={() => setDialogState({ ...dialogState, open: false })}
              className="px-6 py-2 rounded-lg font-medium transition-colors bg-black hover:bg-gray-800 text-white"
            >
              Tutup
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Career;
