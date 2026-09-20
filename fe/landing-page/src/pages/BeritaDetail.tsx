import { useMemo } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "../lib/api-client";
import { useSeoMeta } from "../hooks/useSeoMeta";

type BeritaItem = {
  id: string;
  slug: string;
  judul: string;
  image?: string | null;
  createdDate: string;
  penulis: string;
  content: string;
};

type BeritaListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type PromoItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  berlakuHingga: string;
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

async function fetchBeritaBySlug(slug: string) {
  const response = await apiClient.get<BeritaItem>(`/berita/${slug}`);
  return response.data;
}

async function fetchRelatedBerita(currentSlug: string) {
  const response = await apiClient.get<BeritaItem[], BeritaListMeta>(
    `/berita?page=1&limit=9`,
  );

  const items = response.data ?? [];
  return items.filter((item) => item.slug !== currentSlug);
}

async function fetchPromoHighlights() {
  const response = await apiClient.get<PromoItem[], PromoListMeta>(
    `/promo?page=1&limit=3`,
  );

  return response.data ?? [];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const datePart = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasExplicitTime =
    date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;

  return hasExplicitTime ? `${datePart}` : datePart;
}

function getImageUrl(path?: string | null) {
  if (!path) {
    return "/images/berita_1.png";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedPath}`;
}

function getExcerpt(text: string, maxLength = 140) {
  const sanitized = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  if (!sanitized) {
    return "";
  }

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxLength).trimEnd()}...`;
}

function buildContentHtml(content?: string) {
  if (!content) {
    return "";
  }

  const hasHtmlTag = /<\/?[a-z][^>]*>/i.test(content);
  if (hasHtmlTag) {
    return content;
  }

  return content.replace(/\n/g, "<br />");
}

