import * as React from "react";

import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Editor } from "@/components/ui/editor";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ApiError, apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/berita/$beritaId/edit")({
  component: RouteComponent,
});

type BeritaItem = {
  id: string;
  judul: string;
  image?: string;
  createdDate?: string;
  penulis: string;
  content: string;
};

const fetchNewsById = async (id: string) => {
  const response = await apiClient.get<BeritaItem>(`/berita/${id}`);
  return response.data;
};

type UpdateNewsPayload = {
  id: string;
  formData: FormData;
};

const updateNewsById = async (payload: UpdateNewsPayload) => {
  const { id, formData } = payload;
  const response = await apiClient.put<BeritaItem>(`/berita/${id}`, formData);
  return response.data;
};

function RouteComponent() {
  const { beritaId } = Route.useParams();
  const queryClient = useQueryClient();

  const [publishDate, setPublishDate] = React.useState<Date | undefined>(
    undefined,
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["beritaById", beritaId],
    queryFn: () => fetchNewsById(beritaId),
  });

  const isFormDisabled = !data;

  const [formState, setFormState] = React.useState({
    title: "",
    author: "",
    content: "",
  });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isFormInitialized, setIsFormInitialized] = React.useState(false);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(
    null,
  );
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const updateNewsMutation = useMutation({
    mutationFn: updateNewsById,
    onSuccess: (updatedNews) => {
      queryClient.setQueryData(["beritaById", beritaId], updatedNews);
      queryClient.invalidateQueries({ queryKey: ["berita"] });
      setSubmitError(null);
      toast.success("Perubahan berhasil disimpan.");
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
    mutate: mutateNews,
    reset: resetNewsMutation,
    isPending: isUpdatePending,
    isSuccess: isUpdateSuccess,
    isError: isUpdateError,
  } = updateNewsMutation;

  const handleChange = (key: keyof typeof formState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSubmitError(null);
    if (isUpdateSuccess || isUpdateError) {
      resetNewsMutation();
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
      resetNewsMutation();
    }
  };

  const handlePublishDateSelect = (date?: Date) => {
    setPublishDate(date);
    setSubmitError(null);
    if (isUpdateSuccess || isUpdateError) {
      resetNewsMutation();
    }
  };

  const handleSubmit = () => {
    if (!data) {
      return;
    }

    const trimmedTitle = formState.title.trim();
    const trimmedAuthor = formState.author.trim();
    const trimmedContent = formState.content.trim();

    if (!trimmedTitle || !trimmedAuthor || !trimmedContent || !publishDate) {
      setSubmitError("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    setSubmitError(null);
    if (isUpdateSuccess || isUpdateError) {
      resetNewsMutation();
    }

    const formData = new FormData();
    formData.append("judul", trimmedTitle);
    formData.append("penulis", trimmedAuthor);
    formData.append("content", trimmedContent);
    formData.append("createdDate", format(publishDate, "yyyy-MM-dd"));

    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    }

    mutateNews({
      id: beritaId,
      formData,
    });
  };

  React.useEffect(() => {
    setFormState({
      title: "",
      author: "",
      content: "",
    });
    setPublishDate(undefined);
    setIsFormInitialized(false);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    resetNewsMutation();
  }, [beritaId, resetNewsMutation]);

  React.useEffect(() => {
    if (!data || isFormInitialized) {
      return;
    }

    setFormState({
      title: data.judul ?? "",
      author: data.penulis ?? "",
      content: data.content ?? "",
    });

    // Set existing image preview from server
    if (data.image) {
      setImagePreviewUrl(data.image);
    }

    if (data.createdDate) {
      const parsedDate = new Date(data.createdDate);
      setPublishDate(
        Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      );
    } else {
      setPublishDate(new Date());
    }

    setIsFormInitialized(true);
  }, [data, isFormInitialized]);

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl && !imagePreviewUrl.startsWith('/uploads/')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isSubmitDisabled = isFormDisabled || isUpdatePending;

  let content = (
    <Card className="border-none shadow-sm">
      <CardContent className="space-y-8 p-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#2E2E2E]">
            Upload Foto<span className="text-[#C1272D]">*</span>
          </Label>
          <p className="text-sm text-[#D74E4E]">
            Disarankan menggunakan foto dengan ukuran rasio 3:4
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
                disabled={isSubmitDisabled}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Judul Berita<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="Masukan Judul Berita"
              disabled={isSubmitDisabled}
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Penulis<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.author}
              onChange={(event) => handleChange("author", event.target.value)}
              placeholder="Nama Penulis"
              disabled={isSubmitDisabled}
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#2E2E2E]">
            Tanggal Publish<span className="text-[#C1272D]">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full justify-start rounded-2xl border border-[#D6DAE1] bg-white px-4 text-left text-sm font-medium text-[#4F4F4F] hover:bg-white"
                disabled={isSubmitDisabled}
              >
                <CalendarIcon className="mr-3 size-4 text-[#C1272D]" />
                {publishDate
                  ? format(publishDate, "dd-MM-yyyy")
                  : "Pilih Tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto rounded-2xl border border-[#F0F1F3] bg-white p-4"
              align="start"
            >
              <Calendar
                mode="single"
                selected={publishDate}
                onSelect={handlePublishDateSelect}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#2E2E2E]">
            Isi Berita<span className="text-[#C1272D]">*</span>
          </Label>
          <Editor
            value={formState.content}
            onChange={(value) => handleChange("content", value)}
            placeholder="Masukan Isi Berita Disini"
            disabled={isSubmitDisabled}
          />
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
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </CardContent>
      </Card>
    );
  } else if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memuat data berita.";

    content = (
      <Card className="border-none shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="size-12 text-[#C1272D]" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-[#2E2E2E]">
              Gagal memuat data berita
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
          to="/berita"
          className="text-[#9C1A1C]/70 transition-colors hover:text-[#9C1A1C]"
        >
          Daftar Berita
        </Link>{" "}
        <span className="text-[#BFA7AC]">{" > "}</span>
        <span className="text-[#9C1A1C]">Edit Berita</span>
      </nav>

      {content}
    </div>
  );
}
