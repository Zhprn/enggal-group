import { useEffect, useState } from "react";
import PromoCard from "../components/PromoCard";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "../lib/api-client";

type Brand = {
  id: string;
  nama: string;
  logo: string;
  description: string;
};

type BrandListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type Promo = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  syaratKetentuan: string;
  berlakuHingga: string;
  brandId: string;
  image: string;
  banner?: string;
  showBanner: boolean;
  brand: {
    id: string;
    nama: string;
  };
};

type PromoListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

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

async function fetchPromos(brandId?: string) {
  const url = brandId && brandId !== "all"
    ? `/promo?page=1&limit=100&brandId=${brandId}`
    : `/promo?page=1&limit=100`;

  const response = await apiClient.get<Promo[], PromoListMeta>(url);

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



function Promo() {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchBrands()
  });

  const { data: promosData, isLoading: promosLoading } = useQuery({
    queryKey: ["promos", selectedBrand],
    queryFn: () => fetchPromos(selectedBrand)
  });

  // Static banner images
  const banners = [
    "/images/banner.webp",
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % banners.length);
    }, 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  // Build brand dropdown options
  const brands = [
    { id: "all", name: "Semua Brand" },
    ...(brandsData?.data?.map((brand) => ({
      id: brand.id,
      name: brand.nama,
    })) || []),
  ];

  // Get promo items from API
  const promoItems = promosData?.data || [];

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="h-full relative">
      <div className="w-full">
        {/* Banner Carousel */}
        <div className="relative w-full overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{
              width: `${banners.length * 100}%`,
              transform: `translateX(-${(currentSlide * 100) / banners.length}%)`,
            }}
          >
            {banners.map((src, idx) => (
              <div
                key={idx}
                className="shrink-0"
                style={{ width: `${100 / banners.length}%` }}
              >
                <img src={src} alt={`Banner ${idx + 1}`} className="block w-full h-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className=" py-12 relative px-4">
        <div className="hidden md:block absolute w-[350px] h-[350px] rounded-full bg-[url('/images/dots_spaced.png')] bg-center bg-cover bg-no-repeat z-0 pointer-events-none left-0 -translate-x-1/4"></div>
        <div className="hidden md:block absolute z-0 pointer-events-none right-0 top-0">
          <svg
            width="207"
            height="250"
            viewBox="0 0 207 250"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M308.712 186.16C274.529 174.346 218.589 161.37 173.444 165.881M173.444 165.881C141.006 169.123 114.141 181.394 104.925 209.611C82.0039 279.791 181.123 234.923 173.444 165.881ZM173.444 165.881C171.893 151.931 165.981 136.994 153.821 121.819C95.95 49.5997 30.1061 16.1903 5.17394 5.17155"
              stroke="#E0E0E0"
              stroke-width="10"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-10 relative z-10 ">
            <div className="mb-4">
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
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div className="relative max-w-[450px]">
              <h2 className="font-runestars mb-6 relative">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl md:text-4xl text-white ">
                  Promo Eksklusif dari Setiap Brand
                </span>
                <div className="hidden md:block absolute -top-4 -right-4 w-[39.95px] h-[39.95px] rotate-[30deg]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M16.2528 1.51297C17.6991 -0.0545821 20.2667 1.42783 19.6323 3.46408L17.6786 9.7346C17.4488 10.472 17.6642 11.2758 18.2319 11.7995L23.0591 16.2531C24.6266 17.6993 23.1442 20.2669 21.108 19.6325L14.8374 17.6788C14.1 17.4491 13.2963 17.6644 12.7726 18.2321L8.31897 23.0593C6.87274 24.6269 4.30511 23.1444 4.93954 21.1082L6.89324 14.8377C7.12298 14.1003 6.90761 13.2965 6.33995 12.7728L1.51274 8.31919C-0.0548091 6.87297 1.4276 4.30534 3.46385 4.93977L9.73438 6.89346C10.4718 7.12321 11.2755 6.90784 11.7993 6.34018L16.2528 1.51297Z"
                      fill="#FFB835"
                    />
                  </svg>
                </div>
              </h2>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center w-full gap-6 md:gap-10">
              <p className="font-jakarta text-base/[24px] font-medium md:max-w-[450px]">
                Temukan penawaran spesial yang bisa kamu pilih sesuai dengan
                brand favoritmu.
              </p>
              {/* Brand Filter Dropdown */}
              <div className="relative w-full md:w-auto">
                <div
                  className="inline-flex w-full md:w-auto items-center justify-between bg-white border border-gray-300 rounded-md px-4 py-2 gap-2 cursor-pointer hover:bg-gray-50 z-50"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <svg
                    width="16"
                    height="19"
                    viewBox="0 0 16 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.0011 9.02539V16.9054C10.0411 17.2054 9.94111 17.5254 9.71111 17.7354C9.61859 17.8281 9.50871 17.9016 9.38773 17.9518C9.26676 18.002 9.13708 18.0278 9.00611 18.0278C8.87514 18.0278 8.74546 18.002 8.62448 17.9518C8.50351 17.9016 8.39362 17.8281 8.30111 17.7354L6.29111 15.7254C6.18211 15.6187 6.09922 15.4883 6.04892 15.3443C5.99861 15.2004 5.98225 15.0467 6.00111 14.8954V9.02539H5.97111L0.211108 1.64539C0.0487158 1.43692 -0.0245586 1.17265 0.00729555 0.910321C0.0391497 0.647992 0.173543 0.408937 0.381108 0.245391C0.571108 0.105391 0.781108 0.0253906 1.00111 0.0253906H15.0011C15.2211 0.0253906 15.4311 0.105391 15.6211 0.245391C15.8287 0.408937 15.9631 0.647992 15.9949 0.910321C16.0268 1.17265 15.9535 1.43692 15.7911 1.64539L10.0311 9.02539H10.0011Z"
                      fill="#9C0000"
                    />
                  </svg>
                  <span className="flex-1 text-left truncate text-sm font-jakarta">
                    {brands.find((brand) => brand.id === selectedBrand)?.name ||
                      "Pilih Brand"}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`ml-2 shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-full md:w-56 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200 max-h-72 overflow-auto">
                    {brands.map((brand) => (
                      <div
                        key={brand.id}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selectedBrand === brand.id
                          ? "bg-gray-50 font-medium text-[#9C0000]"
                          : ""
                          }`}
                        onClick={() => handleBrandSelect(brand.id)}
                      >
                        {brand.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-x-20 lg:gap-y-16 relative">
            {promosLoading ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-10 text-center">
                <p className="text-gray-500 font-medium">
                  Memuat promo...
                </p>
              </div>
            ) : promoItems.length > 0 ? (
              promoItems.map((promo) => (
                <div
                  key={promo.id}
                  className="cursor-pointer"
                  onClick={() => (window.location.href = `/promo/${promo.id}`)}
                >
                  <PromoCard
                    id={promo.id}
                    title={promo.title}
                    description={promo.subtitle}
                    validUntil={formatDate(promo.berlakuHingga)}
                    image={`${API_BASE_URL}${promo.image}`}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-10 text-center">
                <p className="text-gray-500 font-medium">
                  Tidak ada promo tersedia untuk brand ini saat ini.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="absolute -z-10 pointer-events-none left-0 bottom-0 hidden lg:block ">
          <svg
            width="237"
            height="200"
            viewBox="0 0 237 251"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-72.0004 64.2172C-37.8172 76.0314 18.1226 89.0074 63.2676 84.496M63.2676 84.496C95.7062 81.2543 122.571 68.9839 131.787 40.7662C154.708 -29.414 55.5891 15.4544 63.2676 84.496ZM63.2676 84.496C64.8191 98.4463 70.7308 113.384 82.8905 128.558C140.762 200.778 206.606 234.187 231.538 245.206"
              stroke="#E0E0E0"
              stroke-width="10"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Promo;
