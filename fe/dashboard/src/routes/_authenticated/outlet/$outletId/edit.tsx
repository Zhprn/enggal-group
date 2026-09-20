import * as React from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/outlet/$outletId/edit")({
  component: RouteComponent,
});

type OutletItem = {
  id: string;
  nama: string;
  brandId: string;
  provinsi: string;
  jamOperasional: string;
  lokasi: string;
  googleMapsLink: string;
  whatsappUrl?: string;
  image: string;
};

type BrandOption = {
  id: string;
  nama: string;
};

type BrandListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type ProvinsiOption = {
  id: string;
  nama: string;
  value: string;
}

const provinsiOptions: ProvinsiOption[] = [
  {
    id: "1",
    nama: "Jawa Barat",
    value: "jawa-barat",
  },
  {
    id: "2",
    nama: "Jawa Tengah",
    value: "jawa-tengah",
  },
  {
    id: "3",
    nama: "Jawa Timur",
    value: "jawa-timur",
  },
  {
    id: "4",
    nama: "Jawa Tengah",
    value: "jawa-tengah",
  },
  {
    id: "5",
    nama: "Madura",
    value: "madura",
  },
  {
    id: "6",
    nama: "Aceh",
    value: "aceh",
  },
  {
    id: "7",
    nama: "Sumatra Utara",
    value: "sumatra-utara",
  },
  {
    id: "8",
    nama: "Sumatra Barat",
    value: "sumatra-barat",
  },
  {
    id: "9",
    nama: "Riau",
    value: "riau",
  },
  {
    id: "10",
    nama: "Jambi",
    value: "jambi",
  },
  {
    id: "11",
    nama: "Sumatra Selatan",
    value: "sumatra-selatan",
  },
  {
    id: "12",
    nama: "Lampung",
    value: "lampung",
  },
  {
    id: "13",
    nama: "Banten",
    value: "banten",
  },
  {
    id: "14",
    nama: "Jakarta",
    value: "jakarta",
  },
  {
    id: "15",
    nama: "Kalimantan Barat",
    value: "kalimantan-barat",
  },
  {
    id: "16",
    nama: "Kalimantan Tengah",
    value: "kalimantan-tengah",
  },
  {
    id: "17",
    nama: "Kalimantan Timur",
    value: "kalimantan-timur",
  },
  {
    id: "18",
    nama: "Kalimantan Selatan",
    value: "kalimantan-selatan",
  },
  {
    id: "19",
    nama: "Nusa Tenggara Timur",
    value: "nusa-tenggara-timur",
  },
  {
    id: "20",
    nama: "Nusa Tenggara Barat",
    value: "nusa-tenggara-barat",
  },
  {
    id: "21",
    nama: "Bali",
    value: "bali",
  },
  {
    id: "22",
    nama: "Makassar",
    value: "makassar",
  },
];

const fetchOutletById = async (id: string) => {
  const response = await apiClient.get<OutletItem>(`/outlet/${id}`);
  return response.data;
};

const fetchBrandOptions = async () => {
  const params = new URLSearchParams({
    page: "1",
    limit: "100",
  });

  const response = await apiClient.get<BrandOption[], BrandListMeta>(
    `/brand?${params.toString()}`,
  );

  return response.data ?? [];
};

type UpdateOutletPayload = {
  id: string;
  formData: FormData;
};

const updateOutletById = async (payload: UpdateOutletPayload) => {
  const { id, formData } = payload;
  const response = await apiClient.put<OutletItem>(`/outlet/${id}`, formData);
  return response.data;
};

const emptyOutlet: OutletItem = {
  id: "",
  nama: "",
  brandId: "",
  provinsi: "",
  jamOperasional: "",
  lokasi: "",
  googleMapsLink: "",
  whatsappUrl: "",
  image: "",
};

type OperationalHours = {
  start: string;
  end: string;
};

const defaultOperationalHours: OperationalHours = {
  start: "",
  end: "",
};

