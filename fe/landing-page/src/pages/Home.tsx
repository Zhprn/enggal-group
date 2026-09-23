import { useEffect, useMemo, useRef, useState } from "react";
import vectorLine from "../assets/images/vector_line.svg";
import placeholderImage from "../assets/images/placeholder.svg";
import TeamCard from "../components/TeamCard";
import InteractiveMap from "../components/InteractiveMap";
import { motion, useInView, useMotionValue, useMotionValueEvent } from "motion/react";
import { animate } from "motion";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "../lib/api-client";

type CountUpNumberProps = {
  end: number;
  className?: string;
  duration?: number;
  suffix?: string;
  formatter?: (value: number) => string;
  start?: number;
  once?: boolean;
  amount?: number;
};

function CountUpNumber({
  end,
  className,
  duration = 1.2,
  suffix = "",
  formatter,
  start = 0,
  once = true,
  amount = 0.6,
}: CountUpNumberProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState(start);
  const motionValue = useMotionValue(start);
  const isInView = useInView(spanRef, { once, amount });

  useEffect(() => {
    motionValue.set(start);
    setDisplayValue(start);
  }, [motionValue, start]);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplayValue(latest);
  });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const controls = animate(motionValue, end, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [duration, end, isInView, motionValue]);

  const formattedValue = formatter
    ? formatter(Math.round(displayValue))
    : Math.round(displayValue).toString();

  return (
    <span ref={spanRef} className={className}>
      {formattedValue}
      {suffix}
    </span>
  );
}

type BrandHighlight = {
  id: string;
  name: string;
  logo: string;
  coverImage?: string;
  alt: string;
  description?: string;
  rounded?: boolean;
};

type Brand = {
  id: string;
  nama: string;
  logo: string;
  coverImage?: string;
  description: string;
};

type Outlet = {
  id: string;
  nama: string;
  jamOperasional: string;
  lokasi: string;
  image: string;
  googleMapsLink: string;
  whatsappUrl: string;
  brandId: string;
  brand: {
    id: string;
    nama: string;
  };
};

type BrandListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type OutletListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type Team = {
  id: string;
  nama: string;
  title: string;
  image: string;
  linkedinUrl: string;
  instagramUrl: string;
};

type TeamListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

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

