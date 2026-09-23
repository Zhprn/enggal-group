import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import IndonesiaMap from "./IndonesiaMap";
import { apiClient, API_BASE_URL } from "../lib/api-client";

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

type Outlet = {
  id: string;
  nama: string;
  jamOperasional: string;
  lokasi: string;
  image: string;
  provinsi: string;
  googleMapsLink: string;
  whatsappUrl: string;
  brandId: string;
  brand: {
    id: string;
    nama: string;
  };
};

type OutletListMeta = {
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

async function fetchOutlets() {
  const response = await apiClient.get<Outlet[], OutletListMeta>(
    `/outlet?page=1&limit=100`
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

const InteractiveMap = () => {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Fetch brands and outlets
  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchBrands()
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => fetchOutlets()
  });

  const brands = brandsData?.data ?? [];
  const outlets = outletsData?.data ?? [];

  const handleBrandClick = (brandId: string) => {
    setActiveBrand(activeBrand === brandId ? null : brandId);
    setSelectedRegions([]);
  };

  const handleRegionClick = (regionId: string) => {
    setSelectedRegions(prev =>
      prev.includes(regionId) ? [] : [regionId]
    );
  };

  const shouldShowBrand = (brandId: string) => {
    return activeBrand === null || activeBrand === brandId;
  };

  // Get outlet count for a brand
  const getOutletCount = (brandId: string) => {
    return outlets.filter(outlet => outlet.brandId === brandId).length;
  };

  // Brand position mapping - maps brand name (lowercase, no spaces) to position classes
  const brandPositions: Record<string, { position: string; size: string }> = {
    "baksomalangenggal": { position: "absolute bottom-0 left-1/4", size: "w-16 h-16" },
    "kebabzabbab": { position: "absolute bottom-1/5 left-10", size: "w-20 h-20" },
    "lapaurangkapau": { position: "absolute bottom-1/2 -left-4", size: "w-20 h-20" },
    "soerabibandungenhaii": { position: "absolute top-0 right-2/3", size: "w-14 h-14" },
    "bebeksawahan": { position: "absolute top-1/4 right-1/2", size: "w-12 h-12" },
    "baksoraja": { position: "absolute top-0 right-1/4", size: "w-16 h-16" },
    "warungkondang": { position: "absolute bottom-3/12 right-2/5", size: "w-16 h-16" },
    "warkopputraagam": { position: "absolute -bottom-16 right-1/5", size: "w-32" },
    "sarapanpagiambunsuri": { position: "absolute bottom-1/3 -right-10", size: "w-20 h-20" },
    "yongbengkalis": { position: "absolute bottom-1/12 right-3", size: "w-10 h-10" },
  };

  // Normalize brand name for matching
  const normalizeBrandName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '');
  };

  // Generate random position for brands not in brandPositions
  const getRandomPosition = (brandId: string): { position: string; size: string } => {
    // Use brandId as seed for consistent random positions per brand
    const seed = brandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (Math.sin(seed) * 10000) % 1;

    const positions = [
      "absolute top-1/4 left-1/3",
      "absolute top-1/3 right-1/3",
      "absolute bottom-1/3 left-1/4",
      "absolute bottom-1/4 right-1/4",
      "absolute top-2/3 left-1/2",
      "absolute bottom-2/3 right-1/3",
      "absolute top-1/2 left-1/5",
      "absolute bottom-1/2 right-1/5",
    ];

    const positionIndex = Math.floor(Math.abs(random) * positions.length);

    return {
      position: positions[positionIndex],
      size: "w-10 h-10"
    };
  };

  // Get regions to display pins for based on active brand
  const regionsToShowPins: string[] = activeBrand
    ? outlets
      .filter(outlet => outlet.brandId === activeBrand)
      .map(outlet => outlet.provinsi)
      .filter((provinsi, index, self) => self.indexOf(provinsi) === index) // Remove duplicates
    : [];

  // Create a mapping of region IDs to outlet data
  const regionOutlets: Record<string, Array<{ id: string; nama: string; googleMapsLink: string; image: string }>> = {};
  if (activeBrand) {
    outlets
      .filter(outlet => outlet.brandId === activeBrand)
      .forEach(outlet => {
        if (!regionOutlets[outlet.provinsi]) {
          regionOutlets[outlet.provinsi] = [];
        }
        // Ensure googleMapsLink is a complete URL
        const fullGoogleMapsLink = outlet.googleMapsLink.startsWith('http')
          ? outlet.googleMapsLink
          : `${API_BASE_URL}${outlet.googleMapsLink}`;

        regionOutlets[outlet.provinsi].push({
          id: outlet.id,
          nama: outlet.nama,
          googleMapsLink: fullGoogleMapsLink,
          image: outlet.image,
        });
      });
  }

  return (
    <div className=" inline-block w-5/6 overflow-visible">
      <div className="relative">
        {/* Using inline SVG component instead of img tag - this allows us to add IDs to regions */}
        <IndonesiaMap
          activeRegions={selectedRegions}
          clickedRegions={regionsToShowPins}
          onRegionClick={handleRegionClick}
          regionOutlets={regionOutlets}
        />
        {brands.map((brand) => {
          const normalizedName = normalizeBrandName(brand.nama);
          const brandConfig = brandPositions[normalizedName] || getRandomPosition(brand.id);

          const outletCount = getOutletCount(brand.id);

          return shouldShowBrand(brand.id) ? (
            <div
              key={brand.id}
              className={`${brandConfig.position} cursor-pointer z-10`}
              onClick={() => handleBrandClick(brand.id)}
            >
              <div className="relative flex flex-col items-center">
                <img
                  src={`${API_BASE_URL}${brand.logo}`}
                  className={brandConfig.size}
                  alt={brand.nama}
                />
                {activeBrand === brand.id && (
                  <span className="absolute top-full mt-2 px-2 py-1 text-center">
                    <span className="text-shadow-[0_0_6px_#6E0112,1px_0_0_#6E0112,2px_0_0_#6E0112,-1px_0_0_#6E0112,-2px_0_0_#6E0112,0_1px_0_#6E0112,0_2px_0_#6E0112,0_-1px_0_#6E0112,0_-2px_0_#6E0112,1px_1px_0_#6E0112,2px_2px_0_#6E0112,-1px_-1px_0_#6E0112,-2px_-2px_0_#6E0112,1px_-1px_0_#6E0112,2px_-2px_0_#6E0112,-1px_1px_0_#6E0112,-2px_2px_0_#6E0112] font-extrabold text-base text-white leading-tight">
                      {outletCount}
                    </span>
                    <br />
                    <span className="text-[#A16800] font-jakarta font-medium">
                      OUTLET
                    </span>
                  </span>
                )}
              </div>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
};

export default InteractiveMap;
