import * as React from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Upload, Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Team = {
  id: string;
  nama: string;
  title: string;
  image: string;
  linkedinUrl: string;
  instagramUrl: string;
  createdAt: string;
  updatedAt: string;
};

const fetchTeamById = async (id: string) => {
  const response = await apiClient.get<Team>(`/team/${id}`);
  return response.data;
};

type UpdateTeamPayload = {
  id: string;
  formData: FormData;
};

const updateTeam = async ({ id, formData }: UpdateTeamPayload) => {
  const response = await apiClient.put<Team>(`/team/${id}`, formData);
  return response.data;
};

export const Route = createFileRoute("/_authenticated/team/$teamId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeamById(teamId),
  });

  const [formState, setFormState] = React.useState({
    nama: "",
    title: "",
    linkedinUrl: "",
    instagramUrl: "",
  });

  const imageFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [selectedImageFile, setSelectedImageFile] =
    React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Initialize form state when team data is loaded
  React.useEffect(() => {
    if (team) {
      setFormState({
        nama: team.nama || "",
        title: team.title || "",
        linkedinUrl: team.linkedinUrl || "",
        instagramUrl: team.instagramUrl || "",
      });

      // Set existing image preview from server
      if (team.image) {
        setImagePreviewUrl(team.image);
      }
    }
  }, [team]);

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl && !imagePreviewUrl.startsWith('/uploads/')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const {
    mutate: mutateUpdateTeam,
    isPending: isUpdatePending,
  } = useMutation({
    mutationFn: updateTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      toast.success("Team member berhasil diperbarui.");
      navigate({ to: "/team" });
    },
    onError: (mutationError: unknown) => {
      if (mutationError instanceof ApiError) {
        const message =
          mutationError.message || "Gagal memperbarui team member.";
        setSubmitError(message);
        toast.error(message);
        return;
      }

      const fallbackMessage =
        mutationError instanceof Error
          ? mutationError.message
          : "Gagal memperbarui team member. Silakan coba lagi.";
      setSubmitError(fallbackMessage);
      toast.error(fallbackMessage);
    },
  });

  const handleChange = (key: keyof typeof formState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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

    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSave = () => {
    if (isUpdatePending) {
      return;
    }

    const trimmedNama = formState.nama.trim();
    const trimmedTitle = formState.title.trim();
    const trimmedLinkedinUrl = formState.linkedinUrl.trim();
    const trimmedInstagramUrl = formState.instagramUrl.trim();

    if (
      !trimmedNama ||
      !trimmedTitle
    ) {
      setSubmitError("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    setSubmitError(null);

    const formData = new FormData();
    formData.append("nama", trimmedNama);
    formData.append("title", trimmedTitle);

    if (trimmedLinkedinUrl) {
      formData.append("linkedinUrl", trimmedLinkedinUrl);
    }

    if (trimmedInstagramUrl) {
      formData.append("instagramUrl", trimmedInstagramUrl);
    }

    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    }

    mutateUpdateTeam({
      id: teamId,
      formData,
    });
  };

  const handleCancel = () => {
    navigate({ to: "/team" });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-[#6B7280]">
          <Loader2 className="size-4 animate-spin" />
          Memuat data team member...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center text-[#C1272D]">
          Team member tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCancel}
          className="h-10 w-10 rounded-xl border border-[#D6DAE1]"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-[#9C1A1C]">
          Edit Team Member
        </h1>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="space-y-6 p-8">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#2E2E2E]">
              Upload Foto
            </Label>
            {imagePreviewUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-3xl border border-[#D6DAE1] bg-[#F9FBFD] p-4">
                  <img
                    src={`${imagePreviewUrl}`}
                    alt="Preview"
                    className="mx-auto h-48 w-48 rounded-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F]"
                  disabled={isUpdatePending}
                  onClick={() => imageFileInputRef.current?.click()}
                >
                  Ganti Foto
                </Button>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isUpdatePending}
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
                  disabled={isUpdatePending}
                  onClick={() => imageFileInputRef.current?.click()}
                >
                  Browse File
                </Button>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isUpdatePending}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Nama */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Nama Lengkap<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.nama}
              onChange={(event) => handleChange("nama", event.target.value)}
              placeholder="Masukan Nama Lengkap"
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
              disabled={isUpdatePending}
            />
          </div>

          {/* Title/Jabatan */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2E2E2E]">
              Jabatan<span className="text-[#C1272D]">*</span>
            </Label>
            <Input
              value={formState.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="Masukan Jabatan (e.g., Chief Executive Officer)"
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
              disabled={isUpdatePending}
            />
          </div>

          {/* Social Media Links Section */}
          <div className="space-y-4 rounded-2xl border border-[#F0F1F3] bg-[#FAFBFC] p-6">
            <h3 className="text-base font-semibold text-[#2E2E2E]">
              Social Media Links
            </h3>

            {/* LinkedIn Link */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2E2E2E]">
                LinkedIn URL
              </Label>
              <Input
                value={formState.linkedinUrl}
                onChange={(event) =>
                  handleChange("linkedinUrl", event.target.value)
                }
                placeholder="https://www.linkedin.com/in/johndoe"
                className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                disabled={isUpdatePending}
              />
            </div>

            {/* Instagram Link */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2E2E2E]">
                Instagram URL
              </Label>
              <Input
                value={formState.instagramUrl}
                onChange={(event) =>
                  handleChange("instagramUrl", event.target.value)
                }
                placeholder="https://www.instagram.com/johndoe"
                className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                disabled={isUpdatePending}
              />
            </div>
          </div>

          {submitError ? (
            <p className="text-sm text-[#C1272D]">{submitError}</p>
          ) : null}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              className="h-12 rounded-2xl border border-[#D6DAE1] bg-white px-6 text-sm font-medium text-[#4F4F4F]"
              onClick={handleCancel}
              disabled={isUpdatePending}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="h-12 rounded-2xl bg-[#6E0112] px-6 text-sm font-semibold text-white hover:bg-[#5a010e]"
              disabled={isUpdatePending}
              onClick={handleSave}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