const normalizeTimeValue = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return "";
  }

  const [, rawHour, minute] = match;
  const hour = rawHour.padStart(2, "0").slice(-2);

  return `${hour}:${minute}`;
};

const parseOperationalHours = (value: string): OperationalHours => {
  if (!value) {
    return { ...defaultOperationalHours };
  }

  const timeMatches = value.match(/\d{1,2}:\d{2}/g) ?? [];

  if (timeMatches.length > 0) {
    const [start = "", end = ""] = timeMatches;
    return {
      start: normalizeTimeValue(start),
      end: normalizeTimeValue(end),
    };
  }

  const parts = value.split("-").map((part) => normalizeTimeValue(part));
  const [start = "", end = ""] = parts;

  return { start, end };
};

const formatOperationalHours = (start: string, end: string) => {
  const trimmedStart = start.trim();
  const trimmedEnd = end.trim();

  if (!trimmedStart && !trimmedEnd) {
    return "";
  }

  if (!trimmedStart || !trimmedEnd) {
    return `${trimmedStart}${trimmedEnd ? ` - ${trimmedEnd}` : ""}`.trim();
  }

  return `${trimmedStart} - ${trimmedEnd}`;
};

function RouteComponent() {
  const { outletId } = Route.useParams();
  const queryClient = useQueryClient();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = React.useState<OutletItem>({
    ...emptyOutlet,
  });
  const [isFormInitialized, setIsFormInitialized] = React.useState(false);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(
    null,
  );
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [operationalHours, setOperationalHours] =
    React.useState<OperationalHours>({ ...defaultOperationalHours });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["outletById", outletId],
    queryFn: () => fetchOutletById(outletId),
  });

  const {
    data: brandOptions = [],
    isLoading: isBrandLoading,
    isError: isBrandError,
    error: brandError,
  } = useQuery({
    queryKey: ["brands", "options"],
    queryFn: fetchBrandOptions,
  });

  const updateOutletMutation = useMutation({
    mutationFn: updateOutletById,
    onSuccess: (updatedOutlet) => {
      const parsedHours = parseOperationalHours(
        updatedOutlet.jamOperasional ?? "",
      );
      const formattedHours = formatOperationalHours(
        parsedHours.start,
        parsedHours.end,
      );

      queryClient.setQueryData(["outletById", outletId], updatedOutlet);
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
      setFormState({
        ...updatedOutlet,
        whatsappUrl: updatedOutlet.whatsappUrl ?? "",
        jamOperasional: formattedHours,
      });
      setOperationalHours(parsedHours);
      setSelectedImageFile(null);
      setSubmitError(null);
      toast.success("Perubahan berhasil disimpan.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (mutationError: unknown) => {
      if (mutationError instanceof ApiError) {
        const message = mutationError.message || "Gagal menyimpan perubahan.";
        setSubmitError(message);
        toast.error(message);
        return;
      }

      const fallbackMessage =
        mutationError instanceof Error
          ? mutationError.message
          : "Gagal menyimpan perubahan. Silakan coba lagi.";

      setSubmitError(fallbackMessage);
      toast.error(fallbackMessage);
    },
  });

  const {
    mutate: mutateOutlet,
    reset: resetOutletMutation,
    isPending: isUpdatePending,
    isSuccess: isUpdateSuccess,
    isError: isUpdateError,
  } = updateOutletMutation;

  const handleChange = (key: keyof OutletItem, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSubmitError(null);
    if (isUpdateSuccess || isUpdateError) {
      resetOutletMutation();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);

    // Clean up old preview URL
    if (imagePreviewUrl && !imagePreviewUrl.startsWith('/uploads/')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    // Create new preview URL
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    } else {
      setImagePreviewUrl(null);
    }

    setSubmitError(null);
    if (isUpdateSuccess || isUpdateError) {
      resetOutletMutation();
    }
  };

  const handleOperationalHourChange = (
    key: keyof OperationalHours,
    value: string,
  ) => {
    const trimmedValue = value.trim();
    const sanitizedValue = trimmedValue
      ? normalizeTimeValue(trimmedValue) || trimmedValue
      : "";
    const updatedHours = {
      ...operationalHours,
      [key]: sanitizedValue,
    };

    setOperationalHours(updatedHours);
    const formatted = formatOperationalHours(
      updatedHours.start,
      updatedHours.end,
    );

    setFormState((prevState) => ({
      ...prevState,
      jamOperasional: formatted,
    }));

    setSubmitError(null);
    if (isUpdateSuccess || isUpdateError) {
      resetOutletMutation();
    }
  };

  const handleSubmit = () => {
    if (!data) {
      return;
    }

    const trimmedNama = formState.nama.trim();
    const trimmedProvinsi = formState.provinsi.trim();
    const trimmedLokasi = formState.lokasi.trim();
    const trimmedJamOperasional = formatOperationalHours(
      operationalHours.start,
      operationalHours.end,
    ).trim();
    const trimmedMapsUrl = formState.googleMapsLink.trim();
    const trimmedWhatsappUrl = (formState.whatsappUrl ?? "").trim();
    const trimmedBrandId = formState.brandId.trim();

    if (
      !trimmedBrandId ||
      !trimmedNama ||
      !trimmedProvinsi ||
      !trimmedLokasi ||
      !trimmedJamOperasional ||
      !trimmedMapsUrl ||
      !trimmedWhatsappUrl
    ) {
      setSubmitError("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    setSubmitError(null);
    if (isUpdateSuccess || isUpdateError) {
      resetOutletMutation();
    }

    const formData = new FormData();
    formData.append("nama", trimmedNama);
    formData.append("provinsi", trimmedProvinsi);
    formData.append("lokasi", trimmedLokasi);
    formData.append("jamOperasional", trimmedJamOperasional);
    formData.append("googleMapsLink", trimmedMapsUrl);
    formData.append("whatsappUrl", trimmedWhatsappUrl);
    formData.append("brandId", trimmedBrandId);

    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    }

    mutateOutlet({
      id: outletId,
      formData,
    });
  };

  React.useEffect(() => {
    setFormState({ ...emptyOutlet });
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setSubmitError(null);
    setOperationalHours({ ...defaultOperationalHours });
    setIsFormInitialized(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    resetOutletMutation();
  }, [outletId, resetOutletMutation]);

  React.useEffect(() => {
    if (!data || isFormInitialized) {
      return;
    }

    const parsedHours = parseOperationalHours(data.jamOperasional ?? "");
    const formattedHours = formatOperationalHours(
      parsedHours.start,
      parsedHours.end,
    );

    setFormState({
      ...emptyOutlet,
      ...data,
      jamOperasional: formattedHours,
      whatsappUrl: data.whatsappUrl ?? "",
      image: data.image ?? "",
    });

    // Set existing image preview from server
    if (data.image) {
      setImagePreviewUrl(data.image);
    }

    setOperationalHours(parsedHours);
    setIsFormInitialized(true);
  }, [data, isFormInitialized]);

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl && !imagePreviewUrl.startsWith('/uploads/')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isFormDisabled = !data || isUpdatePending;
  const isSubmitDisabled = isFormDisabled || isUpdatePending;

  let content = (
    <Card className="border-none shadow-sm">
      <CardContent className="space-y-8 p-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#2E2E2E]">
            Upload Foto<span className="text-[#C1272D]">*</span>
          </Label>
          <p className="text-sm text-[#D74E4E]">
            Disarankan menggunakan foto dengan ukuran rasio 1:1
          </p>
          {imagePreviewUrl ? (
            <div className="space-y-4">
              <div className="relative rounded-3xl border border-[#D6DAE1] bg-[#F9FBFD] p-4">
                <img
                  src={`${imagePreviewUrl}`}
                  alt="Preview"
                  className="mx-auto max-h-96 rounded-2xl object-contain"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F]"
                disabled={isSubmitDisabled}
                onClick={() => fileInputRef.current?.click()}
              >
                Ganti Foto
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={isSubmitDisabled}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[#D6DAE1] bg-[#F9FBFD] p-6 text-center">
              <Upload className="size-8 text-[#C1272D]" />
              <div className="text-sm text-[#6B7280]">
                Pilih Foto atau Drop Disini
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F]"
                disabled={isSubmitDisabled}
                onClick={() => fileInputRef.current?.click()}
              >
                Browse File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={isSubmitDisabled}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Nama Outlet<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.nama}
              onChange={(event) => handleChange("nama", event.target.value)}
              placeholder="Masukan Nama Outlet"
              disabled={isSubmitDisabled}
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Brand<span className="text-[#C1272D]">*</span>
            </Label>
            <Select
              value={formState.brandId}
              onValueChange={(value) => handleChange("brandId", value)}
              disabled={isSubmitDisabled || isBrandLoading}
            >
              <SelectTrigger className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-left text-sm text-[#4F4F4F]">
                <SelectValue
                  placeholder={
                    isBrandLoading ? "Memuat brand..." : "Pilih Brand Outlet"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {brandOptions.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isBrandError ? (
              <p className="text-xs text-[#C1272D]">
                {(brandError as Error)?.message ?? "Gagal memuat data brand."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Alamat Outlet<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.lokasi}
              onChange={(event) => handleChange("lokasi", event.target.value)}
              placeholder="Jln. A Yani"
              disabled={isSubmitDisabled}
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Provinsi<span className="text-[#C1272D]">*</span>
            </Label>
            <Select
              value={formState.provinsi}
              onValueChange={(value) => handleChange("provinsi", value)}
              disabled={isSubmitDisabled}
            >
              <SelectTrigger className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-left text-sm text-[#4F4F4F]">
                <SelectValue placeholder="Pilih Provinsi" />
              </SelectTrigger>
              <SelectContent>
                {provinsiOptions.map((provinsi) => (
                  <SelectItem key={provinsi.id} value={provinsi.value}>
                    {provinsi.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Jam Operasional<span className="text-[#C1272D]">*</span>
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#6B7280]">Mulai</span>
                <Input
                  type="time"
                  value={operationalHours.start}
                  onChange={(event) =>
                    handleOperationalHourChange("start", event.target.value)
                  }
                  disabled={isSubmitDisabled}
                  className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#6B7280]">
                  Selesai
                </span>
                <Input
                  type="time"
                  value={operationalHours.end}
                  onChange={(event) =>
                    handleOperationalHourChange("end", event.target.value)
                  }
                  disabled={isSubmitDisabled}
                  className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              URL Googlemaps<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.googleMapsLink}
              onChange={(event) =>
                handleChange("googleMapsLink", event.target.value)
              }
              placeholder="https://maps.app.goo.gl/xxxxxx"
              disabled={isSubmitDisabled}
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              URL Whatsapp<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.whatsappUrl ?? ""}
              onChange={(event) =>
                handleChange("whatsappUrl", event.target.value)
              }
              placeholder="https://wa.me/6281234567890?text=Halo%20saya%"
              disabled={isSubmitDisabled}
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            className="h-12 rounded-2xl bg-[#6E0112] px-6 text-sm font-semibold text-white hover:bg-[#5a010e]"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            {isUpdatePending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
          {submitError ? (
            <p className="mt-2 text-sm text-[#C1272D]">{submitError}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    content = (
      <Card className="border-none shadow-sm">
        <CardContent className="space-y-8 p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </CardContent>
      </Card>
    );
  } else if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memuat data outlet.";

    content = (
      <Card className="border-none shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="size-12 text-[#C1272D]" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-[#2E2E2E]">
              Gagal memuat data outlet
            </p>
            <p className="text-sm text-[#6B7280]">{errorMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm font-medium text-[#9C1A1C]">
        <Link
          to="/outlet"
          className="text-[#9C1A1C]/70 transition-colors hover:text-[#9C1A1C]"
        >
          Daftar Outlet
        </Link>{" "}
        <span className="text-[#BFA7AC]">{">"}</span>{" "}
        <span className="text-[#9C1A1C]">Edit Outlet</span>
      </nav>

      {content}
    </div>
  );
}
