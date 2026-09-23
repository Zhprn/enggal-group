import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "../lib/api-client";
import ImageCarousel from "../components/ImageCarousel";

type Brand = {
  id: string;
  nama: string;
  logo: string;
  coverImage?: string;
  title?: string;
  description: string;
  content?: string;
  instagramLink?: string;
  facebookLink?: string;
  twitterLink?: string;
  menuLink?: string;
};

type Outlet = {
  id: string;
  nama: string;
  brandId: string;
  jamOperasional: string;
  lokasi: string;
  image: string;
  googleMapsLink: string;
  whatsappUrl?: string;
};

type Gallery = {
  id: string;
  brandId: string;
  image: string;
  caption: string;
  instagramUrl?: string;
};

async function fetchBrand(id: string) {
  const response = await apiClient.get<Brand>(`/brand/${id}`);
  return response.data;
}

async function fetchOutlets(brandId: string) {
  const response = await apiClient.get<Outlet[]>(`/outlet?brandId=${brandId}&page=1&limit=100`);
  return response.data || [];
}

async function fetchGalleries(brandId: string) {
  const response = await apiClient.get<Gallery[]>(`/gallery?brandId=${brandId}&page=1&limit=100`);
  return response.data || [];
}

function BrandDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: ["brand", id],
    queryFn: () => fetchBrand(id!),
    enabled: !!id,
  });

  const { data: outlets } = useQuery({
    queryKey: ["outlets", id],
    queryFn: () => fetchOutlets(id!),
    enabled: !!id,
  });

  const { data: galleries } = useQuery({
    queryKey: ["galleries", id],
    queryFn: () => fetchGalleries(id!),
    enabled: !!id,
  });

  if (!id) {
    return <div>Brand not found</div>;
  }

  if (brandLoading) {
    return (
      <div className="font-jakarta min-h-screen relative">
        <div className="absolute inset-0 top-0 h-[500px] bg-[url('/images/dots_berita.png')] bg-center bg-cover bg-repeat"></div>
        <div className="py-10 relative z-10">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-3 mb-10 container mx-auto px-4 md:px-10">
            <div className="h-6 w-16 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-300 rounded animate-pulse"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 container mx-auto px-4 md:px-10">
            {/* Left Card Skeleton */}
            <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-12 shadow-sm">
              <div className="w-[200px] h-[80px] bg-gray-300 rounded animate-pulse mb-6"></div>
              <div className="h-8 w-48 bg-gray-300 rounded animate-pulse mb-4"></div>
              <div className="space-y-3 mb-8">
                <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Right Image Skeleton */}
            <div className="bg-gray-300 rounded-2xl h-[300px] lg:h-auto animate-pulse"></div>
          </div>

          {/* Loading Text */}
          <div className="mt-16 text-center">
            <p className="text-white text-lg font-medium">Memuat data brand...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return <div>Brand not found</div>;
  }

  const galleryImages = galleries?.map((gallery) => ({
    src: `${API_BASE_URL}${gallery.image}`,
    alt: gallery.caption || brand.nama,
    instagramUrl: gallery.instagramUrl,
  })) || [];

  return (
    <div className="font-jakarta min-h-screen relative">
      <div className="absolute inset-0 top-0 h-[500px] bg-[url('/images/dots_berita.png')] bg-center bg-cover bg-repeat"></div>
      <div className=" py-10 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-10 container mx-auto px-4 md:px-10">
          <a href="/" className="text-[#727272] text-sm md:text-base hover:text-[#9C0000]">
            Home
          </a>
          <span className="text-[#727272]">
            <svg
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.07692 0L0 1.16667L5.69231 7L0 12.8333L1.07692 14L8 7L1.07692 0Z"
                fill="#727272"
              />
            </svg>
          </span>
          <p className="rounded-sm bg-[#9C0000] px-4 py-2 font-medium text-white text-sm md:text-base">
            {brand.nama}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 container mx-auto px-4 md:px-10">
          {/* Left Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-12 shadow-sm flex flex-col justify-between">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-[150px] sm:w-[180px] md:w-[200px] mb-6">
                <img src={`${API_BASE_URL}${brand.logo}`} alt={`${brand.nama} Logo`} className="w-full h-auto" />
              </div>


              <h1 className="text-[#C00000] font-bold text-lg sm:text-xl md:text-2xl">
                {brand.nama}
              </h1>

              {/* Description */}
              <p className="text-gray-700 text-sm sm:text-base md:text-lg mb-8 md:mb-12">
                {brand.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {brand.menuLink && (
                <a
                  href={brand.menuLink.startsWith('http') ? brand.menuLink : `https://${brand.menuLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#C00000] font-medium text-base md:text-lg hover:underline"
                >
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.235636 0.816122C0.253638 0.590415 0.355301 0.380551 0.519484 0.230175C0.683666 0.079799 0.897731 0.00048548 1.11716 0.00872934C1.33659 0.0169732 1.54449 0.11214 1.69763 0.274438C1.85077 0.436735 1.93736 0.653672 1.93939 0.880132V5.37481C1.93939 5.54059 2.00325 5.69959 2.11691 5.81681C2.23056 5.93404 2.38472 5.9999 2.54545 5.9999C2.70619 5.9999 2.86035 5.93404 2.974 5.81681C3.08766 5.69959 3.15152 5.54059 3.15152 5.37481V0.750113C3.15152 0.55117 3.22814 0.360376 3.36453 0.219703C3.50092 0.0790294 3.6859 0 3.87879 0C4.07167 0 4.25666 0.0790294 4.39305 0.219703C4.52944 0.360376 4.60606 0.55117 4.60606 0.750113V5.37481C4.60606 5.54059 4.66991 5.69959 4.78357 5.81681C4.89723 5.93404 5.05138 5.9999 5.21212 5.9999C5.37286 5.9999 5.52701 5.93404 5.64067 5.81681C5.75433 5.69959 5.81818 5.54059 5.81818 5.37481V0.880132C5.82021 0.653672 5.9068 0.436735 6.05994 0.274438C6.21308 0.11214 6.42099 0.0169732 6.64042 0.00872934C6.85984 0.00048548 7.07391 0.079799 7.23809 0.230175C7.40227 0.380551 7.50394 0.590415 7.52194 0.816122C7.56364 1.42821 7.75758 4.37066 7.75758 6.0009C7.75758 7.3511 7.10788 8.54528 6.11685 9.26839C5.90739 9.42141 5.85697 9.58344 5.86182 9.66545C5.98109 11.5437 6.30303 16.6845 6.30303 17.4996C6.30303 18.1628 6.04762 18.7987 5.59299 19.2677C5.13835 19.7366 4.52174 20 3.87879 20C3.23584 20 2.61922 19.7366 2.16459 19.2677C1.70996 18.7987 1.45455 18.1628 1.45455 17.4996C1.45455 16.6835 1.77648 11.5437 1.89576 9.66545C1.90061 9.58344 1.85018 9.42141 1.64073 9.26839C1.13368 8.89893 0.720021 8.40934 0.434515 7.84075C0.149009 7.27217 -3.63419e-06 6.64121 0 6.0009C0 4.37066 0.193939 1.42821 0.235636 0.816122ZM9.21212 5.75086C9.21212 4.22564 9.79957 2.76288 10.8452 1.68439C11.8909 0.605893 13.3091 0 14.7879 0C14.9808 0 15.1657 0.0790294 15.3021 0.219703C15.4385 0.360376 15.5152 0.55117 15.5152 0.750113V9.25139C15.5152 9.56944 15.6179 11.1467 15.7333 12.8939L15.7382 12.9769C15.8642 14.8852 16 16.9605 16 17.4996C16 18.1628 15.7446 18.7987 15.29 19.2677C14.8353 19.7366 14.2187 20 13.5758 20C12.9328 20 12.3162 19.7366 11.8616 19.2677C11.4069 18.7987 11.1515 18.1628 11.1515 17.4996C11.1515 16.9855 11.2756 14.8882 11.3959 12.9649C11.456 11.9938 11.5171 11.0527 11.5627 10.3546L11.585 10.0015H10.9091C10.6862 10.0015 10.4656 9.95623 10.2597 9.86827C10.0538 9.78031 9.86673 9.65139 9.70915 9.48886C9.55157 9.32633 9.42658 9.13339 9.3413 8.92103C9.25602 8.70868 9.21212 8.48109 9.21212 8.25124V5.75086Z" fill="#9C0000" />
                  </svg>
                  Cek Menu
                </a>
              )}

              <div className="flex items-center gap-3 sm:gap-4">
                {brand.facebookLink && (
                  <a href={brand.facebookLink.startsWith('http') ? brand.facebookLink : `https://${brand.facebookLink}`} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-[#C00000] transition-colors">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                )}
                {brand.instagramLink && (
                  <a href={brand.instagramLink.startsWith('http') ? brand.instagramLink : `https://${brand.instagramLink}`} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-[#C00000] transition-colors">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                    </svg>
                  </a>
                )}
                {brand.twitterLink && (
                  <a href={brand.twitterLink.startsWith('http') ? brand.twitterLink : `https://${brand.twitterLink}`} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-[#C00000] transition-colors">
                    <svg className="h-5 w-5 md:h-6 md:w-6" id="icons" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path d="M412.19,118.66a109.27,109.27,0,0,1-9.45-5.5,132.87,132.87,0,0,1-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14,23.9,350,16,350.13,16H267.69V334.78c0,4.28,0,8.51-.18,12.69,0,.52-.05,1-.08,1.56,0,.23,0,.47-.05.71,0,.06,0,.12,0,.18a70,70,0,0,1-35.22,55.56,68.8,68.8,0,0,1-34.11,9c-38.41,0-69.54-31.32-69.54-70s31.13-70,69.54-70a68.9,68.9,0,0,1,21.41,3.39l.1-83.94a153.14,153.14,0,0,0-118,34.52,161.79,161.79,0,0,0-35.3,43.53c-3.48,6-16.61,30.11-18.2,69.24-1,22.21,5.67,45.22,8.85,54.73v.2c2,5.6,9.75,24.71,22.38,40.82A167.53,167.53,0,0,0,115,470.66v-.2l.2.2C155.11,497.78,199.36,496,199.36,496c7.66-.31,33.32,0,62.46-13.81,32.32-15.31,50.72-38.12,50.72-38.12a158.46,158.46,0,0,0,27.64-45.93c7.46-19.61,9.95-43.13,9.95-52.53V176.49c1,.6,14.32,9.41,14.32,9.41s19.19,12.3,49.13,20.31c21.48,5.7,50.42,6.9,50.42,6.9V131.27C453.86,132.37,433.27,129.17,412.19,118.66Z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-[300px] lg:h-auto">
            <img
              src={brand.coverImage ? `${API_BASE_URL}${brand.coverImage}` : "/images/brand_image.jpg"}
              alt={brand.nama}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Brand Story Section */}
        {brand.content && (
          <div className="mt-16 container mx-auto px-4 md:px-10">
            {/* Decorative M */}
            <div className="mb-6">
              <svg
                width="67"
                height="19"
                viewBox="0 0 67 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 16.0267C11 9.36005 28.5 -2.17329 26.5 5.02671C24.5 12.2267 21 15.36 19.5 16.0267C27.3333 9.6934 42.7 -1.37323 41.5 5.02671C40.3 11.4267 37.6667 15.0267 36.5 16.0267C45.8333 8.69338 63.6 -3.77329 60 5.02671C56.4 13.8267 61.5 16.0267 64.5 16.0267"
                  stroke="#FFB835"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Main Heading */}
            <h2 className="font-runestars mb-8">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-2xl md:text-4xl text-white leading-tight">
                {brand.title?.toUpperCase() || brand.nama?.toUpperCase() || 'BRAND STORY'}
              </span>
            </h2>

            {/* Body Text */}
            <div
              className="space-y-6 text-[#1E1E1E] font-jakarta text-base md:text-lg leading-relaxed prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: brand.content }}
            />
          </div>
        )}

        {/* Galeri Section */}
        {galleryImages.length > 0 && (
          <>
            <div className="mt-16  container mx-auto px-4 md:px-10">
              {/* Decorative M */}
              <div className="mb-6">
                <svg
                  width="67"
                  height="19"
                  viewBox="0 0 67 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 16.0267C11 9.36005 28.5 -2.17329 26.5 5.02671C24.5 12.2267 21 15.36 19.5 16.0267C27.3333 9.6934 42.7 -1.37323 41.5 5.02671C40.3 11.4267 37.6667 15.0267 36.5 16.0267C45.8333 8.69338 63.6 -3.77329 60 5.02671C56.4 13.8267 61.5 16.0267 64.5 16.0267"
                    stroke="#FFB835"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Main Heading */}
              <h2 className="font-runestars mb-8">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-2xl md:text-4xl text-white leading-tight">
                  GALERI KAMI
                </span>
              </h2>
            </div>
            {/* Image Carousel */}
            <div className="w-full py-8 flex flex-col gap-y-6">
              <ImageCarousel direction="left" images={galleryImages} />
              <ImageCarousel direction="right" images={galleryImages} />
            </div>
          </>
        )}

        {/* Outlet Section */}
        {outlets && outlets.length > 0 && (
          <div className="mt-20 mb-16 container mx-auto px-4 md:px-10">
            {/* Decorative M */}
            <div className="mb-6">
              <svg
                width="67"
                height="19"
                viewBox="0 0 67 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 16.0267C11 9.36005 28.5 -2.17329 26.5 5.02671C24.5 12.2267 21 15.36 19.5 16.0267C27.3333 9.6934 42.7 -1.37323 41.5 5.02671C40.3 11.4267 37.6667 15.0267 36.5 16.0267C45.8333 8.69338 63.6 -3.77329 60 5.02671C56.4 13.8267 61.5 16.0267 64.5 16.0267"
                  stroke="#FFB835"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Outlet Heading */}
            <h2 className="font-runestars mb-12">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-2xl md:text-4xl text-white">
                OUTLET {brand.nama?.toUpperCase() || 'BRAND'}
              </span>
            </h2>

            {/* Outlet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {outlets.map((outlet) => (
                <div key={outlet.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="mb-6">
                    <img
                      src={`${API_BASE_URL}${outlet.image}`}
                      alt={outlet.nama}
                      className="w-1/3 h-48 object-cover rounded-xl"
                    />
                  </div>

                  <h3 className="font-runestars text-2xl md:text-3xl mb-4">
                    {outlet.nama?.toUpperCase() || 'OUTLET'}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0 mt-1"
                      >
                        <path
                          d="M10 0C6.13 0 3 3.13 3 7C3 12.25 10 20 10 20C10 20 17 12.25 17 7C17 3.13 13.87 0 10 0ZM10 9.5C8.62 9.5 7.5 8.38 7.5 7C7.5 5.62 8.62 4.5 10 4.5C11.38 4.5 12.5 5.62 12.5 7C12.5 8.38 11.38 9.5 10 9.5Z"
                          fill="#FFB835"
                        />
                      </svg>
                      <p className="text-[#303030] text-sm md:text-base">
                        {outlet.lokasi}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM10.5 5H9V11L14.2 14.2L15 12.9L10.5 10.2V5Z"
                          fill="#FFB835"
                        />
                      </svg>
                      <p className="text-[#303030] text-sm md:text-base">
                        {outlet.jamOperasional}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {outlet.whatsappUrl && (
                      <a
                        href={outlet.whatsappUrl.startsWith('http') ? outlet.whatsappUrl : `https://${outlet.whatsappUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#9C0000] hover:bg-[#7A0000] text-white px-6 py-3 rounded-md font-medium transition-colors"
                      >
                        Reservasi Di sini
                      </a>
                    )}
                    {outlet.googleMapsLink && (
                      <a
                        href={outlet.googleMapsLink.startsWith('http') ? outlet.googleMapsLink : `https://${outlet.googleMapsLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#9C0000] underline hover:text-[#7A0000] font-medium transition-colors py-3"
                      >
                        Lihat di Maps
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z"
                            fill="currentColor"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrandDetail;
