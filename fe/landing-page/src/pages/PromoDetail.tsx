import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "../lib/api-client";
import PromoCard from "../components/PromoCard";

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

async function fetchPromoById(id: string) {
  const response = await apiClient.get<Promo>(`/promo/${id}`);
  return response.data;
}

async function fetchRecommendedPromos(currentId: string) {
  const response = await apiClient.get<Promo[], PromoListMeta>(
    `/promo?page=1&limit=6`,
  );
  const items = response.data ?? [];
  // Filter out current promo
  return items.filter((promo) => promo.id !== currentId).slice(0, 6);
}

function PromoDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: promo, isLoading: promoLoading, error: promoError } = useQuery({
    queryKey: ["promo", id],
    queryFn: () => fetchPromoById(id!),
    enabled: !!id,
  });

  const { data: recommendedPromos = [], isLoading: promosLoading } = useQuery({
    queryKey: ["recommended-promos", id],
    queryFn: () => fetchRecommendedPromos(id!),
    enabled: !!id,
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (promoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Memuat detail promo...</p>
      </div>
    );
  }

  if (promoError || !promo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-medium">Promo tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div>
      <div className="lg:flex h-2 w-full mb-6 md:mb-10 hidden">
        <div className="h-full w-1/3 bg-[#9C0000]" />
        <div className="h-full w-1/3 bg-[#FFB835]" />
        <div className="h-full w-1/3 bg-[#6E0112]" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col gap-y-6 md:gap-y-10 py-10">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 lg:gap-10">
          <a href="/" className="font-jakarta text-[#727272] text-sm md:text-base">
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
          <a href="/promo" className="font-jakarta text-[#727272] text-sm md:text-base">
            Promo
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
          <p className="font-jakarta text-white font-medium bg-[#9C0000] p-2 rounded-sm text-sm md:text-base">
            Detail Promo
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="flex w-full lg:w-auto flex-col gap-y-4 md:gap-y-6">
            <div className="bg-[#F7F7F7] px-4 py-4 md:py-6 rounded-lg w-full lg:max-w-sm">
              <img
                src={`${API_BASE_URL}${promo.image}`}
                alt={promo.title}
                className="w-full h-auto rounded-xl"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/400x350?text=Promo+Image";
                }}
              />
            </div>
            <div className="bg-[#FFB835] w-full flex items-center p-4 md:p-6 gap-4 md:gap-6 rounded-md">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 12V21.3333C24 22.0406 23.719 22.7189 23.219 23.219C22.7189 23.719 22.0406 24 21.3333 24H2.66667C1.95942 24 1.28115 23.719 0.781048 23.219C0.280951 22.7189 0 22.0406 0 21.3333V12H24ZM17.3333 0C17.687 0 18.0261 0.140476 18.2761 0.390524C18.5262 0.640573 18.6667 0.979711 18.6667 1.33333V2.66667H21.3333C22.0406 2.66667 22.7189 2.94762 23.219 3.44772C23.719 3.94781 24 4.62609 24 5.33333V9.33333H0V5.33333C0 4.62609 0.280951 3.94781 0.781048 3.44772C1.28115 2.94762 1.95942 2.66667 2.66667 2.66667H5.33333V1.33333C5.33333 0.979711 5.47381 0.640573 5.72386 0.390524C5.97391 0.140476 6.31305 0 6.66667 0C7.02029 0 7.35943 0.140476 7.60948 0.390524C7.85952 0.640573 8 0.979711 8 1.33333V2.66667H16V1.33333C16 0.979711 16.1405 0.640573 16.3905 0.390524C16.6406 0.140476 16.9797 0 17.3333 0Z"
                  fill="#9C0000"
                />
              </svg>
              <p className="font-jakarta text-[#9C0000] font-medium text-sm md:text-base">
                Berlaku Hingga <strong>{formatDate(promo.berlakuHingga)}</strong>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 w-full lg:w-2/3">
            <h2 className="font-runestars">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl md:text-4xl text-white">
                Promo {promo.brand.nama}
              </span>
            </h2>
            <h1 className="font-jakarta font-bold text-2xl md:text-4xl leading-snug max-w-2xl">
              {promo.title}
            </h1>
            <p className="text-[#9B9B9B] font-jakarta text-sm md:text-base">
              {promo.subtitle}
            </p>
            <div className="font-jakarta mt-6 md:mt-10 flex flex-col gap-y-6 md:gap-y-10">
              <div>
                <p className="font-bold mb-2 ">Deskripsi Promo</p>
                <div className="promo-content">
                  <style>{`
                    .promo-content ul {
                      list-style-type: disc;
                      padding-left: 1.25rem;
                      margin-bottom: 1rem;
                    }
                    .promo-content ol {
                      list-style-type: decimal;
                      padding-left: 1.25rem;
                      margin-bottom: 1rem;
                    }
                    .promo-content li {
                      margin-bottom: 0.25rem;
                    }
                    .promo-content strong {
                      font-weight: bold;
                    }
                    .promo-content a {
                      color: #9C0000;
                      text-decoration: underline;
                    }
                    .promo-content h1 {
                      font-size: 1.875rem;
                      font-weight: bold;
                      margin-bottom: 1rem;
                      margin-top: 1.5rem;
                      color: #1E1E1E;
                    }
                    .promo-content h2 {
                      font-size: 1.5rem;
                      font-weight: bold;
                      margin-bottom: 0.875rem;
                      margin-top: 1.25rem;
                      color: #1E1E1E;
                    }
                    .promo-content h3 {
                      font-size: 1.25rem;
                      font-weight: bold;
                      margin-bottom: 0.75rem;
                      margin-top: 1rem;
                      color: #1E1E1E;
                    }
                    .promo-content h4, .promo-content h5, .promo-content h6 {
                      font-weight: bold;
                      margin-bottom: 0.625rem;
                      margin-top: 0.875rem;
                      color: #1E1E1E;
                    }
                    .promo-content p {
                      margin-bottom: 1rem;
                      line-height: 1.6;
                    }
                  `}</style>
                  <div
                    className="text-[#1E1E1E] font-meidum text-justify tracking-wide leading-[28px] md:leading-[32px] text-sm md:text-base"
                    dangerouslySetInnerHTML={{ __html: promo.description }}
                  />
                </div>
              </div>
              <div>
                <p className="font-bold mb-2 ">Syarat & Ketentuan</p>
                <div className="promo-content">
                  <div
                    className="text-[#1E1E1E] font-meidum text-justify tracking-wide leading-[28px] md:leading-[32px] text-sm md:text-base"
                    dangerouslySetInnerHTML={{ __html: promo.syaratKetentuan }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="relative my-8 md:my-10">
            <div className="mb-2">
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
            <h2 className="font-runestars mb-6 relative">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl md:text-4xl text-white">
                Rekomendasi Promo lainnya!
              </span>
              <div className="absolute -top-4 left-1/3 w-[39.95px] h-[39.95px] rotate-[30deg] hidden lg:block">
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
            <p className="font-jakarta text-[#585858] text-sm md:text-base">
              Jangan lewatkan pilihan promo menarik yang sudah kami siapkan.
            </p>
          </div>
          <div className="flex flex-col gap-y-10 md:gap-y-16 my-10 md:my-16">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 lg:gap-x-20 gap-y-8 md:gap-y-16 relative z-10">
              {promosLoading ? (
                <div className="col-span-2 lg:col-span-3 py-10 text-center">
                  <p className="text-gray-500 font-medium">Memuat promo...</p>
                </div>
              ) : recommendedPromos.length > 0 ? (
                recommendedPromos.map((recommendedPromo) => (
                  <div
                    key={recommendedPromo.id}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/promo/${recommendedPromo.id}`)}
                  >
                    <PromoCard
                      id={recommendedPromo.id}
                      title={recommendedPromo.title}
                      description={recommendedPromo.subtitle}
                      validUntil={formatDate(recommendedPromo.berlakuHingga)}
                      image={`${API_BASE_URL}${recommendedPromo.image}`}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 lg:col-span-3 py-10 text-center">
                  <p className="text-gray-500 font-medium">Tidak ada promo lainnya tersedia saat ini.</p>
                </div>
              )}
            </div>
            <div className="mx-auto">
              <a
                className="bg-[#1E1E1E] rounded-xl py-3 md:py-4 px-5 md:px-6 font-jakarta text-white font-medium text-sm md:text-base"
                href="/promo"
              >
                Lihat Promo Lebih Lengkap
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromoDetail;
