import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "../lib/api-client";

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

async function fetchBeritaList(page: number, limit: number) {
  const response = await apiClient.get<BeritaItem[], BeritaListMeta>(
    `/berita?page=${page}&limit=${limit}`,
  );

  const items = response.data ?? [];
  const meta = response.meta ?? {};

  return {
    data: items,
    meta: {
      page: meta.page ?? page,
      limit: meta.limit ?? limit,
      total: meta.total ?? items.length,
      totalPages: meta.totalPages ?? (items.length === 0 ? 0 : Math.ceil((meta.total ?? items.length) / limit)),
    },
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getImageUrl(path?: string | null) {
  if (!path) {
    return "/images/berita_1.png";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
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

function Berita() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);

  const { data: beritaList, isLoading, isError, error } = useQuery({
    queryKey: ["berita", "list", page, limit],
    queryFn: () => fetchBeritaList(page, limit),
  });

  const items = beritaList?.data ?? [];
  const meta = beritaList?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const heroBerita = items[0];
  const sidebarArticles = items.slice(1, 4);
  const gridArticles = items.slice(4);
  const heroExcerpt = heroBerita ? getExcerpt(heroBerita.content, 160) : "";
  const errorMessage =
    error instanceof Error ? error.message : "Gagal memuat berita.";

  const handleNavigate = (slug: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.href = `/berita/${slug}`;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  return (
    <section className="relative bg-[#F9F9F9]">
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
            <div className="max-w-6xl mx-auto relative h-full flex justify-between items-center">
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
                className="w-[200px] md:w-[300px]"
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

      <div className="container px-4 md:px-20 mx-auto py-8 font-jakarta">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {isLoading ? (
            <div className="lg:col-span-3 py-10 text-center">
              <p className="text-gray-500 font-medium">Memuat berita...</p>
            </div>
          ) : isError ? (
            <div className="lg:col-span-3 py-10 text-center">
              <p className="text-gray-500 font-medium">{errorMessage}</p>
            </div>
          ) : heroBerita ? (
            <>
              <div
                className="lg:col-span-2 bg-[#F7F7F7] rounded-lg overflow-hidden shadow-sm cursor-pointer"
                onClick={() => handleNavigate(heroBerita.slug)}
              >
                <div className="relative">
                  <img
                    src={getImageUrl(heroBerita.image)}
                    alt={heroBerita.judul}
                    className="w-full h-[250px] md:h-[400px] object-cover"
                  />
                  <div className="absolute bottom-0 left-0 bg-[#9C0000] text-white p-2.5 font-medium text-sm md:text-base">
                    {formatDate(heroBerita.createdDate)}
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <h2 className="text-base md:text-xl text-[#1E1E1E] font-bold mb-6">
                    {heroBerita.judul}
                  </h2>
                  <p className="text-[#9B9B9B] mb-4 md:mb-8 truncate">
                    {heroExcerpt || "Konten akan segera hadir."}{" "}
                    <span>
                      <a
                        href={`/berita/${heroBerita.slug}`}
                        className="text-[#9C0000] font-bold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Baca Selengkapnya
                      </a>
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {sidebarArticles.length > 0 ? (
                  sidebarArticles.map((article) => (
                    <div
                      key={article.id}
                      className="bg-[#F7F7F7] rounded-lg overflow-hidden shadow-sm flex p-4 items-center md:items-start gap-2 md:gap-4 cursor-pointer"
                      onClick={() => handleNavigate(article.slug)}
                    >
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.judul}
                        className="w-[100px] h-[80px] md:w-[150px] md:h-[120px] object-cover rounded-md"
                      />
                      <div className="flex flex-col gap-y-2">
                        <div className="text-[#9C0000] text-sm font-medium mb-1">
                          {formatDate(article.createdDate)}
                        </div>
                        <h3 className="font-semibold text-sm md:text-base line-clamp-2">
                          {article.judul}
                        </h3>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#F7F7F7] rounded-lg overflow-hidden shadow-sm p-6 text-center text-sm text-gray-500">
                    Belum ada berita lainnya.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="lg:col-span-3 py-10 text-center">
              <p className="text-gray-500 font-medium">
                Belum ada berita yang dapat ditampilkan.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
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
              <h2 className="font-runestars relative">
                <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-3xl md:text-4xl text-white whitespace-nowrap">
                  BERITA ENGGAL
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#F7F7F7] px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 font-medium">Tampilkan:</span>
                <select
                  value={limit}
                  onChange={handleLimitChange}
                  className="bg-transparent text-xs font-semibold text-[#1E1E1E] focus:outline-none cursor-pointer"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-[#F7F7F7] p-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded text-sm font-semibold transition text-gray-600 hover:bg-[#9C0000] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Halaman sebelumnya"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <div key={p} className="flex items-center">
                        {showEllipsis && (
                          <span className="w-6 text-center text-gray-400 text-xs select-none">
                            ...
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 rounded text-xs font-semibold transition ${
                            page === p
                              ? "bg-[#9C0000] text-white shadow-sm"
                              : "text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded text-sm font-semibold transition text-gray-600 hover:bg-[#9C0000] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Halaman selanjutnya"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          <div className="my-10 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-y-16">
            {isLoading ? (
              <div className="col-span-2 lg:col-span-3 py-10 text-center">
                <p className="text-gray-500 font-medium">Memuat berita...</p>
              </div>
            ) : isError ? (
              <div className="col-span-2 lg:col-span-3 py-10 text-center">
                <p className="text-gray-500 font-medium">{errorMessage}</p>
              </div>
            ) : gridArticles.length > 0 ? (
              gridArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-[#F7F7F7] rounded-lg overflow-hidden shadow-sm cursor-pointer transition-transform"
                  onClick={() => handleNavigate(article.slug)}
                >
                  <div className="m-3 md:m-4">
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.judul}
                        className="w-full h-[150px] md:h-[300px] object-cover"
                      />
                      <div className="absolute bottom-0 left-0 bg-[#9C0000] text-white p-2 md:p-2.5 font-medium text-xs md:text-sm">
                        {formatDate(article.createdDate)}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 md:p-4">
                    <h2 className="text-[#1E1E1E] font-bold text-sm md:text-lg mb-3 md:mb-6 md:line-clamp-2">
                      {article.judul}
                    </h2>
                    <div className="text-[#9B9B9B] text-xs md:text-base flex items-center w-full">
                      <span className="flex-1 min-w-0 truncate">
                        {getExcerpt(article.content, 80) ||
                          "Konten akan segera hadir."}
                      </span>
                      <a
                        href={`/berita/${article.slug}`}
                        className="text-[#9C0000] font-bold hover:underline ml-2 flex-shrink-0 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Baca Selengkapnya
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 lg:col-span-3 py-10 text-center">
                <p className="text-gray-500 font-medium">
                  Tidak ada berita lainnya.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Berita;