async function fetchOutlets(brandId?: string) {
  const url = brandId && brandId !== "all"
    ? `/outlet?page=1&limit=100&brandId=${brandId}`
    : `/outlet?page=1&limit=100`;

  const response = await apiClient.get<Outlet[], OutletListMeta>(url);

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

async function fetchTeam() {
  const response = await apiClient.get<Team[], TeamListMeta>(
    `/team?page=1&limit=100`,
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

function getImageUrl(path?: string | null, fallback = "/images/placeholder.svg") {
  if (!path) {
    return fallback;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function Home() {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [activeBrand, setActiveBrand] = useState<BrandHighlight | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchBrands()
  });

  const { data: outletsData, isLoading: outletsLoading } = useQuery({
    queryKey: ["outlets", selectedBrand],
    queryFn: () => fetchOutlets(selectedBrand)
  });

  const { data: teamData } = useQuery({
    queryKey: ["team"],
    queryFn: () => fetchTeam()
  });

  const { data: dashboardCounts } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboardCounts()
  });

  const brandHighlights: BrandHighlight[] = useMemo(() =>
    (brandsData?.data?.map((brand) => ({
      id: brand.id,
      name: brand.nama,
      logo: getImageUrl(brand.logo, "/images/placeholder.svg"),
      coverImage: brand.coverImage ? getImageUrl(brand.coverImage, "/images/brand_image.jpg") : undefined,
      alt: brand.nama,
      description: brand.description,
    })).slice(0, 12)) || []
    , [brandsData]);

  useEffect(() => {
    if (brandHighlights.length > 0) {
      brandHighlights.forEach((brand) => {
        if (brand.coverImage && !preloadedImages.has(brand.coverImage)) {
          const img = new Image();
          img.onload = () => {
            setPreloadedImages((prev) => new Set([...prev, brand.coverImage!]));
          };
          img.src = brand.coverImage;
        }
      });
    }
  }, [brandHighlights, preloadedImages]);

  useEffect(() => {
    if (brandHighlights.length > 0 && !activeBrand) {
      setActiveBrand(brandHighlights[0]);
    }
  }, [brandHighlights, activeBrand]);

  const handleSelectBrand = (brand: BrandHighlight) => {
    if (brand.id === activeBrand?.id) return;

    const imageUrl = brand.coverImage || "/images/brand_image.jpg";

    setActiveBrand(brand);

    if (!preloadedImages.has(imageUrl)) {
      setIsImageLoading(true);
      const img = new Image();
      img.onload = () => {
        setPreloadedImages((prev) => new Set([...prev, imageUrl]));
        setIsImageLoading(false);
      };
      img.onerror = () => {
        setIsImageLoading(false);
      };
      img.src = imageUrl;
    }
  };

  const navigateBrand = (direction: "next" | "prev") => {
    if (!activeBrand) return;

    const currentIndex = brandHighlights.findIndex(
      (brand) => brand.id === activeBrand.id,
    );
    if (currentIndex === -1) {
      return;
    }

    const offset = direction === "next" ? 1 : -1;
    const nextIndex =
      (currentIndex + offset + brandHighlights.length) %
      brandHighlights.length;
    handleSelectBrand(brandHighlights[nextIndex]);
  };

  const handlePrevBrand = () => navigateBrand("prev");
  const handleNextBrand = () => navigateBrand("next");
  const brandPlaceholderCount = Math.max(0, 12 - brandHighlights.length);

  const brands = [
    { id: "all", name: "Semua Brand" },
    ...(brandsData?.data?.map((brand) => ({
      id: brand.id,
      name: brand.nama,
    })) || []),
  ];

  const outlets = outletsData?.data || [];
  const teamMembers = teamData?.data || [];

  const ceoData = teamMembers.find(
    (member) => member.title.toLowerCase() === "chief executive officer"
  );

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId);
    setIsDropdownOpen(false);
  };

  return (
    <section className="">
      <div className="flex gap-2 py-10 max-w-9xl container px-4 w-full mx-auto">
        <div className="relative bg-[#A71D28] h-[650px] w-full lg:w-1/2  flex items-start justify-center rounded-md overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none bg-[url('/images/dots.png')] bg-center bg-cover bg-no-repeat opacity-20"></div>
          <div className="absolute top-0 left-0 z-10 hidden md:block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="269"
              height="206"
              viewBox="0 0 269 206"
              fill="none"
            >
              <path
                d="M5 151C53.5 134.833 153.1 116.4 163.5 172C176.5 241.5 67.5 173 134 99.5C187.2 40.7 242.667 13.8333 263.5 5"
                stroke="#FFB835"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col gap-y-4 px-6 pt-16 lg:pt-52 self-stretch">
            <div className="flex flex-col lg:flex-row gap-2 justify-left">
              <div className="px-4 py-2 bg-[#9C0000] text-white rounded-sm font-jakarta text-sm flex items-center">
                <svg
                  width="21"
                  className="w-5 h-5 mr-2"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.9795 0.282544C11.0307 -0.0941813 9.96934 -0.0941813 9.02055 0.282544L6.72105 1.19567L16.7927 5.03119L20.3354 3.69132C20.1897 3.57399 20.0269 3.47867 19.8523 3.40854L11.9795 0.282544ZM21 5.09288L11.2875 8.76799V20C11.5227 19.9534 11.7534 19.8852 11.9795 19.7954L19.8523 16.6694C20.1915 16.5348 20.4819 16.3042 20.6863 16.0071C20.8908 15.71 21 15.3598 21 15.0015V5.09288ZM9.7125 20V8.76799L0 5.09288V15.0025C0.000206869 15.3607 0.10953 15.7106 0.313978 16.0075C0.518427 16.3045 0.8087 16.5349 1.14765 16.6694L9.02055 19.7954C9.24665 19.8845 9.4773 19.952 9.7125 20ZM0.66465 3.69132L10.5 7.4127L14.6128 5.85587L4.5927 2.04092L1.14765 3.40854C0.96845 3.47984 0.80745 3.5741 0.66465 3.69132Z"
                    fill="#FFB835"
                  />
                </svg>
                {dashboardCounts?.totalBrand ?? 8} Brand Besar
              </div>
              <div className="px-4 py-2 bg-[#9C0000] text-white rounded-sm font-jakarta text-sm flex items-center">
                <svg
                  width="19"
                  height="20"
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 19 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.13003 1.65575C0.945774 2.01591 0.855172 2.46211 0.673969 3.35251L0.0652071 6.34385C-0.0210692 6.75171 -0.0217375 7.17259 0.0632433 7.58071C0.148224 7.98883 0.317066 8.37561 0.559432 8.71738C0.801798 9.05914 1.11259 9.3487 1.47278 9.56832C1.83297 9.78795 2.23498 9.93301 2.6542 9.99465C3.07342 10.0563 3.50103 10.0332 3.91085 9.92676C4.32067 9.82034 4.70408 9.63284 5.0376 9.37574C5.37113 9.11864 5.64775 8.79735 5.85054 8.43153C6.05333 8.06572 6.17801 7.66308 6.21696 7.24826L6.28822 6.55795C6.24964 6.99699 6.30467 7.4391 6.4498 7.85605C6.59493 8.273 6.82697 8.65562 7.13108 8.97945C7.43519 9.30328 7.8047 9.5612 8.21598 9.73674C8.62727 9.91229 9.07129 10.0016 9.51969 9.99893C9.96808 9.99627 10.411 9.90172 10.8201 9.72133C11.2292 9.54093 11.5955 9.27864 11.8956 8.95124C12.1957 8.62383 12.4231 8.2385 12.5631 7.81986C12.7031 7.40122 12.7527 6.95848 12.7087 6.51993L12.783 7.24826C12.822 7.66308 12.9467 8.06572 13.1495 8.43153C13.3523 8.79735 13.6289 9.11864 13.9624 9.37574C14.2959 9.63284 14.6793 9.82034 15.0892 9.92676C15.499 10.0332 15.9266 10.0563 16.3458 9.99465C16.765 9.93301 17.167 9.78795 17.5272 9.56832C17.8874 9.3487 18.1982 9.05914 18.4406 8.71738C18.6829 8.37561 18.8518 7.98883 18.9368 7.58071C19.0217 7.17259 19.0211 6.75171 18.9348 6.34385L18.326 3.35251C18.1448 2.46211 18.0542 2.01691 17.87 1.65575C17.678 1.27961 17.4077 0.947363 17.0765 0.680557C16.7454 0.413751 16.3609 0.218354 15.948 0.107048C15.551 1.11809e-07 15.0888 0 14.1645 0H4.83554C3.9112 0 3.44903 1.11809e-07 3.05201 0.107048C2.63908 0.218354 2.25457 0.413751 1.92346 0.680557C1.59235 0.947363 1.32202 1.27961 1.13003 1.65575ZM15.8818 11.5052C16.6772 11.5072 17.4596 11.3069 18.153 10.9239V12.0054C18.153 15.7781 18.153 17.6649 16.9599 18.8365C15.9999 19.7809 14.5696 19.964 12.045 20V16.5074C12.045 15.572 12.045 15.1048 11.8404 14.7566C11.7064 14.5285 11.5136 14.3391 11.2815 14.2074C10.9272 14.0063 10.4518 14.0063 9.5 14.0063C8.54817 14.0063 8.07277 14.0063 7.71851 14.2074C7.48639 14.3391 7.29364 14.5285 7.15963 14.7566C6.95501 15.1048 6.95501 15.572 6.95501 16.5074V20C4.43038 19.964 3.00009 19.7799 2.04012 18.8365C0.847028 17.6649 0.847028 15.7781 0.847028 12.0054V10.9239C1.5407 11.3071 2.32346 11.5073 3.1192 11.5052C4.29563 11.5059 5.42827 11.0667 6.2872 10.2766C7.1624 11.0693 8.30982 11.5081 9.5 11.5052C10.6902 11.5081 11.8376 11.0693 12.7128 10.2766C13.5717 11.0667 14.7054 11.5059 15.8818 11.5052Z"
                    fill="#FFB835"
                  />
                </svg>
                {dashboardCounts?.totalOutlet ?? 25} Outlet
              </div>
              <div className="px-4 py-2 bg-[#9C0000] text-white rounded-sm font-jakarta text-sm flex items-center">
                <svg
                  width="19"
                  height="20"
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 19 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.13003 1.65575C0.945774 2.01591 0.855172 2.46211 0.673969 3.35251L0.0652071 6.34385C-0.0210692 6.75171 -0.0217375 7.17259 0.0632433 7.58071C0.148224 7.98883 0.317066 8.37561 0.559432 8.71738C0.801798 9.05914 1.11259 9.3487 1.47278 9.56832C1.83297 9.78795 2.23498 9.93301 2.6542 9.99465C3.07342 10.0563 3.50103 10.0332 3.91085 9.92676C4.32067 9.82034 4.70408 9.63284 5.0376 9.37574C5.37113 9.11864 5.64775 8.79735 5.85054 8.43153C6.05333 8.06572 6.17801 7.66308 6.21696 7.24826L6.28822 6.55795C6.24964 6.99699 6.30467 7.4391 6.4498 7.85605C6.59493 8.273 6.82697 8.65562 7.13108 8.97945C7.43519 9.30328 7.8047 9.5612 8.21598 9.73674C8.62727 9.91229 9.07129 10.0016 9.51969 9.99893C9.96808 9.99627 10.411 9.90172 10.8201 9.72133C11.2292 9.54093 11.5955 9.27864 11.8956 8.95124C12.1957 8.62383 12.4231 8.2385 12.5631 7.81986C12.7031 7.40122 12.7527 6.95848 12.7087 6.51993L12.783 7.24826C12.822 7.66308 12.9467 8.06572 13.1495 8.43153C13.3523 8.79735 13.6289 9.11864 13.9624 9.37574C14.2959 9.63284 14.6793 9.82034 15.0892 9.92676C15.499 10.0332 15.9266 10.0563 16.3458 9.99465C16.765 9.93301 17.167 9.78795 17.5272 9.56832C17.8874 9.3487 18.1982 9.05914 18.4406 8.71738C18.6829 8.37561 18.8518 7.98883 18.9368 7.58071C19.0217 7.17259 19.0211 6.75171 18.9348 6.34385L18.326 3.35251C18.1448 2.46211 18.0542 2.01691 17.87 1.65575C17.678 1.27961 17.4077 0.947363 17.0765 0.680557C16.7454 0.413751 16.3609 0.218354 15.948 0.107048C15.551 1.11809e-07 15.0888 0 14.1645 0H4.83554C3.9112 0 3.44903 1.11809e-07 3.05201 0.107048C2.63908 0.218354 2.25457 0.413751 1.92346 0.680557C1.59235 0.947363 1.32202 1.27961 1.13003 1.65575ZM15.8818 11.5052C16.6772 11.5072 17.4596 11.3069 18.153 10.9239V12.0054C18.153 15.7781 18.153 17.6649 16.9599 18.8365C15.9999 19.7809 14.5696 19.964 12.045 20V16.5074C12.045 15.572 12.045 15.1048 11.8404 14.7566C11.7064 14.5285 11.5136 14.3391 11.2815 14.2074C10.9272 14.0063 10.4518 14.0063 9.5 14.0063C8.54817 14.0063 8.07277 14.0063 7.71851 14.2074C7.48639 14.3391 7.29364 14.5285 7.15963 14.7566C6.95501 15.1048 6.95501 15.572 6.95501 16.5074V20C4.43038 19.964 3.00009 19.7799 2.04012 18.8365C0.847028 17.6649 0.847028 15.7781 0.847028 12.0054V10.9239C1.5407 11.3071 2.32346 11.5073 3.1192 11.5052C4.29563 11.5059 5.42827 11.0667 6.2872 10.2766C7.1624 11.0693 8.30982 11.5081 9.5 11.5052C10.6902 11.5081 11.8376 11.0693 12.7128 10.2766C13.5717 11.0667 14.7054 11.5059 15.8818 11.5052Z"
                    fill="#FFB835"
                  />
                </svg>
                12 Kota Besar Indonesia
              </div>
            </div>
            <div className="flex flex-col lg:flex-row mt-2 gap-2">
              <h1 className="text-[#FFB835] font-runestars">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-bold text-5xl text-[#FFC04D]">
                  RAGAM KULINER,
                </span>
              </h1>
              <div className="flex items-center relative">
                <h1 className="text-[#6E0112] font-runestars">
                  <span className="text-shadow-[0_0_6px_#fff,1px_0_0_#fff,2px_0_0_#fff,-1px_0_0_#fff,-2px_0_0_#fff,0_1px_0_#fff,0_2px_0_#fff,0_-1px_0_#fff,0_-2px_0_#fff,1px_1px_0_#fff,2px_2px_0_#fff,-1px_-1px_0_#fff,-2px_-2px_0_#fff,1px_-1px_0_#fff,2px_-2px_0_#fff,-1px_1px_0_#fff,-2px_2px_0_#fff] font-extrabold text-5xl">
                    SATU CERITA
                  </span>
                </h1>
                <div className="absolute right-[-40px] top-[-10px] w-[30px] h-[30px] rotate-[30deg]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M16.2528 1.51297C17.6991 -0.0545821 20.2667 1.42783 19.6323 3.46408L17.6786 9.7346C17.4488 10.472 17.6642 11.2758 18.2319 11.7995L23.0591 16.2531C24.6266 17.6993 23.1442 20.2669 21.108 19.6325L14.8374 17.6788C14.1 17.4491 13.2963 17.6644 12.7726 18.2321L8.31897 23.0593C6.87274 24.6269 4.30511 23.1444 4.93954 21.1082L6.89324 14.8377C7.12298 14.1003 6.90761 13.2965 6.33995 12.7728L1.51274 8.31919C-0.0548091 6.87297 1.4276 4.30534 3.46385 4.93977L9.73438 6.89346C10.4718 7.12321 11.2755 6.90784 11.7993 6.34018L16.2528 1.51297Z"
                      fill="#FFB835"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="font-jakarta text-white max-w-[500px] mt-2">
              Dari bakso prasmanan hingga kuliner Nusantara, kami hadirkan
              pengalaman makan otentik dan hangat untuk semua.
            </div>
            <div className="flex flex-col md:flex-row gap-2 mt-6">
              <a
                href="#brand"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-jakarta text-sm font-semibold  text-[#303030] transition hover:bg-[#FFB835] hover:text-[#6E0112]"
              >
                Jelajahi Brand
              </a>
              <a
                href="/membership"
                className=" inline-flex w-fit items-center justify-center gap-2 rounded-md bg-transparent border border-white px-6 py-3 font-jakarta text-sm font-semibold  text-white transition hover:bg-[#6E0112] hover:border-[#6E0112] hover:text-white"
              >
                Join Membership
              </a>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#D9D9D9] rounded-md w-1/2 overflow-hidden h-[650px] hidden md:block">
          <div className="grid grid-cols-12 grid-rows-5 h-full rounded-md overflow-hidden">
            <div className="col-span-3 border border-gray-100 flex items-center justify-center p-4">
              <img
                src="/images/logo_navbar.png"
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="Enggal Group Indonesia"
              />
            </div>
            <div className="col-span-3 border border-gray-100 flex items-center justify-center p-4">
              <img
                src="/images/enhaii.png"
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="Enhaii"
              />
            </div>
            <div className="col-span-3 border border-gray-100 flex items-center justify-center p-4">
              <img
                src="/images/bakso_raja.png"
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="Bakso Raja"
              />
            </div>
            <div className="col-span-3 border border-gray-100 flex items-center justify-center p-4">
              <img
                src="/images/bakso_malang.png"
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="Bakso Malang Enggal"
              />
            </div>

            <div className="col-span-3">
              <img
                src="/images/hero_1.webp"
                className="w-full h-full object-cover"
                alt="Food 1"
              />
            </div>
            <div className="col-span-3">
              <img
                src="/images/hero_2.webp"
                className="w-full h-full object-cover"
                alt="Food 2"
              />
            </div>
            <div className="col-span-3">
              <img
                src="/images/hero_3.webp"
                className="w-full h-full object-cover"
                alt="Food 3"
              />
            </div>
            <div className="col-span-3">
              <img
                src="/images/hero_4.webp"
                className="w-full h-full object-cover"
                alt="Food 4"
              />
            </div>

            <div className="col-span-4 border border-gray-100 flex items-center justify-center p-4">
              <img
                src="/images/warung_kondang.svg"
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="Warung Kondang"
              />
            </div>
            <div className="col-span-4 border border-gray-100 flex items-center justify-center p-4">
              <img
                src="/images/warkop_agam.png"
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="Warkop Agam"
              />
            </div>
            <div className="col-span-4 border border-gray-100 flex items-center justify-center p-4">
              <img
                src="/images/bebek_sawahan.png"
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="bebek sawahan"
              />
            </div>

            <div className="col-span-3">
              <img
                src="/images/hero_5.webp"
                className="w-full h-full object-cover"
                alt="Food 5"
              />
            </div>
            <div className="col-span-3">
              <img
                src="/images/hero_6.webp"
                className="w-full h-full object-cover"
                alt="Food 6"
              />
            </div>
            <div className="col-span-3">
              <img
                src="/images/hero_7.webp"
                className="w-full h-full object-cover"
                alt="Food 7"
              />
            </div>
            <div className="col-span-3">
              <img
                src="/images/hero_8.webp"
                className="w-full h-full object-cover"
                alt="Food 8"
              />
            </div>

            <div className="col-span-4 border border-gray-100 flex items-center justify-center p-4">
              <img
                src={placeholderImage}
                className="max-w-[80%] max-h-[80%] object-contain"
                alt="placeholder"
              />
            </div>
            <div className="col-span-4 p-4 flex flex-col items-start justify-center bg-[#FFB835]">
              <span className="text-[#A71D28] text-4xl font-bold leading-none">
                2008
              </span>
              <span className="text-[#A71D28] mt-1 text-sm">Est</span>
            </div>
            <div className="col-span-4 p-4 flex flex-col items-start justify-center bg-[#A71D28] text-[#FFB835]">
              <span className="text-4xl font-bold leading-none flex gap-x-1">
                <span>{dashboardCounts?.totalBrand ?? 8}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.5545 0.654239C13.0005 -0.757801 15.3895 0.621465 14.8896 2.5798L13.8497 6.65408C13.6772 7.32997 13.8693 8.04691 14.3566 8.54599L17.2944 11.5545C18.7064 13.0005 17.3271 15.3895 15.3688 14.8896L11.2945 13.8497C10.6186 13.6772 9.9017 13.8693 9.40262 14.3567L6.39414 17.2944C4.9481 18.7064 2.55914 17.3272 3.05898 15.3688L4.09889 11.2945C4.2714 10.6187 4.0793 9.90172 3.59195 9.40264L0.654226 6.39416C-0.757814 4.94811 0.621452 2.55916 2.57978 3.059L6.65407 4.0989C7.32995 4.27141 8.04689 4.07931 8.54597 3.59197L11.5545 0.654239Z"
                    fill="#FFB835"
                  />
                </svg>
              </span>
              <span className="mt-1 text-sm">Brand Besar</span>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 64 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col md:flex-row gap-10 md:gap-16 py-8 md:py-16 max-w-6xl container px-4 md:px-8 w-full mx-auto"
      >
        <div className="w-full lg:w-4/12 relative">
          <div className="bg-[#FFB835] rounded-md relative h-full ">
            <div className="absolute inset-0 z-10 pointer-events-none bg-[url('/images/dots_spaced.png')] bg-left bg-contain bg-no-repeat opacity-30"></div>
            <div className="absolute inset-0 w-full h-full">
              <svg
                className="w-full h-auto max-w-[350px] sm:max-w-[396px]"
                viewBox="0 0 396 252"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 245C41.5254 218.997 91.7225 172.201 117.379 124.436M117.379 124.436C135.815 90.1147 141.58 55.2927 119.757 27.3245C65.4806 -42.2352 43.8104 85.9707 117.379 124.436ZM117.379 124.436C132.244 132.208 150.998 136.316 174.156 134.389C284.374 125.217 361.437 82.2396 389 64.8768"
                  stroke="#EA9800"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} className="absolute right-4 sm:right-8 top-1/4">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                viewBox="0 0 31 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.2297 0.649999C22.6759 -0.917554 25.2435 0.56486 24.6091 2.6011L21.5918 12.2855C21.362 13.0228 21.5774 13.8266 22.1451 14.3503L29.6003 21.2286C31.1679 22.6748 29.6855 25.2424 27.6492 24.608L17.9649 21.5907C17.2275 21.3609 16.4237 21.5763 15.9 22.1439L9.02174 29.5992C7.57552 31.1668 5.00789 29.6843 5.64232 27.6481L8.65965 17.9637C8.8894 17.2264 8.67403 16.4226 8.10637 15.8989L0.651107 9.02063C-0.916446 7.57441 0.565968 5.00678 2.60221 5.64121L12.2866 8.65854C13.024 8.88829 13.8277 8.67292 14.3515 8.10526L21.2297 0.649999Z"
                  fill="white"
                />
              </svg>
            </motion.div>
            <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} className="absolute left-4 sm:left-8 top-1/4">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                viewBox="0 0 31 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.2277 0.649999C22.6739 -0.917554 25.2416 0.56486 24.6072 2.6011L21.5898 12.2855C21.3601 13.0228 21.5754 13.8266 22.1431 14.3503L29.5984 21.2286C31.1659 22.6748 29.6835 25.2424 27.6473 24.608L17.9629 21.5907C17.2255 21.3609 16.4217 21.5763 15.898 22.1439L9.01979 29.5992C7.57356 31.1668 5.00594 29.6843 5.64036 27.6481L8.6577 17.9637C8.88744 17.2264 8.67207 16.4226 8.10441 15.8989L0.649154 9.02063C-0.918399 7.57441 0.564015 5.00678 2.60026 5.64121L12.2846 8.65854C13.022 8.88829 13.8258 8.67292 14.3495 8.10526L21.2277 0.649999Z"
                  fill="white"
                />
              </svg>
            </motion.div>
            <motion.div whileInView={{ opacity: 1, transition: { duration: 0.5 } }} initial={{ opacity: 0 }} className="flex items-end justify-center h-full">
              <img
                src={getImageUrl(ceoData?.image, "/images/ceo.png")}
                alt={ceoData?.nama ? `${ceoData.nama} - ${ceoData.title}` : "Enggal Group CEO"}
                className="relative z-10 h-full w-auto object-cover"
              />
            </motion.div>

            <motion.div whileInView={{ scale: 1, transition: { duration: 0.1 } }} initial={{ scale: 0 }} className="absolute top-4 sm:top-6 -left-3 sm:-left-6 z-20 bg-[#A71D28] text-white px-3 sm:px-6 py-2 sm:py-4 rounded-md flex items-center shadow-lg">
              <svg
                width="19"
                height="20"
                className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0"
                viewBox="0 0 19 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.13003 1.65575C0.945774 2.01591 0.855172 2.46211 0.673969 3.35251L0.0652071 6.34385C-0.0210692 6.75171 -0.0217375 7.17259 0.0632433 7.58071C0.148224 7.98883 0.317066 8.37561 0.559432 8.71738C0.801798 9.05914 1.11259 9.3487 1.47278 9.56832C1.83297 9.78795 2.23498 9.93301 2.6542 9.99465C3.07342 10.0563 3.50103 10.0332 3.91085 9.92676C4.32067 9.82034 4.70408 9.63284 5.0376 9.37574C5.37113 9.11864 5.64775 8.79735 5.85054 8.43153C6.05333 8.06572 6.17801 7.66308 6.21696 7.24826L6.28822 6.55795C6.24964 6.99699 6.30467 7.4391 6.4498 7.85605C6.59493 8.273 6.82697 8.65562 7.13108 8.97945C7.43519 9.30328 7.8047 9.5612 8.21598 9.73674C8.62727 9.91229 9.07129 10.0016 9.51969 9.99893C9.96808 9.99627 10.411 9.90172 10.8201 9.72133C11.2292 9.54093 11.5955 9.27864 11.8956 8.95124C12.1957 8.62383 12.4231 8.2385 12.5631 7.81986C12.7031 7.40122 12.7527 6.95848 12.7087 6.51993L12.783 7.24826C12.822 7.66308 12.9467 8.06572 13.1495 8.43153C13.3523 8.79735 13.6289 9.11864 13.9624 9.37574C14.2959 9.63284 14.6793 9.82034 15.0892 9.92676C15.499 10.0332 15.9266 10.0563 16.3458 9.99465C16.765 9.93301 17.167 9.78795 17.5272 9.56832C17.8874 9.3487 18.1982 9.05914 18.4406 8.71738C18.6829 8.37561 18.8518 7.98883 18.9368 7.58071C19.0217 7.17259 19.0211 6.75171 18.9348 6.34385L18.326 3.35251C18.1448 2.46211 18.0542 2.01691 17.87 1.65575C17.678 1.27961 17.4077 0.947363 17.0765 0.680557C16.7454 0.413751 16.3609 0.218354 15.948 0.107048C15.551 1.11809e-07 15.0888 0 14.1645 0H4.83554C3.9112 0 3.44903 1.11809e-07 3.05201 0.107048C2.63908 0.218354 2.25457 0.413751 1.92346 0.680557C1.59235 0.947363 1.32202 1.27961 1.13003 1.65575ZM15.8818 11.5052C16.6772 11.5072 17.4596 11.3069 18.153 10.9239V12.0054C18.153 15.7781 18.153 17.6649 16.9599 18.8365C15.9999 19.7809 14.5696 19.964 12.045 20V16.5074C12.045 15.572 12.045 15.1048 11.8404 14.7566C11.7064 14.5285 11.5136 14.3391 11.2815 14.2074C10.9272 14.0063 10.4518 14.0063 9.5 14.0063C8.54817 14.0063 8.07277 14.0063 7.71851 14.2074C7.48639 14.3391 7.29364 14.5285 7.15963 14.7566C6.95501 15.1048 6.95501 15.572 6.95501 16.5074V20C4.43038 19.964 3.00009 19.7799 2.04012 18.8365C0.847028 17.6649 0.847028 15.7781 0.847028 12.0054V10.9239C1.5407 11.3071 2.32346 11.5073 3.1192 11.5052C4.29563 11.5059 5.42827 11.0667 6.2872 10.2766C7.1624 11.0693 8.30982 11.5081 9.5 11.5052C10.6902 11.5081 11.8376 11.0693 12.7128 10.2766C13.5717 11.0667 14.7054 11.5059 15.8818 11.5052Z"
                    fill="#FFB835"
                  />
                </svg>
                <span className="font-bold mr-1 sm:mr-2 text-lg sm:text-xl lg:text-2xl">
                  {dashboardCounts?.totalOutlet ?? 25}
                  <sup className="font-normal text-xs sm:text-sm lg:text-base">
                    Outlet
                  </sup>
                </span>
              </motion.div>

              <motion.div
                whileInView={{ scale: 1, transition: { duration: 0.2 } }}
                initial={{ scale: 0 }}
                viewport={{ amount: 0.4 }}
                className="absolute bottom-1/3 sm:bottom-1/4 -right-3 sm:-right-6 z-20 bg-[#A71D28] text-white px-3 sm:px-6 py-2 sm:py-4 rounded-md flex items-center shadow-lg">
                <svg
                  width="21"
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.9795 0.282544C11.0307 -0.0941813 9.96934 -0.0941813 9.02055 0.282544L6.72105 1.19567L16.7927 5.03119L20.3354 3.69132C20.1897 3.57399 20.0269 3.47867 19.8523 3.40854L11.9795 0.282544ZM21 5.09288L11.2875 8.76799V20C11.5227 19.9534 11.7534 19.8852 11.9795 19.7954L19.8523 16.6694C20.1915 16.5348 20.4819 16.3042 20.6863 16.0071C20.8908 15.71 21 15.3598 21 15.0015V5.09288ZM9.7125 20V8.76799L0 5.09288V15.0025C0.000206869 15.3607 0.10953 15.7106 0.313978 16.0075C0.518427 16.3045 0.8087 16.5349 1.14765 16.6694L9.02055 19.7954C9.24665 19.8845 9.4773 19.952 9.7125 20ZM0.66465 3.69132L10.5 7.4127L14.6128 5.85587L4.5927 2.04092L1.14765 3.40854C0.96845 3.47984 0.80745 3.5741 0.66465 3.69132Z"
                    fill="#FFB835"
                  />
                </svg>
                <span className="font-bold mr-1 sm:mr-2 text-lg sm:text-xl lg:text-2xl flex gap-x-1">
                  <span>
                    {dashboardCounts?.totalBrand ?? 8}
                  </span>
                  <sup className="font-normal text-xs sm:text-sm lg:text-base">
                    Brand
                  </sup>
                </span>
              </motion.div>

              <motion.div whileInView={{ scale: 1, transition: { duration: 0.3 } }} initial={{ scale: 0 }} className="absolute bottom-4 sm:bottom-6 -left-3 sm:-left-6 z-20 bg-[#A71D28] text-white px-3 sm:px-6 py-2 sm:py-4 rounded-md flex items-center shadow-lg">
                <svg
                  width="16"
                  height="20"
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0"
                  viewBox="0 0 16 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.32444 18.7368C6.86311 19.187 7.42489 19.5985 8 20C8.57635 19.6038 9.1354 19.1823 9.67556 18.7368C10.576 17.988 11.4234 17.176 12.2116 16.3068C14.0284 14.2946 16 11.3775 16 8.103C16 7.0389 15.7931 5.98522 15.391 5.00211C14.989 4.01901 14.3997 3.12575 13.6569 2.37331C12.914 1.62088 12.0321 1.02402 11.0615 0.616804C10.0909 0.20959 9.05058 0 8 0C6.94943 0 5.90914 0.20959 4.93853 0.616804C3.96793 1.02402 3.08601 1.62088 2.34315 2.37331C1.60028 3.12575 1.011 4.01901 0.608964 5.00211C0.206926 5.98522 -1.56548e-08 7.0389 0 8.103C0 11.3775 1.97156 14.2937 3.78844 16.3068C4.57655 17.1763 5.42397 17.9877 6.32444 18.7368ZM8 11.0291C7.23382 11.0291 6.49902 10.7208 5.95725 10.1721C5.41548 9.6233 5.11111 8.87904 5.11111 8.103C5.11111 7.32695 5.41548 6.58269 5.95725 6.03395C6.49902 5.4852 7.23382 5.17692 8 5.17692C8.76618 5.17692 9.50098 5.4852 10.0428 6.03395C10.5845 6.58269 10.8889 7.32695 10.8889 8.103C10.8889 8.87904 10.5845 9.6233 10.0428 10.1721C9.50098 10.7208 8.76618 11.0291 8 11.0291Z"
                    fill="#FFB835"
                  />
                </svg>
                <span className="font-bold mr-1 sm:mr-2 text-lg sm:text-xl lg:text-2xl">
                  12{" "}
                  <sup className="font-normal text-xs sm:text-sm lg:text-base">
                    Kota Besar
                  </sup>
                </span>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ amount: 0.4, once: true }}
            className="w-full lg:w-7/12 flex flex-col justify-center bg-[#F7F7F7F8] p-4 lg:p-6 rounded-xl"
          >
            <div className="flex items-start justify-start mb-4">
              <img src={vectorLine} alt="Decorative line" className="w-16 h-5" />
            </div>
            <h2 className="font-runestars mb-4">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-2xl md:text-3xl lg:text-4xl text-white">
                Menyatukan Orang Lewat Meja Makan
              </span>
            </h2>

            <p className="text-[#4D3200] font-jakarta mb-6 lg:mb-8 italic text-sm lg:text-base">
              Kami percaya bahwa makanan tidak hanya soal rasa, tetapi juga
              pengalaman. Enggal Group hadir untuk menyatukan orang-orang lewat
              kuliner dari meja makan. Dengan berbagai inovasi dan pelayanan
              prima, kami berkomitmen untuk terus berkembang dan menjadi bagian
              dari cerita kuliner Indonesia.
            </p>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full sm:w-3/4 py-2 px-4 bg-white rounded-lg gap-4 sm:gap-0">
              <div className="flex flex-col items-start">
                <h3 className="text-[#303030] font-jakarta text-sm lg:text-lg font-semibold">
                  {ceoData?.nama || "Muhammad Firdan"}
                </h3>
                <p className="text-[#666666] font-jakarta">CEO Enggal Group Indonesia</p>
              </div>

              <div className="flex gap-x-3 items-center">
                {ceoData?.linkedinUrl && (
                  <a
                    href={ceoData.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#FFB835] hover:bg-[#A71D28] hover:text-white text-[#A71D28] p-2 rounded-md transition-colors flex items-center justify-center w-10 h-10"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                    >
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </a>
                )}
                {ceoData?.instagramUrl && (
                  <a
                    href={ceoData.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#FFB835] hover:bg-[#A71D28] hover:text-white text-[#A71D28] p-2 rounded-md transition-colors flex items-center justify-center w-10 h-10"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                    >
                      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <section id="tentang" className="pt-10 flex justify-between max-w-6xl container px-4 w-full mx-auto">
          <div className="hidden md:block w-full md:w-1/4">
            <div className="sticky top-24 flex flex-col items-start justify-start py-10">
              <img src={vectorLine} alt="Decorative line" className="w-16 h-5" />
              <h2 className="font-runestars mb-2">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl md:text-4xl text-white whitespace-nowrap">
                  Cerita Kami
                </span>
              </h2>
              <p className="font-jakarta font-medium ">
                Dari Bakso Prasmanan Pertama di Indonesia hingga Multi-brand Kuliner
                untuk Semua Kalangan
              </p>
            </div>
          </div>
          <div className="flex flex-col w-full lg:w-7/12">
            <div className="flex items-stretch gap-8">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-3 h-3 bg-[#9C0000]"></div>
                <div className="h-full w-0.5 bg-[#FFB835]"></div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-y-4 xl:gap-y-10 w-full pb-10 mb-10 md:pb-16 md:mb-16 border-b-2 border-dashed border-[#CDCDCD]"
              >
                <p className="text-[#9C0000] font-jakarta font-bold text-xl">
                  2008
                </p>
                <div className="block lg:flex justify-between">
                  <h1 className="font-runestars text-2xl">LAHIRNYA PERJALANAN</h1>
                  <p className="font-jakarta text-sm lg:max-w-[250px]">
                    Awal mula Enggal Group dimulai dari Bakso Malang Enggal
                    di Palembang.
                  </p>
                </div>
                <div className="flex justify-between gap-4">
                  <img
                    src="/images/2008.webp"
                    className="flex-1 w-full max-w-[calc(50%-0.5rem)] h-[100px] md:h-[200px] rounded-md object-cover"
                  />
                </div>
              </motion.div>
            </div>
            <div className="flex items-stretch gap-8">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-3 h-3 bg-[#9C0000]"></div>
                <div className="h-full w-0.5 bg-[#FFB835]"></div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-y-4 xl:gap-y-10 w-full pb-10 mb-10 md:pb-16 md:mb-16 border-b-2 border-dashed border-[#CDCDCD]"
              >
                <p className="text-[#9C0000] font-jakarta font-bold text-xl">
                  2023
                </p>
                <div className="block lg:flex justify-between">
                  <h1 className="font-runestars text-2xl">BABAK BARU DIMULAI</h1>
                  <p className="font-jakarta text-sm lg:max-w-[250px]">
                    Re-launch brand pertama Bakso Malang Enggal dengan konsep restoran bakso prasmanan pertama di Indonesia di Pekanbaru
                  </p>
                </div>
                <div className="flex justify-between gap-4">
                  <img
                    src="/images/2023.webp"
                    className="flex-1 w-full max-w-[calc(50%-0.5rem)] h-[100px] md:h-[200px] rounded-md object-cover"
                  />
                  <img
                    src="/images/bakso_malang.png"
                    className="flex-1 w-full max-w-[calc(50%-0.5rem)] h-[100px] md:h-[200px] rounded-md object-contain"
                  />
                </div>
              </motion.div>
            </div>
            <div className="flex items-stretch gap-8">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-3 h-3 bg-[#9C0000]"></div>
                <div className="h-full w-0.5 bg-[#FFB835]"></div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-y-4 xl:gap-y-10 w-full pb-10 mb-10 md:pb-16 md:mb-16 border-b-2 border-dashed border-[#CDCDCD]"
              >
                <p className="text-[#9C0000] font-jakarta font-bold text-xl">
                  2024
                </p>
                <div className="block lg:flex justify-between">
                  <h1 className="font-runestars text-2xl">MENYEBAR KE BANYAK KOTA</h1>
                  <p className="font-jakarta text-sm lg:max-w-[250px]">
                    Bakso Raja di Pekanbaru, Bebek Sawahan di Palembang, Warkop Putra Agam di Jakarta Timur
                  </p>
                </div>
                <div className="flex justify-between gap-4">
                  <img
                    src="/images/20241.webp"
                    className="flex-1 w-full max-w-[calc(50%-0.5rem)] h-[100px] md:h-[200px] rounded-md object-cover"
                  />
                  <img
                    src="/images/20242.webp"
                    className="flex-1 w-full max-w-[calc(50%-0.5rem)] h-[100px] md:h-[200px] rounded-md object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="bg-[#FFB835] relative overflow-hidden">
          <div className="absolute -top-2 -right-1 hidden md:block">
            <img src="/images/map-corner.png" className="w-full h-auto z-0" />
          </div>
          <div className="absolute -bottom-6 -left-4">
            <img src="/images/map-corner.png" className="w-full h-auto z-0 rotate-180" />
          </div>
          <div className="absolute -bottom-6 -right-4 hidden md:block">
            <svg width="396" height="252" viewBox="0 0 396 252" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 245C41.5254 218.997 91.7225 172.201 117.379 124.436M117.379 124.436C135.815 90.1147 141.58 55.2927 119.757 27.3245C65.4806 -42.2352 43.8104 85.9707 117.379 124.436ZM117.379 124.436C132.244 132.208 150.998 136.316 174.156 134.389C284.374 125.217 361.437 82.2396 389 64.8768" stroke="#EA9800" strokeWidth="14" strokeLinecap="round" />
            </svg>
          </div>
          <div className="max-w-6xl container px-4 w-full mx-auto relative z-10">
            <div className="flex justify-between w-full">
              <div className="hidden lg:flex flex-col items-start justify-start w-full lg:w-1/3">
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  whileInView={{ opacity: 1, y: 40 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-[#9C0000] p-4 rounded-xl my-10 relative">
                  <div className="pointer-events-none absolute inset-0  bg-[url('/images/dots.png')] bg-cover bg-center bg-repeat-x opacity-20" />
                  <h2 className="font-runestars text-[#FFB835] mb-2 text-3xl">
                    Visi
                  </h2>
                  <p className="font-jakarta font-semibold text-white text-sm">
                    Menjadi F&B group terkemuka di Indonesia yang nyaman untuk semua kalangan.
                  </p>
                </motion.div>
              </div>
              <div className="flex flex-col w-full lg:w-7/12">
                <div className="flex items-stretch gap-8">
                  <div className="flex flex-col items-center justify-start">
                    <div className="h-24 w-0.5 bg-white"></div>
                    <div className="w-3 h-3 bg-[#9C0000]"></div>
                  </div>
                  <div className="block md:flex">
                    <div className="flex flex-col gap-y-2 md:gap-y-6 w-full mt-20">
                      <h1 className="font-bold font-jakarta text-xl text-[#9C0000]">2025</h1>
                      <h1 className="font-runestars">
                        <span className="text-shadow-[0_0_6px_#fff,1px_0_0_#fff,2px_0_0_#fff,-1px_0_0_#fff,-2px_0_0_#fff,0_1px_0_#fff,0_2px_0_#fff,0_-1px_0_#fff,0_-2px_0_#fff,1px_1px_0_#fff,2px_2px_0_#fff,-1px_-1px_0_#fff,-2px_-2px_0_#fff,1px_-1px_0_#fff,2px_-2px_0_#fff,-1px_1px_0_#fff,-2px_2px_0_#fff] font-extrabold text-2xl md:text-4xl">
                          MELANGKAH LEBIH JAUH
                        </span>
                      </h1>
                    </div>
                    <div>
                      <p className="font-jakarta font-medium text-[#3F2900] mt-4 md:mt-24 md:text-xs max-w-md text-justify">Launch beberapa brand lainnya: Kebab Zabbab di Jakarta Timur, Warung Kondang di Kota Wisata, Soerabi Bandung Enhaii di Kota Wisata</p>
                      <p className="font-jakarta font-medium text-[#3F2900] mt-4 md:text-xs max-w-md text-justify">Memulai ekspansi ke Pulau Jawa, Yong Bengkalis, kedai kopi berkonsep Melayu dengan 14 outlet di Riau dan Kepri, kini hadir di Kota Wisata.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center py-20">
              <div className="lg:block hidden">
                <InteractiveMap />
              </div>
              <div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 mx-auto">
                  <div className="bg-white rounded-lg p-6 flex items-start gap-x-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 0C24.8368 0 32 7.1632 32 16C32 24.8368 24.8368 32 16 32C7.1632 32 0 24.8368 0 16C0 7.1632 7.1632 0 16 0ZM16 6.4C15.5757 6.4 15.1687 6.56857 14.8686 6.86863C14.5686 7.16869 14.4 7.57565 14.4 8V16C14.4001 16.4243 14.5687 16.8312 14.8688 17.1312L19.6688 21.9312C19.9706 22.2227 20.3747 22.3839 20.7942 22.3803C21.2138 22.3766 21.6151 22.2084 21.9117 21.9117C22.2084 21.6151 22.3766 21.2138 22.3803 20.7942C22.3839 20.3747 22.2227 19.9706 21.9312 19.6688L17.6 15.3376V8C17.6 7.57565 17.4314 7.16869 17.1314 6.86863C16.8313 6.56857 16.4243 6.4 16 6.4Z" fill="#9C0000" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <CountUpNumber
                        end={3}
                        className="text-4xl text-[#1E1E1E] font-runestars"
                      />
                      <p className="font-jakarta text-[#585858]">Tahun</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 flex items-start gap-x-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
                        <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.4148 0.365767C17.1856 -0.121922 15.8144 -0.121922 14.5852 0.365767L10.2209 2.09745L25.6798 8.23934L31.7386 5.83496C31.4552 5.60207 31.1371 5.41433 30.7956 5.27846L18.4148 0.365767ZM22.9045 9.34087L7.4448 3.19898L2.2044 5.27765C1.85625 5.41677 1.53945 5.605 1.26142 5.83496L16.5 11.8819L22.9045 9.34087ZM0 8.50695C0 8.19106 0.0429 7.88171 0.124575 7.5871L15.4688 13.6758V32C15.1667 31.9402 14.8708 31.8525 14.5852 31.7381L2.2044 26.8246C1.55397 26.5666 0.996353 26.1212 0.603448 25.546C0.210543 24.9707 0.000361015 24.2918 0 23.5969V8.50695ZM18.4148 31.7373C18.1266 31.8519 17.8321 31.9394 17.5312 32V13.6758L32.8754 7.5871C32.9571 7.88253 33 8.19187 33 8.50777V23.5969C32.9998 24.292 32.7897 24.971 32.3968 25.5464C32.0039 26.1219 31.4462 26.5674 30.7956 26.8254L18.4148 31.7373Z" fill="#9C0000" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <CountUpNumber
                        end={dashboardCounts?.totalBrand ?? 8}
                        className="text-4xl text-[#1E1E1E] font-runestars"
                      />
                      <p className="font-jakarta text-[#585858]">Brand</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 flex items-start gap-x-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
                        <svg width="27" height="32" viewBox="0 0 27 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.6912 1.19976C14.6912 0.881564 14.5657 0.5764 14.3423 0.351401C14.1189 0.126403 13.8159 0 13.5 0C13.1841 0 12.8811 0.126403 12.6577 0.351401C12.4343 0.5764 12.3088 0.881564 12.3088 1.19976V3.20576H9.13235C8.39521 3.20576 7.68825 3.5007 7.16701 4.0257C6.64577 4.55069 6.35294 5.26274 6.35294 6.0052V9.45251C8.76706 9.23175 11.1176 11.1098 11.1176 13.8404V30.8002C11.1176 30.8429 11.1166 30.8845 11.1145 30.925V32H15.8792V30.0004H15.8824V18.0028C15.8824 16.8361 16.3425 15.7171 17.1616 14.8922C17.9807 14.0672 19.0916 13.6037 20.25 13.6037H20.6471V6.0052C20.6471 5.26274 20.3542 4.55069 19.833 4.0257C19.3117 3.5007 18.6048 3.20576 17.8676 3.20576H14.6912V1.19976ZM17.4674 32H24.2206C24.9577 32 25.6647 31.7051 26.1859 31.1801C26.7072 30.6551 27 29.943 27 29.2006V18.0028C27 17.2603 26.7072 16.5483 26.1859 16.0233C25.6647 15.4983 24.9577 15.2034 24.2206 15.2034H20.25C19.5129 15.2034 18.8059 15.4983 18.2847 16.0233C17.7634 16.5483 17.4706 17.2603 17.4706 18.0028V30.0004H17.4674V32ZM9.52941 30.0004H9.52624V32H2.77941C2.04227 32 1.33531 31.7051 0.814071 31.1801C0.29283 30.6551 0 29.943 0 29.2006V16.4671C0 15.5233 0.471706 14.6435 1.25471 14.1268L5.22529 11.5017C7.07241 10.2779 9.52941 11.6137 9.52941 13.8404V30.0004Z" fill="#9C0000" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <CountUpNumber
                        end={12}
                        className="text-4xl text-[#1E1E1E] font-runestars"
                      />
                      <p className="font-jakarta text-[#585858]">Kota</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 flex items-start gap-x-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
                        <svg width="30" height="32" viewBox="0 0 30 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.78426 2.64919C1.49333 3.22545 1.35027 3.93937 1.06416 5.36401L0.102959 10.1502C-0.0332672 10.8027 -0.0343223 11.4761 0.0998579 12.1291C0.234038 12.7821 0.50063 13.401 0.883314 13.9478C1.266 14.4946 1.75672 14.9579 2.32544 15.3093C2.89416 15.6607 3.52892 15.8928 4.19084 15.9914C4.85277 16.09 5.52794 16.0531 6.17502 15.8828C6.82211 15.7125 7.42749 15.4125 7.95411 15.0012C8.48073 14.5898 8.9175 14.0758 9.23769 13.4905C9.55788 12.9051 9.75475 12.2609 9.81625 11.5972L9.92877 10.4927C9.86785 11.1952 9.95475 11.9026 10.1839 12.5697C10.4131 13.2368 10.7794 13.849 11.2596 14.3671C11.7398 14.8852 12.3232 15.2979 12.9726 15.5788C13.622 15.8597 14.3231 16.0025 15.0311 15.9983C15.7391 15.994 16.4384 15.8428 17.0843 15.5541C17.7303 15.2655 18.3087 14.8458 18.7826 14.322C19.2564 13.7981 19.6154 13.1816 19.8364 12.5118C20.0575 11.8419 20.1358 11.1336 20.0664 10.4319L20.1837 11.5972C20.2452 12.2609 20.4421 12.9051 20.7623 13.4905C21.0825 14.0758 21.5193 14.5898 22.0459 15.0012C22.5725 15.4125 23.1779 15.7125 23.825 15.8828C24.4721 16.0531 25.1472 16.09 25.8092 15.9914C26.4711 15.8928 27.1058 15.6607 27.6746 15.3093C28.2433 14.9579 28.734 14.4946 29.1167 13.9478C29.4994 13.401 29.766 12.7821 29.9001 12.1291C30.0343 11.4761 30.0333 10.8027 29.897 10.1502L28.9358 5.36401C28.6497 3.93937 28.5067 3.22705 28.2157 2.64919C27.9126 2.04738 27.4858 1.51578 26.963 1.08889C26.4401 0.662001 25.833 0.349366 25.181 0.171277C24.5542 1.78814e-07 23.8244 0 22.3649 0H7.63506C6.17558 0 5.44583 1.78814e-07 4.81896 0.171277C4.16696 0.349366 3.55985 0.662001 3.03704 1.08889C2.51423 1.51578 2.0874 2.04738 1.78426 2.64919ZM25.0766 18.4083C26.3324 18.4114 27.5678 18.0911 28.6626 17.4783V19.2086C28.6626 25.245 28.6626 28.2639 26.7788 30.1384C25.263 31.6494 23.0047 31.9424 19.0184 32V26.4119C19.0184 24.9152 19.0184 24.1677 18.6953 23.6106C18.4837 23.2456 18.1794 22.9426 17.8129 22.7318C17.2535 22.4101 16.5029 22.4101 15 22.4101C13.4971 22.4101 12.7465 22.4101 12.1871 22.7318C11.8206 22.9426 11.5163 23.2456 11.3047 23.6106C10.9816 24.1677 10.9816 24.9152 10.9816 26.4119V32C6.99533 31.9424 4.73699 31.6478 3.22124 30.1384C1.33741 28.2639 1.33741 25.245 1.33741 19.2086V17.4783C2.43269 18.0913 3.66863 18.4117 4.92505 18.4083C6.78258 18.4094 8.57096 17.7067 9.92716 16.4426C11.309 17.7109 13.1208 18.4129 15 18.4083C16.8792 18.4129 18.691 17.7109 20.0728 16.4426C21.429 17.7067 23.219 18.4094 25.0766 18.4083Z" fill="#9C0000" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <CountUpNumber
                        end={dashboardCounts?.totalOutlet ?? 30}
                        className="text-4xl text-[#1E1E1E] font-runestars"
                      />
                      <p className="font-jakarta text-[#585858]">Outlet</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 flex items-start gap-x-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
                      <svg width="26" height="32" viewBox="0 0 26 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.382909 1.3058C0.412161 0.944664 0.577364 0.608881 0.844161 0.36828C1.11096 0.127678 1.45881 0.000776768 1.81538 0.0139669C2.17196 0.0271571 2.5098 0.179424 2.75865 0.4391C3.0075 0.698776 3.14821 1.04588 3.15152 1.40821V8.59969C3.15152 8.86495 3.25528 9.11934 3.43997 9.3069C3.62467 9.49447 3.87517 9.59984 4.13636 9.59984C4.39756 9.59984 4.64806 9.49447 4.83276 9.3069C5.01745 9.11934 5.12121 8.86495 5.12121 8.59969V1.20018C5.12121 0.881873 5.24572 0.576602 5.46736 0.351524C5.68899 0.126447 5.98959 0 6.30303 0C6.61647 0 6.91707 0.126447 7.1387 0.351524C7.36034 0.576602 7.48485 0.881873 7.48485 1.20018V8.59969C7.48485 8.86495 7.58861 9.11934 7.7733 9.3069C7.958 9.49447 8.2085 9.59984 8.4697 9.59984C8.7309 9.59984 8.9814 9.49447 9.16609 9.3069C9.35079 9.11934 9.45455 8.86495 9.45455 8.59969V1.40821C9.45785 1.04588 9.59856 0.698776 9.84741 0.4391C10.0963 0.179424 10.4341 0.0271571 10.7907 0.0139669C11.1472 0.000776768 11.4951 0.127678 11.7619 0.36828C12.0287 0.608881 12.1939 0.944664 12.2232 1.3058C12.2909 2.28514 12.6061 6.99305 12.6061 9.60144C12.6061 11.7618 11.5503 13.6725 9.93988 14.8294C9.59951 15.0743 9.51758 15.3335 9.52545 15.4647C9.71927 18.47 10.2424 26.6952 10.2424 27.9994C10.2424 29.0604 9.82738 30.078 9.0886 30.8283C8.34982 31.5785 7.34782 32 6.30303 32C5.25824 32 4.25624 31.5785 3.51746 30.8283C2.77868 30.078 2.36364 29.0604 2.36364 27.9994C2.36364 26.6936 2.88679 18.47 3.08061 15.4647C3.08848 15.3335 3.00655 15.0743 2.66618 14.8294C1.84223 14.2383 1.17003 13.4549 0.706087 12.5452C0.242139 11.6355 -5.90556e-06 10.6259 1.08022e-10 9.60144C1.08022e-10 6.99305 0.315152 2.28514 0.382909 1.3058ZM14.9697 9.20138C14.9697 6.76102 15.9243 4.42062 17.6235 2.69502C19.3227 0.969428 21.6273 0 24.0303 0C24.3437 0 24.6443 0.126447 24.866 0.351524C25.0876 0.576602 25.2121 0.881873 25.2121 1.20018V14.8022C25.2121 15.3111 25.3792 17.8347 25.5667 20.6303L25.5745 20.7631C25.7794 23.8164 26 27.1369 26 27.9994C26 29.0604 25.585 30.078 24.8462 30.8283C24.1074 31.5785 23.1054 32 22.0606 32C21.0158 32 20.0138 31.5785 19.275 30.8283C18.5363 30.078 18.1212 29.0604 18.1212 27.9994C18.1212 27.1769 18.3229 23.8212 18.5183 20.7439C18.616 19.1901 18.7153 17.6843 18.7893 16.5673L18.8256 16.0024H17.7273C17.3651 16.0024 17.0066 15.93 16.672 15.7892C16.3374 15.6485 16.0334 15.4422 15.7774 15.1822C15.5213 14.9221 15.3182 14.6134 15.1796 14.2737C15.041 13.9339 14.9697 13.5697 14.9697 13.202V9.20138Z" fill="#9C0000" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <CountUpNumber
                      end={11000000}
                      suffix="+"
                      duration={1.6}
                      formatter={(value) => value.toLocaleString("id-ID")}
                      className="text-4xl text-[#1E1E1E] font-runestars"
                    />
                    <p className="font-jakarta text-[#585858]">Makanan Tersajikan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="brand" className="py-10 flex flex-col gap-y-10 max-w-6xl container px-4 w-full mx-auto">
          <div className="flex justify-between w-full items-center">
            <div className="flex flex-col gap-y-4 items-start justify-start w-full lg:w-1/3">
              <img src={vectorLine} alt="Decorative line" className="w-16 h-5" />
              <h2 className="font-runestars">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl md:text-4xl text-white whitespace-nowrap">
                  Brand Kami
                </span>
              </h2>
              <p className="font-jakarta font-medium ">
                Dari Bakso Prasmanan Pertama di Indonesia hingga Multi-brand
                Kuliner untuk Semua Kalangan
              </p>
            </div>
            <svg
              className="hidden lg:block"
              width="277"
              height="51"
              viewBox="0 0 277 51"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 45.3986C44.8398 22.3284 122.032 -15.2383 112.081 19.0567C99.6433 61.9255 194.208 -19.9674 179.902 18.5727C165.597 57.1129 280.454 -15.7692 270.515 13.105"
                stroke="#FFB835"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex justify-center gap-x-8">
            <div className="bg-white border border-[#D9D9D9] rounded-md w-1/2 lg:flex flex-1 hidden">
              <div className="grid grid-cols-4 grid-rows-3 auto-rows-fr h-full">
                {brandHighlights.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => handleSelectBrand(brand)}
                    className={`border border-gray-100 flex items-center justify-center w-full h-full cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB835] ${brand.rounded ? "rounded" : ""
                      } ${activeBrand?.id === brand.id
                        ? "bg-[#FFF4D6] shadow-sm"
                        : "bg-white hover:bg-gray-50"
                      }`}
                    aria-pressed={activeBrand?.id === brand.id}
                  >
                    <img
                      src={brand.logo}
                      className="max-w-[80%] max-h-[80%] object-contain"
                      alt={brand.alt}
                    />
                  </button>
                ))}
                {Array.from({ length: brandPlaceholderCount }).map((_, index) => (
                  <div
                    key={`brand-placeholder-${index}`}
                    aria-hidden="true"
                    className="border border-gray-100 bg-white w-full h-full flex items-center justify-center p-4"
                  >
                    <img
                      src={placeholderImage}
                      className="max-w-[80%] max-h-[80%] object-contain opacity-30"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-1/2 flex-1 flex flex-col" style={{ height: '500px' }}>
              <div
                className="relative flex-1 overflow-hidden rounded-t-xl cursor-pointer"
                onClick={() => activeBrand && (window.location.href = `/brand/${activeBrand.id}`)}
              >
                {isImageLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse z-10" />
                )}
                <img
                  src={activeBrand?.coverImage || "/images/brand_image.jpg"}
                  className={`h-full object-cover w-full transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                  alt={activeBrand?.name || "Brand cover image"}
                />
                {brandHighlights.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 lg:hidden">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePrevBrand(); }}
                      className="flex items-center gap-2 rounded-full bg-white p-2 text-sm font-semibold shadow-md transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.25 5L6.25 10L11.25 15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.5 10H15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleNextBrand(); }}
                      className="flex items-center gap-2 rounded-full bg-white p-2 text-sm font-semibold shadow-md transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.75 5L13.75 10L8.75 15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.5 10H5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div
                className="bg-[#FFB835] flex items-center rounded-b-xl p-4 cursor-pointer"
                onClick={() => activeBrand && (window.location.href = `/brand/${activeBrand.id}`)}
              >
                {activeBrand && (
                  <>
                    <img
                      src={activeBrand.logo}
                      className="max-w-24 aspect-square object-contain"
                      alt={activeBrand.alt}
                    />
                    <div className="mx-2 w-1 bg-[#EA9800] h-12"></div>
                    <div>
                      <h1 className="font-jakarta font-bold text-xl text-[#A71D28]">
                        {activeBrand.name}
                      </h1>
                      {activeBrand.description && (
                        <p className="font-jakarta text-[#845600]">
                          {activeBrand.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="py-8 md:py-10 flex flex-col gap-y-8 md:gap-y-10 max-w-6xl container px-4 w-full mx-auto">
          <div className="flex flex-col lg:flex-row justify-between w-full items-start lg:items-center gap-6 lg:gap-4">
            <div className="flex flex-col gap-3 md:gap-4 items-start justify-start w-full lg:w-1/3">
              <img
                src={vectorLine}
                alt="Decorative line"
                className="w-12 h-4 md:w-16 md:h-5"
              />
              <h2 className="font-runestars">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-2xl sm:text-3xl md:text-4xl text-white">
                  Outlet Kami
                </span>
              </h2>
              <p className="font-jakarta font-medium text-sm md:text-base leading-relaxed">
                {outlets.length} Outlet di 12 Kota Besar di Indonesia, Satu Cita Rasa Nusantara
              </p>
            </div>
            <div className="flex gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-auto">
                <div
                  className="inline-flex items-center bg-white border border-gray-300 rounded-md px-3 md:px-4 py-2 gap-2 cursor-pointer hover:bg-gray-50 z-50 w-full sm:w-auto justify-between sm:justify-start"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      width="14"
                      height="17"
                      viewBox="0 0 16 19"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="md:w-4 md:h-[19px]"
                    >
                      <path
                        d="M10.0011 9.02539V16.9054C10.0411 17.2054 9.94111 17.5254 9.71111 17.7354C9.61859 17.8281 9.50871 17.9016 9.38773 17.9518C9.26676 18.002 9.13708 18.0278 9.00611 18.0278C8.87514 18.0278 8.74546 18.002 8.62448 17.9518C8.50351 17.9016 8.39362 17.8281 8.30111 17.7354L6.29111 15.7254C6.18211 15.6187 6.09922 15.4883 6.04892 15.3443C5.99861 15.2004 5.98225 15.0467 6.00111 14.8954V9.02539H5.97111L0.211108 1.64539C0.0487158 1.43692 -0.0245586 1.17265 0.00729555 0.910321C0.0391497 0.647992 0.173543 0.408937 0.381108 0.245391C0.571108 0.105391 0.781108 0.0253906 1.00111 0.0253906H15.0011C15.2211 0.0253906 15.4311 0.105391 15.6211 0.245391C15.8287 0.408937 15.9631 0.647992 15.9949 0.910321C16.0268 1.17265 15.9535 1.43692 15.7911 1.64539L10.0311 9.02539H10.0011Z"
                        fill="#9C0000"
                      />
                    </svg>
                    <span className="text-xs md:text-sm font-jakarta truncate">
                      {brands.find((brand) => brand.id === selectedBrand)?.name ||
                        "Pilih Brand"}
                    </span>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-transform flex-shrink-0 md:w-4 md:h-4 ${isDropdownOpen ? "rotate-180" : ""}`}
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

                {isDropdownOpen && (
                  <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200">
                    {brands.map((brand) => (
                      <div
                        key={brand.id}
                        className={`px-4 py-2 text-xs md:text-sm cursor-pointer hover:bg-gray-100 ${selectedBrand === brand.id
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {outletsLoading ? (
              <div className="col-span-1 md:col-span-2 py-10 text-center">
                <p className="text-gray-500 font-medium">Memuat outlet...</p>
              </div>
            ) : outlets.length > 0 ? (
              outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="bg-[#F7F7F7F8] rounded-lg overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 h-48 sm:h-auto px-3 py-4 sm:px-4 sm:py-6">
                      <img
                        src={getImageUrl(outlet.image, "/images/outlet.png")}
                        alt={outlet.nama}
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/images/outlet.png";
                        }}
                      />
                    </div>

                    <div className="w-full sm:w-2/3 p-3 sm:p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-runestars font-bold text-xl sm:text-2xl lg:text-3xl text-gray-800 mb-2">
                          {outlet.nama}
                        </h3>
                        <p className="text-xs text-gray-500 font-jakarta mb-2">
                          {outlet.brand.nama}
                        </p>

                        <div className="flex items-start mb-3">
                          <svg
                            width="14"
                            height="18"
                            viewBox="0 0 16 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-2 mt-1 flex-shrink-0 w-3 h-4 sm:w-4 sm:h-5"
                          >
                            <path
                              d="M6.32444 18.7368C6.86311 19.187 7.42489 19.5985 8 20C8.57635 19.6038 9.1354 19.1823 9.67556 18.7368C10.576 17.988 11.4234 17.176 12.2116 16.3068C14.0284 14.2946 16 11.3775 16 8.103C16 7.0389 15.7931 5.98522 15.391 5.00211C14.989 4.01901 14.3997 3.12575 13.6569 2.37331C12.914 1.62088 12.0321 1.02402 11.0615 0.616804C10.0909 0.20959 9.05058 0 8 0C6.94943 0 5.90914 0.20959 4.93853 0.616804C3.96793 1.02402 3.08601 1.62088 2.34315 2.37331C1.60028 3.12575 1.011 4.01901 0.608964 5.00211C0.206926 5.98522 -1.56548e-08 7.0389 0 8.103C0 11.3775 1.97156 14.2937 3.78844 16.3068C4.57655 17.1763 5.42397 17.9877 6.32444 18.7368ZM8 11.0291C7.23382 11.0291 6.49902 10.7208 5.95725 10.1721C5.41548 9.6233 5.11111 8.87904 5.11111 8.103C5.11111 7.32695 5.41548 6.58269 5.95725 6.03395C6.49902 5.4852 7.23382 5.17692 8 5.17692C8.76618 5.17692 9.50098 5.4852 10.0428 6.03395C10.5845 6.58269 10.8889 7.32695 10.8889 8.103C10.8889 8.87904 10.5845 9.6233 10.0428 10.1721C9.50098 10.7208 8.76618 11.0291 8 11.0291Z"
                              fill="#FFB835"
                            />
                          </svg>
                          <p className="text-xs sm:text-sm text-gray-600 font-jakarta leading-relaxed">
                            {outlet.lokasi}
                          </p>
                        </div>

                        <div className="flex items-center mb-3 sm:mb-4">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-2 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4"
                          >
                            <path
                              d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 14.4C4.41766 14.4 1.6 11.5823 1.6 8C1.6 4.41766 4.41766 1.6 8 1.6C11.5823 1.6 14.4 4.41766 14.4 8C14.4 11.5823 11.5823 14.4 8 14.4ZM8.8 4H7.2V8.8L11.2 11.2L12 9.92L8.8 8V4Z"
                              fill="#FFB835"
                            />
                          </svg>
                          <p className="text-xs sm:text-sm text-gray-600 font-jakarta">
                            {outlet.jamOperasional}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {outlet.whatsappUrl && (
                          <a
                            href={outlet.whatsappUrl.startsWith('http') ? outlet.whatsappUrl : `https://${outlet.whatsappUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#9C0000] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-jakarta font-medium hover:bg-[#7A0000] transition-colors w-full sm:w-auto text-center"
                          >
                            Reservasi Di sini
                          </a>
                        )}
                        {outlet.googleMapsLink && (
                          <a
                            href={outlet.googleMapsLink.startsWith('http') ? outlet.googleMapsLink : `https://${outlet.googleMapsLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9C0000] hover:underline px-3 py-2 sm:px-4 sm:py-2 rounded-md font-jakarta font-medium transition-colors flex items-center justify-center sm:justify-start gap-1 text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Lihat di Maps
                            <svg
                              className="ml-1 sm:ml-2"
                              width="16"
                              height="12"
                              viewBox="0 0 18 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 7.02637L17 7.02637M17 7.02637L11 13.0264M17 7.02637L11 1.02637"
                                stroke="#9C0000"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 py-10 text-center">
                <p className="text-gray-500 font-medium">
                  Tidak ada outlet tersedia untuk brand ini saat ini.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#F7F7F7] py-20 w-full relative">
          <div className="absolute right-0 top-0 hidden md:block">
            <svg
              width="205"
              height="298"
              viewBox="0 0 205 298"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M367.758 221.883C326.907 207.765 260.055 192.258 206.104 197.649M206.104 197.649C167.338 201.523 135.232 216.187 124.219 249.909C96.827 333.779 215.28 280.158 206.104 197.649ZM206.104 197.649C204.25 180.977 197.185 163.126 182.653 144.992C113.493 58.6849 34.8059 18.7585 5.01042 5.59044"
                stroke="#E0E0E0"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="absolute right-1/12 top-1/12 hidden md:block">
            <svg
              width="51"
              height="51"
              viewBox="0 0 51 51"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.03047 9.06456C-1.94401 4.63935 3.14854 -0.746291 7.7331 1.97616L22.2053 10.5702C23.8655 11.5561 25.945 11.4979 27.5476 10.4207L41.5167 1.03114C45.9419 -1.94333 51.3276 3.14921 48.6051 7.73377L40.0111 22.206C39.0252 23.8662 39.0834 25.9457 40.1606 27.5482L49.5502 41.5174C52.5246 45.9426 47.4321 51.3283 42.8475 48.6058L28.3753 40.0118C26.7151 39.0259 24.6356 39.0841 23.0331 40.1612L9.06388 49.5508C4.63868 52.5253 -0.746966 47.4328 1.97548 42.8482L10.5695 28.376C11.5554 26.7157 11.4972 24.6363 10.4201 23.0337L1.03047 9.06456Z"
                fill="#E0E0E0"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-y-4 items-center justify-center w-full mx-auto max-w-xl text-center mb-16">
            <img src={vectorLine} alt="Decorative line" className="w-16 h-5" />
            <h2 className="font-runestars">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-4xl md:text-5xl text-white whitespace-nowrap">
                TIM KAMI
              </span>
            </h2>
            <p className="font-jakarta font-medium ">
              Bekerja bersama untuk menghadirkan pengalaman kuliner terbaik
            </p>
          </div>

          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap justify-center gap-8">
              {teamMembers.map((member) => (
                <TeamCard
                  key={member.id}
                  id={member.id}
                  name={member.nama}
                  position={member.title}
                  image={getImageUrl(member.image, "/images/placeholder.svg")}
                  linkedinUrl={member.linkedinUrl}
                  instagramUrl={member.instagramUrl}
                />
              ))}
            </div>
          </div>
        </div>
    </section>
  );
}

export default Home;