function BeritaDetail() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: berita,
    isLoading: beritaLoading,
    error: beritaError,
  } = useQuery({
    queryKey: ["berita", slug],
    queryFn: () => fetchBeritaBySlug(slug!),
    enabled: !!slug,
  });

  const {
    data: relatedArticles = [],
    isLoading: relatedLoading,
    error: relatedError,
  } = useQuery({
    queryKey: ["berita", "related", slug],
    queryFn: () => fetchRelatedBerita(slug!),
    enabled: !!slug,
  });

  const { data: promoHighlights = [] } = useQuery({
    queryKey: ["berita", "promo-highlights"],
    queryFn: fetchPromoHighlights,
  });

  // SEO Meta Tags
  useSeoMeta({
    title: berita?.judul,
    description: berita ? getExcerpt(berita.content, 160) : undefined,
    image: berita ? getImageUrl(berita.image) : undefined,
    url: slug ? `/berita/${slug}` : undefined,
    publishedTime: berita?.createdDate,
    author: berita?.penulis || "Enggal Group",
    keywords: "berita, enggal group, berita terbaru, berita terkini",
  });

  const errorMessage =
    beritaError instanceof Error
      ? beritaError.message
      : "Berita tidak ditemukan.";

  const relatedMessage =
    relatedError instanceof Error
      ? relatedError.message
      : "Belum ada berita lainnya.";

  const { primaryRelated, additionalArticles } = useMemo(() => {
    const primary = relatedArticles.slice(0, 3);
    const additional = relatedArticles.slice(3, 9);
    return {
      primaryRelated: primary,
      additionalArticles: additional,
    };
  }, [relatedArticles]);

  const handleNavigate = (targetSlug: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.href = `/berita/${targetSlug}`;
  };

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Berita tidak ditemukan.</p>
      </div>
    );
  }

  if (beritaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Memuat detail berita...</p>
      </div>
    );
  }

  if (!berita || beritaError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-medium">{errorMessage}</p>
      </div>
    );
  }

  const formattedDateTime = formatDateTime(berita.createdDate);
  const contentHtml = buildContentHtml(berita.content);

  return (
    <div className="font-jakarta">
      <div className="mb-9">
        <div className="h-[150px] md:h-[300px] relative">
          <div className="absolute inset-0 bg-[url('/images/dots_berita.png')] bg-center bg-cover bg-repeat-x overflow-hidden">
            <div className="absolute top-0 right-0 hidden md:block">
              <svg
                width="229"
                height="269"
                viewBox="0 0 229 269"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M293 198.032C238.965 176.658 127.999 152.286 116.412 225.797C101.928 317.686 223.368 227.12 149.279 129.942C90.0074 52.2004 28.2108 16.6789 5.00001 5"
                  stroke="#FFB835"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="absolute bottom-1/4 right-4 hidden md:block">
              <svg
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.639 1.20521C15.909 -0.339024 18.3912 0.91164 17.9059 2.8513L16.4115 8.82438C16.2358 9.52679 16.4802 10.2676 17.0394 10.7276L21.7948 14.6387C23.339 15.9088 22.0884 18.391 20.1487 17.9057L14.1756 16.4113C13.4732 16.2355 12.7324 16.4799 12.2724 17.0391L8.36128 21.7945C7.0912 23.3388 4.609 22.0881 5.09429 20.1485L6.58874 14.1754C6.76448 13.473 6.52007 12.7321 5.96086 12.2722L1.20545 8.36104C-0.338785 7.09096 0.911879 4.60876 2.85154 5.09406L8.82462 6.5885C9.52703 6.76424 10.2679 6.51984 10.7278 5.96062L14.639 1.20521Z"
                  fill="#9C0000"
                />
              </svg>
            </div>
            <div className="absolute bottom-1/2 right-24 hidden md:block">
              <svg
                width="34"
                height="34"
                viewBox="0 0 34 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.25928 3.10019C8.91785 0.164274 12.7951 -1.19565 14.3623 1.31031L19.1887 9.02728C19.7563 9.93477 20.7956 10.4344 21.8588 10.3107L30.8998 9.25928C33.8357 8.91785 35.1956 12.7951 32.6897 14.3623L24.9727 19.1887C24.0652 19.7563 23.5656 20.7956 23.6893 21.8588L24.7407 30.8998C25.0822 33.8357 21.2049 35.1956 19.6377 32.6897L14.8113 24.9727C14.2437 24.0652 13.2044 23.5656 12.1412 23.6893L3.10019 24.7407C0.164274 25.0822 -1.19565 21.2049 1.31031 19.6377L9.02728 14.8113C9.93477 14.2437 10.4344 13.2044 10.3107 12.1412L9.25928 3.10019Z"
                  fill="#9C0000"
                />
              </svg>
            </div>
            <div className="max-w-4xl mx-auto relative h-full flex justify-between items-center">
              <div className="px-4 md:px-0 ">
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
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="relative max-w-[450px]">
                  <h2 className="font-runestars mb-6 relative">
                    <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-bold text-3xl md:text-6xl text-[#FFB835] font-runestars whitespace-nowrap">
                      Berita
                    </span>
                    <div className="absolute -top-4 -right-10 w-[39.95px] h-[39.95px] rotate-[30deg] hidden md:block">
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
              </div>
              <img
                src="/images/berita_cover.webp"
                alt="berita"
                className="w-[300px] hidden md:block"
              />
            </div>
          </div>
        </div>

        <div className="flex h-2 w-full">
          <div className="w-1/3 bg-[#9C0000]"></div>
          <div className="w-1/3 bg-[#FFB835]"></div>
          <div className="w-1/3 bg-[#6E0112]"></div>
        </div>
      </div>

      <div className="container px-4 md:px-20 mx-auto py-8 md:py-12">
        <div className="flex items-center gap-2 md:gap-4 lg:gap-10 mb-8 md:mb-12">
          <a href="/" className="text-[#727272] text-sm md:text-base">
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
          <a href="/berita" className="text-[#727272] text-sm md:text-base">
            Berita
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
          <p className="rounded-sm bg-[#9C0000] p-2 font-medium text-white text-sm md:text-base">
            Buka Berita
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          <div className="w-full flex-1">
            <img
              src={getImageUrl(berita.image)}
              alt={berita.judul}
              className="mx-auto w-full object-cover rounded-md max-h-full aspect-[4/3]"
            />
            <div className="my-9 flex flex-col gap-y-8">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-7">
                <div className="bg-[#9C0000] py-1 px-2 text-xs md:text-sm font-medium text-white w-fit">
                  {formattedDateTime}
                </div>
                <div className="hidden md:block h-4 w-[1px] bg-[#878787]" />
                <div className="font-medium text-xs md:text-sm tracking-[-2%] text-[#878787]">
                  Penulis: {berita.penulis || "Enggal Group"}
                </div>
              </div>
              <div>
                <h1 className="mb-4 lg:mb-10 text-2xl md:text-3xl font-bold text-[#1E1E1E]">
                  {berita.judul}
                </h1>
                <div className="berita-content">
                  <style>{`
                    .berita-content ul {
                      list-style-type: disc;
                      padding-left: 1.25rem;
                      margin-bottom: 1rem;
                    }
                    .berita-content ol {
                      list-style-type: decimal;
                      padding-left: 1.25rem;
                      margin-bottom: 1rem;
                    }
                    .berita-content li {
                      margin-bottom: 0.25rem;
                    }
                    .berita-content strong {
                      font-weight: bold;
                    }
                    .berita-content a {
                      color: #9C0000;
                      text-decoration: underline;
                    }
                    .berita-content h1 {
                      font-size: 1.875rem;
                      font-weight: bold;
                      margin-bottom: 1rem;
                      margin-top: 1.5rem;
                      color: #1E1E1E;
                    }
                    .berita-content h2 {
                      font-size: 1.5rem;
                      font-weight: bold;
                      margin-bottom: 0.875rem;
                      margin-top: 1.25rem;
                      color: #1E1E1E;
                    }
                    .berita-content h3 {
                      font-size: 1.25rem;
                      font-weight: bold;
                      margin-bottom: 0.75rem;
                      margin-top: 1rem;
                      color: #1E1E1E;
                    }
                    .berita-content h4, .berita-content h5, .berita-content h6 {
                      font-weight: bold;
                      margin-bottom: 0.625rem;
                      margin-top: 0.875rem;
                      color: #1E1E1E;
                    }
                    .berita-content p {
                      margin-bottom: 1rem;
                      line-height: 1.6;
                    }
                  `}</style>
                  <div
                    className="text-justify font-medium text-sm md:text-base tracking-[0.5%] leading-relaxed md:leading-[30px] text-[#4F4F4F]"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="relative w-full lg:max-w-xs">
            <div>
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
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2 className="font-runestars relative mb-6">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] whitespace-nowrap text-3xl font-extrabold text-white md:text-4xl">
                  BERITA LAINNYA!
                </span>
              </h2>

              {relatedLoading ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Memuat berita terkait...
                </div>
              ) : primaryRelated.length > 0 ? (
                <>
                  <div className="hidden md:flex flex-col divide-y divide-[#C1C1C1]">
                    {primaryRelated.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex gap-4 py-4 text-left first:pt-0 last:pb-0"
                        onClick={() => handleNavigate(item.slug)}
                      >
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.judul}
                          className="h-[100px] w-[100px] rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm text-[#9C0000]">
                            {formatDateTime(item.createdDate)}
                          </p>
                          <p className="text-sm font-semibold text-[#585858] line-clamp-2">
                            {item.judul}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="md:hidden flex flex-col gap-y-4">
                    {primaryRelated.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="bg-[#F7F7F7] rounded-lg overflow-hidden flex p-4 items-center gap-3 text-left"
                        onClick={() => handleNavigate(item.slug)}
                      >
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.judul}
                          className="w-[100px] h-[80px] md:w-[150px] md:h-[120px] object-cover rounded-md"
                        />
                        <div className="flex flex-col gap-y-2">
                          <div className="text-[#9C0000] text-sm font-medium mb-1">
                            {formatDateTime(item.createdDate)}
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-2">
                            {item.judul}
                          </h3>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#9B9B9B]">{relatedMessage}</p>
              )}
            </div>
          </aside>
        </div>

        <section className="mt-10 mb-16 hidden md:block">
          <div className="mb-8 ">
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
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="font-runestars relative mb-6">
              <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] whitespace-nowrap text-3xl font-extrabold text-white md:text-4xl">
                REKOMENDASI UNTUKMU
              </span>
            </h2>
          </div>
          {relatedLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Memuat berita lainnya...
            </div>
          ) : (
            <>
              {additionalArticles.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 md:gap-y-16">
                  {additionalArticles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      className="overflow-hidden rounded-lg bg-[#F7F7F7] shadow-sm text-left transition-transform hover:-translate-y-1"
                      onClick={() => handleNavigate(article.slug)}
                    >
                      <div className="m-4">
                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.judul}
                            className="h-[200px] w-full object-cover sm:h-[250px] md:h-[300px]"
                          />
                          <div className="absolute bottom-0 left-0 bg-[#9C0000] p-2 text-xs font-medium text-white md:p-2.5 md:text-sm">
                            {formatDateTime(article.createdDate)}
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-3 text-base font-bold text-[#1E1E1E] md:mb-6 md:text-lg line-clamp-2">
                          {article.judul}
                        </h3>
                        <p className="text-sm text-[#9B9B9B]">
                          {getExcerpt(article.content, 120)}
                          <span className="ml-1 font-bold text-[#9C0000]">
                            Baca Selengkapnya
                          </span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-[#9B9B9B]">
                  Tidak ada berita lainnya.
                </div>
              )}

              <div className="mt-12 bg-[#F7F7F7] p-4 rounded-lg md:hidden">
                <div className="mb-8">
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
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h2 className="font-runestars relative mb-6">
                    <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] whitespace-nowrap text-3xl font-extrabold text-white md:text-4xl">
                      Promo
                    </span>
                  </h2>
                </div>
                <div className="flex flex-col divide-y divide-[#C1C1C1]">
                  {promoHighlights.length > 0 ? (
                    promoHighlights.slice(0, 3).map((promo) => (
                      <a
                        key={promo.id}
                        href={`/promo/${promo.id}`}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <img
                          src={`${promo.image}`}
                          alt={promo.title}
                          className="h-[80px] w-[60px] rounded-lg object-cover"
                        />
                        <div className="flex flex-col gap-y-2">
                          <p className="text-sm font-bold">{promo.title}</p>
                          <p className="text-sm text-[#9B9B9B] line-clamp-2">
                            {promo.subtitle}
                          </p>
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="py-4 text-sm text-[#9B9B9B]">
                      Promo belum tersedia saat ini.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default BeritaDetail;
