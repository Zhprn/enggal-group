import * as React from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Upload, Loader2, ArrowLeft, X, Instagram, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Editor } from "@/components/ui/editor";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError, apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Brand = {
    id: number;
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

type Gallery = {
    id: string;
    brandId: string;
    image: string;
    caption: string;
    instagramUrl?: string;
    createdAt: string;
    updatedAt: string;
};

const fetchBrandById = async (id: string) => {
    const response = await apiClient.get<Brand>(`/brand/${id}`);
    return response.data;
};

type UpdateBrandPayload = {
    id: string;
    formData: FormData;
};

const updateBrand = async ({ id, formData }: UpdateBrandPayload) => {
    const response = await apiClient.put<Brand>(`/brand/${id}`, formData);
    return response.data;
};

const fetchGalleries = async (brandId: string) => {
    const response = await apiClient.get<Gallery[]>(
        `/gallery?brandId=${brandId}&limit=100`,
    );
    return response.data;
};

type CreateGalleryPayload = {
    formData: FormData;
};

const createGallery = async ({ formData }: CreateGalleryPayload) => {
    const response = await apiClient.post<Gallery>("/gallery", formData);
    return response.data;
};

const deleteGallery = async (id: string) => {
    await apiClient.delete(`/gallery/${id}`);
};

type UpdateGalleryPayload = {
    id: string;
    formData: FormData;
};

const updateGallery = async ({ id, formData }: UpdateGalleryPayload) => {
    const response = await apiClient.put<Gallery>(`/gallery/${id}`, formData);
    return response.data;
};

export const Route = createFileRoute("/_authenticated/brand/$brandId/edit")({
    component: RouteComponent,
});

function RouteComponent() {
    const { brandId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: brand, isLoading } = useQuery({
        queryKey: ["brand", brandId],
        queryFn: () => fetchBrandById(brandId),
    });

    const { data: galleries = [], isLoading: isLoadingGalleries } = useQuery({
        queryKey: ["galleries", brandId],
        queryFn: () => fetchGalleries(brandId),
        enabled: !!brandId,
    });

    const [formState, setFormState] = React.useState({
        nama: "",
        title: "",
        description: "",
        content: "",
        instagramLink: "",
        facebookLink: "",
        twitterLink: "",
        menuLink: "",
    });

    const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);
    const coverImageFileInputRef = React.useRef<HTMLInputElement | null>(null);

    const [selectedLogoName, setSelectedLogoName] = React.useState("");
    const [selectedLogoFile, setSelectedLogoFile] = React.useState<File | null>(
        null,
    );
    const [selectedLogoPreviewUrl, setSelectedLogoPreviewUrl] = React.useState<
        string | null
    >(null);

    const [selectedCoverImageName, setSelectedCoverImageName] =
        React.useState("");
    const [selectedCoverImageFile, setSelectedCoverImageFile] =
        React.useState<File | null>(null);
    const [selectedCoverImagePreviewUrl, setSelectedCoverImagePreviewUrl] =
        React.useState<string | null>(null);

    const [submitError, setSubmitError] = React.useState<string | null>(null);


    const [galleryCaption, setGalleryCaption] = React.useState("");
    const [galleryInstagramUrl, setGalleryInstagramUrl] = React.useState("");
    const [selectedGalleryFile, setSelectedGalleryFile] =
        React.useState<File | null>(null);
    const [selectedGalleryPreviewUrl, setSelectedGalleryPreviewUrl] =
        React.useState<string | null>(null);
    const galleryFileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Edit gallery state
    const [editingGallery, setEditingGallery] = React.useState<Gallery | null>(
        null,
    );
    const [editCaption, setEditCaption] = React.useState("");
    const [editInstagramUrl, setEditInstagramUrl] = React.useState("");
    const [editGalleryFile, setEditGalleryFile] = React.useState<File | null>(
        null,
    );
    const [editGalleryPreviewUrl, setEditGalleryPreviewUrl] =
        React.useState<string | null>(null);
    const editGalleryFileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Delete gallery state
    const [deletingGalleryId, setDeletingGalleryId] = React.useState<
        string | null
    >(null);

    // Initialize form state when brand data is loaded
    React.useEffect(() => {
        if (brand) {
            setFormState({
                nama: brand.nama || "",
                title: brand.title || "",
                description: brand.description || "",
                content: brand.content || "",
                instagramLink: brand.instagramLink || "",
                facebookLink: brand.facebookLink || "",
                twitterLink: brand.twitterLink || "",
                menuLink: brand.menuLink || "",
            });
            setSelectedLogoName(
                brand.logo ? (brand.logo.split("/").pop() ?? "") : "",
            );
            setSelectedCoverImageName(
                brand.coverImage ? (brand.coverImage.split("/").pop() ?? "") : "",
            );
        }
    }, [brand]);

    // Cleanup object URLs to prevent memory leaks
    React.useEffect(() => {
        return () => {
            if (selectedLogoPreviewUrl) {
                URL.revokeObjectURL(selectedLogoPreviewUrl);
            }
            if (selectedCoverImagePreviewUrl) {
                URL.revokeObjectURL(selectedCoverImagePreviewUrl);
            }
            if (selectedGalleryPreviewUrl) {
                URL.revokeObjectURL(selectedGalleryPreviewUrl);
            }
            if (editGalleryPreviewUrl) {
                URL.revokeObjectURL(editGalleryPreviewUrl);
            }
        };
    }, [
        selectedLogoPreviewUrl,
        selectedCoverImagePreviewUrl,
        selectedGalleryPreviewUrl,
        editGalleryPreviewUrl,
    ]);

    const {
        mutate: mutateUpdateBrand,
        isPending: isUpdatePending,
    } = useMutation({
        mutationFn: updateBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            queryClient.invalidateQueries({ queryKey: ["brand", brandId] });
            toast.success("Brand berhasil diperbarui.");
            navigate({ to: "/brand" });
        },
        onError: (mutationError: unknown) => {
            if (mutationError instanceof ApiError) {
                const message = mutationError.message || "Gagal memperbarui brand.";
                setSubmitError(message);
                toast.error(message);
                return;
            }

            const fallbackMessage =
                mutationError instanceof Error
                    ? mutationError.message
                    : "Gagal memperbarui brand. Silakan coba lagi.";
            setSubmitError(fallbackMessage);
            toast.error(fallbackMessage);
        },
    });

    const { mutate: mutateCreateGallery, isPending: isCreatingGallery } =
        useMutation({
            mutationFn: createGallery,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["galleries", brandId] });
                toast.success("Gallery berhasil ditambahkan.");
                setGalleryCaption("");
                setGalleryInstagramUrl("");
                setSelectedGalleryFile(null);
                setSelectedGalleryPreviewUrl((previous) => {
                    if (previous) {
                        URL.revokeObjectURL(previous);
                    }
                    return null;
                });
                if (galleryFileInputRef.current) {
                    galleryFileInputRef.current.value = "";
                }
            },
            onError: (mutationError: unknown) => {
                if (mutationError instanceof ApiError) {
                    const message =
                        mutationError.message || "Gagal menambahkan gallery.";
                    toast.error(message);
                    return;
                }

                const fallbackMessage =
                    mutationError instanceof Error
                        ? mutationError.message
                        : "Gagal menambahkan gallery. Silakan coba lagi.";
                toast.error(fallbackMessage);
            },
        });

    const { mutate: mutateDeleteGallery, isPending: isDeletingGallery } =
        useMutation({
            mutationFn: deleteGallery,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["galleries", brandId] });
                toast.success("Gallery berhasil dihapus.");
                setDeletingGalleryId(null);
            },
            onError: (mutationError: unknown) => {
                if (mutationError instanceof ApiError) {
                    const message =
                        mutationError.message || "Gagal menghapus gallery.";
                    toast.error(message);
                    return;
                }

                const fallbackMessage =
                    mutationError instanceof Error
                        ? mutationError.message
                        : "Gagal menghapus gallery. Silakan coba lagi.";
                toast.error(fallbackMessage);
            },
        });

    const { mutate: mutateUpdateGallery, isPending: isUpdatingGallery } =
        useMutation({
            mutationFn: updateGallery,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["galleries", brandId] });
                toast.success("Gallery berhasil diperbarui.");
                setEditingGallery(null);
                setEditCaption("");
                setEditInstagramUrl("");
                setEditGalleryFile(null);
                setEditGalleryPreviewUrl((previous) => {
                    if (previous) {
                        URL.revokeObjectURL(previous);
                    }
                    return null;
                });
                if (editGalleryFileInputRef.current) {
                    editGalleryFileInputRef.current.value = "";
                }
            },
            onError: (mutationError: unknown) => {
                if (mutationError instanceof ApiError) {
                    const message =
                        mutationError.message || "Gagal memperbarui gallery.";
                    toast.error(message);
                    return;
                }

                const fallbackMessage =
                    mutationError instanceof Error
                        ? mutationError.message
                        : "Gagal memperbarui gallery. Silakan coba lagi.";
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

    const handleLogoFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] ?? null;

        // Revoke previous preview URL
        if (selectedLogoPreviewUrl) {
            URL.revokeObjectURL(selectedLogoPreviewUrl);
        }

        setSelectedLogoName(file ? file.name : "");
        setSelectedLogoFile(file);
        setSelectedLogoPreviewUrl(file ? URL.createObjectURL(file) : null);

        if (submitError) {
            setSubmitError(null);
        }
    };

    const handleCoverImageFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] ?? null;

        // Revoke previous preview URL
        if (selectedCoverImagePreviewUrl) {
            URL.revokeObjectURL(selectedCoverImagePreviewUrl);
        }

        setSelectedCoverImageName(file ? file.name : "");
        setSelectedCoverImageFile(file);
        setSelectedCoverImagePreviewUrl(file ? URL.createObjectURL(file) : null);

        if (submitError) {
            setSubmitError(null);
        }
    };

    const handleSave = () => {
        if (isUpdatePending) {
            return;
        }

        const trimmedNama = formState.nama.trim();
        const trimmedDescription = formState.description.trim();

        if (!trimmedNama || !trimmedDescription) {
            setSubmitError("Mohon lengkapi semua field yang wajib diisi.");
            return;
        }

        setSubmitError(null);

        const formData = new FormData();
        formData.append("nama", trimmedNama);
        formData.append("description", trimmedDescription);

        if (selectedLogoFile) {
            formData.append("logo", selectedLogoFile);
        }

        if (selectedCoverImageFile) {
            formData.append("coverImage", selectedCoverImageFile);
        }

        if (formState.title.trim()) {
            formData.append("title", formState.title.trim());
        }

        if (formState.content.trim()) {
            formData.append("content", formState.content.trim());
        }

        if (formState.instagramLink.trim()) {
            formData.append("instagramLink", formState.instagramLink.trim());
        }

        if (formState.facebookLink.trim()) {
            formData.append("facebookLink", formState.facebookLink.trim());
        }

        if (formState.twitterLink.trim()) {
            formData.append("twitterLink", formState.twitterLink.trim());
        }

        if (formState.menuLink.trim()) {
            formData.append("menuLink", formState.menuLink.trim());
        }

        mutateUpdateBrand({
            id: brandId,
            formData,
        });
    };

    const handleCancel = () => {
        navigate({ to: "/brand" });
    };

    const handleGalleryFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] ?? null;

        if (selectedGalleryPreviewUrl) {
            URL.revokeObjectURL(selectedGalleryPreviewUrl);
        }

        setSelectedGalleryFile(file);
        setSelectedGalleryPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleAddGallery = () => {
        if (isCreatingGallery) {
            return;
        }

        const trimmedCaption = galleryCaption.trim();

        if (!selectedGalleryFile || !trimmedCaption) {
            toast.error("Mohon lengkapi gambar dan caption untuk gallery.");
            return;
        }

        const formData = new FormData();
        formData.append("brandId", brandId);
        formData.append("caption", trimmedCaption);
        formData.append("image", selectedGalleryFile);

        if (galleryInstagramUrl.trim()) {
            formData.append("instagramUrl", galleryInstagramUrl.trim());
        }

        mutateCreateGallery({ formData });
    };

    const handleDeleteGallery = (galleryId: string) => {
        setDeletingGalleryId(galleryId);
    };

    const handleConfirmDeleteGallery = () => {
        if (deletingGalleryId) {
            mutateDeleteGallery(deletingGalleryId);
        }
    };

    const handleCancelDeleteGallery = () => {
        setDeletingGalleryId(null);
    };

    const handleEditGallery = (gallery: Gallery) => {
        if (editGalleryPreviewUrl) {
            URL.revokeObjectURL(editGalleryPreviewUrl);
        }

        setEditingGallery(gallery);
        setEditCaption(gallery.caption);
        setEditInstagramUrl(gallery.instagramUrl || "");
        setEditGalleryFile(null);
        setEditGalleryPreviewUrl(null);
        if (editGalleryFileInputRef.current) {
            editGalleryFileInputRef.current.value = "";
        }
    };

    const handleEditGalleryFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] ?? null;

        if (editGalleryPreviewUrl) {
            URL.revokeObjectURL(editGalleryPreviewUrl);
        }

        setEditGalleryFile(file);
        setEditGalleryPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleSaveEditGallery = () => {
        if (isUpdatingGallery || !editingGallery) {
            return;
        }

        const trimmedCaption = editCaption.trim();

        if (!trimmedCaption) {
            toast.error("Caption tidak boleh kosong.");
            return;
        }

        const formData = new FormData();
        formData.append("caption", trimmedCaption);

        if (editGalleryFile) {
            formData.append("image", editGalleryFile);
        }

        if (editInstagramUrl.trim()) {
            formData.append("instagramUrl", editInstagramUrl.trim());
        }

        mutateUpdateGallery({
            id: editingGallery.id,
            formData,
        });
    };

    const handleCancelEditGallery = () => {
        setEditingGallery(null);
        setEditCaption("");
        setEditInstagramUrl("");
        setEditGalleryFile(null);
        if (editGalleryPreviewUrl) {
            URL.revokeObjectURL(editGalleryPreviewUrl);
        }
        setEditGalleryPreviewUrl(null);
        if (editGalleryFileInputRef.current) {
            editGalleryFileInputRef.current.value = "";
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex items-center gap-2 text-[#6B7280]">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat data brand...
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center text-[#C1272D]">
                    Brand tidak ditemukan.
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
                <h1 className="text-2xl font-semibold text-[#9C1A1C]">Edit Brand</h1>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="space-y-6 p-8">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#2E2E2E]">
                            Upload Logo
                        </Label>
                        {(brand.logo && brand.logo.trim()) || selectedLogoFile ? (
                            <div className="space-y-4">
                                <div className="relative rounded-3xl border border-[#D6DAE1] bg-[#F9FBFD] p-4">
                                    {selectedLogoPreviewUrl || brand.logo ? (
                                        <img
                                            src={
                                                selectedLogoPreviewUrl ||
                                                `${brand.logo}`
                                            }
                                            alt="Current logo"
                                            className="mx-auto h-48 w-48 rounded-full object-contain"
                                            onError={(e) => {
                                                console.error('Failed to load logo:', e);
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-48 items-center justify-center text-[#6B7280]">
                                            No image available
                                        </div>
                                    )}
                                </div>
                                {selectedLogoFile && (
                                    <div className="rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] px-4 py-2">
                                        <p className="text-sm text-[#0369A1]">
                                            File baru dipilih: <span className="font-medium">{selectedLogoName}</span>
                                        </p>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F]"
                                    disabled={isUpdatePending}
                                    onClick={() => logoFileInputRef.current?.click()}
                                >
                                    Ganti Logo
                                </Button>
                                <input
                                    ref={logoFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoFileChange}
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
                                    onClick={() => logoFileInputRef.current?.click()}
                                >
                                    Browse File
                                </Button>
                                <input
                                    ref={logoFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoFileChange}
                                    disabled={isUpdatePending}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>

                    {/* Cover Image Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#2E2E2E]">
                            Upload Cover Image
                        </Label>
                        {(brand.coverImage && brand.coverImage.trim()) || selectedCoverImageFile ? (
                            <div className="space-y-4">
                                <div className="relative rounded-3xl border border-[#D6DAE1] bg-[#F9FBFD] p-4">
                                    {selectedCoverImagePreviewUrl || brand.coverImage ? (
                                        <img
                                            src={
                                                selectedCoverImagePreviewUrl ||
                                                `${brand.coverImage}`
                                            }
                                            alt="Current cover"
                                            className="mx-auto max-h-96 rounded-2xl object-contain"
                                            onError={(e) => {
                                                console.error('Failed to load cover image:', e);
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-96 items-center justify-center text-[#6B7280]">
                                            No image available
                                        </div>
                                    )}
                                </div>
                                {selectedCoverImageFile && (
                                    <div className="rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] px-4 py-2">
                                        <p className="text-sm text-[#0369A1]">
                                            File baru dipilih: <span className="font-medium">{selectedCoverImageName}</span>
                                        </p>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F]"
                                    disabled={isUpdatePending}
                                    onClick={() => coverImageFileInputRef.current?.click()}
                                >
                                    Ganti Cover Image
                                </Button>
                                <input
                                    ref={coverImageFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverImageFileChange}
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
                                    onClick={() => coverImageFileInputRef.current?.click()}
                                >
                                    Browse File
                                </Button>
                                <input
                                    ref={coverImageFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverImageFileChange}
                                    disabled={isUpdatePending}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>

                    {/* Nama Brand */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#2E2E2E]">
                            Nama Brand<span className="text-[#C1272D]">*</span>
                        </Label>
                        <Input
                            value={formState.nama}
                            onChange={(event) => handleChange("nama", event.target.value)}
                            placeholder="Masukan Nama Brand"
                            className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                            disabled={isUpdatePending}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#2E2E2E]">
                            Deskripsi Brand<span className="text-[#C1272D]">*</span>
                        </Label>
                        <Textarea
                            value={formState.description}
                            onChange={(event) =>
                                handleChange("description", event.target.value)
                            }
                            placeholder="Masukan Deskripsi Brand"
                            className="min-h-[140px] rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                            disabled={isUpdatePending}
                        />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#2E2E2E]">Title</Label>
                        <Input
                            value={formState.title}
                            onChange={(event) => handleChange("title", event.target.value)}
                            placeholder="Masukan Title Brand"
                            className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                            disabled={isUpdatePending}
                        />
                    </div>


                    {/* Content */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#2E2E2E]">
                            Content
                        </Label>
                        <Editor
                            value={formState.content}
                            onChange={(value) => handleChange("content", value)}
                            placeholder="Masukan Content Brand (optional)"
                            disabled={isUpdatePending}
                            className="min-h-[200px]"
                        />
                    </div>

                    {/* Social Media Links Section */}
                    <div className="space-y-4 rounded-2xl border border-[#F0F1F3] bg-[#FAFBFC] p-6">
                        <h3 className="text-base font-semibold text-[#2E2E2E]">
                            Social Media Links
                        </h3>

                        {/* Instagram Link */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#2E2E2E]">
                                Instagram Link
                            </Label>
                            <Input
                                value={formState.instagramLink}
                                onChange={(event) =>
                                    handleChange("instagramLink", event.target.value)
                                }
                                placeholder="https://instagram.com/yourbrand"
                                className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                disabled={isUpdatePending}
                            />
                        </div>

                        {/* Facebook Link */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#2E2E2E]">
                                Facebook Link
                            </Label>
                            <Input
                                value={formState.facebookLink}
                                onChange={(event) =>
                                    handleChange("facebookLink", event.target.value)
                                }
                                placeholder="https://facebook.com/yourbrand"
                                className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                disabled={isUpdatePending}
                            />
                        </div>

                        {/* Twitter Link */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#2E2E2E]">
                                Tiktok Link
                            </Label>
                            <Input
                                value={formState.twitterLink}
                                onChange={(event) =>
                                    handleChange("twitterLink", event.target.value)
                                }
                                placeholder="https://tiktok.com/yourbrand"
                                className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                disabled={isUpdatePending}
                            />
                        </div>

                        {/* Menu Link */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#2E2E2E]">
                                Menu Link
                            </Label>
                            <Input
                                value={formState.menuLink}
                                onChange={(event) =>
                                    handleChange("menuLink", event.target.value)
                                }
                                placeholder="https://menu.yourbrand.com"
                                className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                disabled={isUpdatePending}
                            />
                        </div>
                    </div>

                    {/* Gallery Section */}
                    <div className="space-y-4 rounded-2xl border border-[#F0F1F3] bg-[#FAFBFC] p-6">
                        <h3 className="text-base font-semibold text-[#2E2E2E]">
                            Gallery
                        </h3>

                        {/* Existing Gallery Items */}
                        {isLoadingGalleries ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="flex items-center gap-2 text-[#6B7280]">
                                    <Loader2 className="size-4 animate-spin" />
                                    Memuat gallery...
                                </div>
                            </div>
                        ) : galleries.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {galleries.map((gallery) => (
                                    <div
                                        key={gallery.id}
                                        className="group relative overflow-hidden rounded-xl border border-[#D6DAE1] bg-white"
                                    >
                                        <img
                                            src={`${gallery.image}`}
                                            alt={gallery.caption}
                                            className="aspect-square w-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    className="size-8 rounded-lg bg-[#6E0112] hover:bg-[#5a010e]"
                                                    onClick={() => handleEditGallery(gallery)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="destructive"
                                                    className="size-8 rounded-lg bg-[#C1272D] hover:bg-[#9C1A1C]"
                                                    onClick={() =>
                                                        handleDeleteGallery(gallery.id)
                                                    }
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-white line-clamp-2">
                                                    {gallery.caption}
                                                </p>
                                                {gallery.instagramUrl ? (
                                                    <a
                                                        href={gallery.instagramUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-white hover:text-[#FFF3E0]"
                                                    >
                                                        <Instagram className="size-3" />
                                                        Instagram
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-4 text-center text-sm text-[#6B7280]">
                                Belum ada gallery untuk brand ini.
                            </p>
                        )}

                        {/* Add New Gallery */}
                        <div className="space-y-4 rounded-xl border border-[#D6DAE1] bg-white p-4">
                            <h4 className="text-sm font-semibold text-[#2E2E2E]">
                                Tambah Gallery Baru
                            </h4>

                            {/* Gallery Image Upload */}
                            <div>
                                <Label className="mb-2 block text-sm font-medium text-[#2E2E2E]">
                                    Upload Gambar
                                </Label>
                                <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#D6DAE1] bg-[#F9FBFD] p-4 text-center">
                                    {selectedGalleryPreviewUrl ? (
                                        <img
                                            src={selectedGalleryPreviewUrl}
                                            alt="Pratinjau gambar gallery"
                                            className="mx-auto aspect-square w-full max-w-[240px] rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <Upload className="size-6 text-[#C1272D]" />
                                    )}
                                    <div className="text-sm text-[#6B7280]">
                                        {selectedGalleryPreviewUrl
                                            ? "Pratinjau gambar baru ditampilkan di atas."
                                            : "Pilih Foto atau Drop Disini"}
                                    </div>
                                    {selectedGalleryFile ? (
                                        <div className="w-full rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2 text-xs text-[#0369A1]">
                                            File dipilih:{" "}
                                            <span className="font-medium">
                                                {selectedGalleryFile.name}
                                            </span>
                                        </div>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border border-[#D6DAE1] bg-white text-xs text-[#4F4F4F]"
                                        disabled={isCreatingGallery}
                                        onClick={() => galleryFileInputRef.current?.click()}
                                    >
                                        {selectedGalleryPreviewUrl ? "Ganti File" : "Browse File"}
                                    </Button>
                                    <input
                                        ref={galleryFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleGalleryFileChange}
                                        disabled={isCreatingGallery}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Caption */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#2E2E2E]">
                                    Caption<span className="text-[#C1272D]">*</span>
                                </Label>
                                <Textarea
                                    value={galleryCaption}
                                    onChange={(event) =>
                                        setGalleryCaption(event.target.value)
                                    }
                                    placeholder="Masukan caption untuk gambar"
                                    className="min-h-[80px] rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                    disabled={isCreatingGallery}
                                />
                            </div>

                            {/* Instagram URL */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#2E2E2E]">
                                    Instagram Post URL (Optional)
                                </Label>
                                <Input
                                    value={galleryInstagramUrl}
                                    onChange={(event) =>
                                        setGalleryInstagramUrl(event.target.value)
                                    }
                                    placeholder="https://instagram.com/p/..."
                                    className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                    disabled={isCreatingGallery}
                                />
                            </div>

                            <Button
                                type="button"
                                onClick={handleAddGallery}
                                disabled={isCreatingGallery}
                                className="h-10 w-full rounded-xl bg-[#6E0112] text-sm font-semibold text-white hover:bg-[#5a010e]"
                            >
                                {isCreatingGallery ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Menambahkan...
                                    </>
                                ) : (
                                    "Tambah ke Gallery"
                                )}
                            </Button>
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

            {/* Edit Gallery Dialog */}
            <Dialog open={!!editingGallery} onOpenChange={handleCancelEditGallery}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-[#9C1A1C]">
                            Edit Gallery
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Current/New Image Preview */}
                        {editingGallery ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#2E2E2E]">
                                    Gambar Gallery
                                </Label>
                                <div className="space-y-4">
                                    <div className="relative rounded-3xl border border-[#D6DAE1] bg-[#F9FBFD] p-4">
                                        <img
                                            src={
                                                editGalleryPreviewUrl
                                                    ? editGalleryPreviewUrl
                                                    : `${editingGallery.image}`
                                            }
                                            alt={
                                                editGalleryPreviewUrl
                                                    ? "Pratinjau gambar gallery"
                                                    : editingGallery.caption
                                            }
                                            className="mx-auto max-h-64 rounded-2xl object-contain"
                                        />
                                    </div>
                                    {editGalleryFile ? (
                                        <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2 text-xs text-[#0369A1]">
                                            File baru dipilih:{" "}
                                            <span className="font-medium">
                                                {editGalleryFile.name}
                                            </span>
                                        </div>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full rounded-xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F]"
                                        disabled={isUpdatingGallery}
                                        onClick={() => editGalleryFileInputRef.current?.click()}
                                    >
                                        Ganti Gambar
                                    </Button>
                                    <input
                                        ref={editGalleryFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditGalleryFileChange}
                                        disabled={isUpdatingGallery}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        ) : null}

                        {/* Caption */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#2E2E2E]">
                                Caption<span className="text-[#C1272D]">*</span>
                            </Label>
                            <Textarea
                                value={editCaption}
                                onChange={(event) =>
                                    setEditCaption(event.target.value)
                                }
                                placeholder="Masukan caption untuk gambar"
                                className="min-h-[80px] rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                disabled={isUpdatingGallery}
                            />
                        </div>

                        {/* Instagram URL */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#2E2E2E]">
                                Instagram Post URL (Optional)
                            </Label>
                            <Input
                                value={editInstagramUrl}
                                onChange={(event) =>
                                    setEditInstagramUrl(event.target.value)
                                }
                                placeholder="https://instagram.com/p/..."
                                className="h-12 rounded-2xl border border-[#D6DAE1] bg-white text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#C1272D]/30 focus-visible:ring-offset-0"
                                disabled={isUpdatingGallery}
                            />
                        </div>
                    </div>

                    {/* Dialog Actions */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            type="button"
                            className="h-11 rounded-2xl border border-[#D6DAE1] bg-white px-6 text-sm font-medium text-[#4F4F4F]"
                            onClick={handleCancelEditGallery}
                            disabled={isUpdatingGallery}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            className="h-11 rounded-2xl bg-[#6E0112] px-6 text-sm font-semibold text-white hover:bg-[#5a010e]"
                            disabled={isUpdatingGallery}
                            onClick={handleSaveEditGallery}
                        >
                            {isUpdatingGallery ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Gallery Confirmation Dialog */}
            <AlertDialog
                open={!!deletingGalleryId}
                onOpenChange={(open) => !open && handleCancelDeleteGallery()}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus gambar?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus gambar ini? Tindakan ini
                            tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={handleCancelDeleteGallery}
                            disabled={isDeletingGallery}
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteGallery}
                            disabled={isDeletingGallery}
                            className="bg-[#C1272D] hover:bg-[#9C1A1C]"
                        >
                            {isDeletingGallery ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
