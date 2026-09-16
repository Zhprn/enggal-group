import * as React from "react";

import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  Eye,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { API_BASE_URL, apiClient } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Users from "@/assets/icons/jumlahusercareer.svg";

export const Route = createFileRoute("/_authenticated/membership/")({
  component: RouteComponent,
});

type Membership = {
  id: string;
  membershipId: string;
  nama: string;
  email: string;
  no_hp: string;
  jenis_kelamin: string;
  kota: string;
  tanggal_lahir: string;
  createdAt: string;
  updatedAt: string;
};

type MembershipListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type MembershipTemplate = {
  frontImage: string;
  backImage: string;
};

type MembershipTemplateConfig = {
  textColor: string;
  fontSize: number;
};

type DashboardStats = {
  totalUserCareer: number;
  totalBrand: number;
  totalBerita: number;
  totalOutlet: number;
  totalMembership: number;
  todayNewMembers: number;
};

async function fetchMemberships({
  page,
  limit,
  startDate,
  endDate,
  sortBy,
  sortOrder,
}: {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (startDate) {
    params.set("startDate", startDate);
  }

  if (endDate) {
    params.set("endDate", endDate);
  }

  if (sortBy) {
    params.set("sortBy", sortBy);
  }

  if (sortOrder) {
    params.set("sortOrder", sortOrder);
  }

  const response = await apiClient.get<Membership[], MembershipListMeta>(
    `/membership?${params}`,
  );

  const items = response.data ?? [];
  const meta = response.meta ?? {};

  return {
    data: items,
    meta: {
      total: meta.total ?? items.length,
      page: meta.page ?? page,
      limit: meta.limit ?? limit,
    },
  };
}

async function downloadMembershipExcel(params?: {
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortOrder) query.set("sortOrder", params.sortOrder);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;

  const response = await fetch(`${API_BASE_URL}/membership/export/excel?${query.toString()}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Gagal mengunduh file Excel membership.");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute(
    "download",
    `data-membership-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

async function fetchTemplate() {
  return apiClient.get<MembershipTemplate>("/membership/template");
}

async function fetchTemplateConfig() {
  return apiClient.get<MembershipTemplateConfig>("/membership/template/config");
}

async function fetchDashboardStats() {
  const response = await apiClient.get<DashboardStats>("/dashboard");
  return response.data;
}

function formatDisplayDate(date?: string) {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return format(parsed, "dd-MM-yyyy");
}

function SortableHeader({
  column,
  label,
  sortConfig,
  onSort,
}: {
  column: string;
  label: string;
  sortConfig: { sortBy: string; sortOrder: 'asc' | 'desc' };
  onSort: (column: string) => void;
}) {
  const isActive = sortConfig.sortBy === column;
  
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-[#6E0112] transition-colors"
    >
      {label}
      {!isActive && (
        <ArrowUpDown className="h-3 w-3 text-[#9C1A1C]/50" />
      )}
      {isActive && (
        sortConfig.sortOrder === 'asc' ? (
          <span className="text-[#6E0112]">↑</span>
        ) : (
          <span className="text-[#6E0112]">↓</span>
        )
      )}
    </button>
  );
}

function DeleteButton({
  membership,
  onDelete
}: {
  membership: Membership;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDialog, setShowDialog] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(membership.id);
      setShowDialog(false);
      toast.success("Data membership berhasil dihapus");
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error("Gagal menghapus data membership");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#9C1A1C]">Konfirmasi Hapus</DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Apakah Anda yakin ingin menghapus membership dari <span className="font-semibold text-[#4F4F4F]">{membership.nama}</span>?
            <br />
            <span className="text-xs text-red-500">Tindakan ini tidak dapat dibatalkan.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDialog(false)}
            disabled={isDeleting}
            className="rounded-xl border-[#F0F1F3] bg-[#F9FBFD] text-[#4F4F4F] hover:bg-[#f1f3f7]"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl bg-[#C1272D] hover:bg-[#C1272D]/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewButton({
  membership,
}: {
  membership: Membership;
}) {
  const [showDialog, setShowDialog] = React.useState(false);
  const [timestamp, setTimestamp] = React.useState(Date.now());

  const { data: template } = useQuery({
    queryKey: ["membership-template"],
    queryFn: fetchTemplate,
  });

  const { data: config } = useQuery({
    queryKey: ["membership-template-config"],
    queryFn: fetchTemplateConfig,
  });

  React.useEffect(() => {
    if (showDialog) {
      setTimestamp(Date.now());
    }
  }, [showDialog]);

  const textColor = config?.data?.textColor ?? "#333333";
  const fontSize = config?.data?.fontSize ?? 12;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#9C1A1C]">Preview Kartu Membership</DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            {membership.nama} ({membership.membershipId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-4 items-center">
            <div>
              <p className="text-sm font-medium text-[#4F4F4F] mb-2 text-center">Depan</p>
              <div
                className="rounded-xl overflow-hidden relative bg-gray-100"
                style={{ width: '336px', height: '192px' }}
              >
                {template?.data?.frontImage ? (
                  <>
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${template.data.frontImage}?t=${timestamp}`}
                      alt="Template Depan"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 left-0 w-full h-full" style={{ padding: '20px' }}>
                      <div
                        className="font-bold"
                        style={{
                          color: '#FFFFFF',
                          fontSize: `${fontSize * 0.9}px`,
                          fontFamily: 'var(--font-runestars)',
                        }}
                      >
                        {membership.membershipId}
                      </div>
                      <div
                        className="font-bold"
                        style={{
                          marginTop: '0px',
                          color: textColor,
                          textShadow: `1px 1px 0 #FFB835, -1px -1px 0 #FFB835, -1px 1px 0 #FFB835, 1px -1px 0 #FFB835, 0 1px 0 #FFB835, 0 -1px 0 #FFB835, 1px 0 0 #FFB835, -1px 0 0 #FFB835`,
                          fontSize: `${fontSize * 0.9}px`,
                          fontFamily: 'var(--font-runestars)',
                        }}
                      >
                        {membership.nama}
                      </div>
                      <div style={{ display: 'flex', marginLeft: '28px', marginTop: '6px', fontSize: `${fontSize * 0.6}px`, fontFamily: 'var(--font-runestars)' }}>
                        <div style={{ color: textColor, marginRight: '30px' }}>
                          {new Date(membership.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ color: textColor }}>
                          {membership.no_hp}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center">
                    <p className="text-sm text-gray-500">Belum ada template</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#4F4F4F] mb-2 text-center">Belakang</p>
              <div
                className="rounded-xl overflow-hidden bg-gray-100"
                style={{ width: '336px', height: '192px' }}
              >
                {template?.data?.backImage ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${template.data.backImage}?t=${timestamp}`}
                    alt="Template Belakang"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center">
                    <p className="text-sm text-gray-500">Belum ada template</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDialog(false)}
            className="rounded-xl border-[#F0F1F3] bg-[#F9FBFD] text-[#4F4F4F] hover:bg-[#f1f3f7]"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateManagementDialog() {
  const [showDialog, setShowDialog] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["membership-template"],
    queryFn: fetchTemplate,
  });

  const [timestamp, setTimestamp] = React.useState(Date.now());

  React.useEffect(() => {
    setTimestamp(Date.now());
  }, [showDialog]);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["membership-template-config"],
    queryFn: fetchTemplateConfig,
  });

  const [textColor, setTextColor] = React.useState(config?.data?.textColor ?? "#333333");
  const [fontSize, setFontSize] = React.useState(config?.data?.fontSize ?? 12);

  React.useEffect(() => {
    if (config?.data) {
      setTextColor(config.data.textColor);
      setFontSize(config.data.fontSize);
    }
  }, [config]);

  const [frontImageFile, setFrontImageFile] = React.useState<File | null>(null);
  const [backImageFile, setBackImageFile] = React.useState<File | null>(null);
  const [frontPreview, setFrontPreview] = React.useState<string | null>(null);
  const [backPreview, setBackPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (showDialog) {
      setFrontPreview(null);
      setBackPreview(null);
    }
  }, [showDialog]);

  const updateConfigMutation = useMutation({
    mutationFn: async (configData: { textColor: string; fontSize: number }) => {
      return apiClient.post("/membership/template/config", configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-template-config"] });
    },
    onError: (error) => {
      console.error("Failed to update config:", error);
      toast.error("Gagal memperbarui konfigurasi template");
    },
  });

  const uploadFrontTemplateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("frontImage", file);
      return apiClient.post("/membership/template/front", formData);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["membership-template"] });
      setFrontImageFile(null);
    },
  });

  const uploadBackTemplateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("backImage", file);
      return apiClient.post("/membership/template/back", formData);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["membership-template"] });
      setBackImageFile(null);
    },
  });

  const handleFrontImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFrontImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = async () => {
    const uploadPromises: Promise<unknown>[] = [];

    if (frontImageFile) {
      uploadPromises.push(uploadFrontTemplateMutation.mutateAsync(frontImageFile));
    }

    if (backImageFile) {
      uploadPromises.push(uploadBackTemplateMutation.mutateAsync(backImageFile));
    }

    try {
      await Promise.all([...uploadPromises, updateConfigMutation.mutateAsync({ textColor, fontSize })]);
      await queryClient.refetchQueries({ queryKey: ["membership-template"] });
      setTimestamp(Date.now());
      toast.success("Template berhasil diperbarui");
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error("Gagal memperbarui template");
    }
  };

  const isLoading = templateLoading || configLoading ||
    updateConfigMutation.isPending ||
    uploadFrontTemplateMutation.isPending ||
    uploadBackTemplateMutation.isPending;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-2xl bg-[#6E0112] px-4 text-sm text-white hover:bg-[#6E0112] hover:text-white"
        >
          <UploadCloud className="mr-2 size-4" />
          Kelola Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#9C1A1C]">Kelola Template Membership</DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            Upload gambar template dan konfigurasi kartu membership
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Front Template Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#4F4F4F]">
              Template Depan
            </Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="w-full">
                  <div className="w-full h-48 border-2 border-dashed border-[#E0E0E0] rounded-xl flex items-center justify-center bg-[#F9FAFB]">
                    {frontPreview ? (
                      <img
                        src={frontPreview}
                        alt="Template Depan"
                        className="max-h-full max-w-full object-cover"
                      />
                    ) : template?.data?.frontImage ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}${template.data.frontImage}`}
                        alt="Template Depan"
                        className="max-h-full max-w-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-sm text-[#9CA3AF]">
                        <Upload className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>Belum ada template</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontImageChange}
                    className="cursor-pointer"
                    id="front-image-upload"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Back Template Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#4F4F4F]">
              Template Belakang
            </Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="w-full">
                  <div className="w-full h-48 border-2 border-dashed border-[#E0E0E0] rounded-xl flex items-center justify-center bg-[#F9FAFB]">
                    {backPreview ? (
                      <img
                        src={backPreview}
                        alt="Template Depan"
                        className="max-h-full max-w-full object-cover"
                      />
                    ) : template?.data?.backImage ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}${template.data.backImage}`}
                        alt="Template Belakang"
                        className="max-h-full max-w-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-sm text-[#9CA3AF]">
                        <Upload className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>Belum ada template</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleBackImageChange}
                    className="cursor-pointer"
                    id="back-image-upload"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Config Section */}
          <div className="space-y-4 border-t border-[#E0E0E0] pt-4">
            <h3 className="text-base font-semibold text-[#9C1A1C] mb-4">Konfigurasi Teks</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="textColor" className="text-sm font-medium text-[#4F4F4F]">
                  Warna Teks
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="textColor"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="#333333"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize" className="text-sm font-medium text-[#4F4F4F]">
                  Ukuran Font (px)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="fontSize"
                    type="number"
                    min="8"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-[#E0E0E0] pt-4">
              <h3 className="text-base font-semibold text-[#9C1A1C] mb-4">Preview Kartu</h3>
              <div className="flex flex-col gap-4 items-center">
                <div>
                  <p className="text-sm font-medium text-[#4F4F4F] mb-2 text-center">Depan</p>
                  <div
                    className="rounded-xl overflow-hidden relative bg-gray-100"
                    style={{ width: '336px', height: '192px' }}
                  >
                    {template?.data?.frontImage ? (
                      <>
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL}${template.data.frontImage}?t=${timestamp}`}
                          alt="Template Depan Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 left-0 w-full h-full" style={{ padding: '20px' }}>
                          <div
                            className="font-bold"
                            style={{
                              color: '#FFFFFF',
                              fontSize: `${fontSize * 0.7}px`,
                              fontFamily: 'var(--font-runestars)',
                            }}
                          >
                            EGI-2026-0001
                          </div>
                          <div
                            className="font-bold"
                            style={{
                              marginTop: '4px',
                              color: textColor,
                              textShadow: `1px 1px 0 #FFB835, -1px -1px 0 #FFB835, -1px 1px 0 #FFB835, 1px -1px 0 #FFB835, 0 1px 0 #FFB835, 0 -1px 0 #FFB835, 1px 0 0 #FFB835, -1px 0 0 #FFB835`,
                              fontSize: `${fontSize * 0.7}px`,
                              fontFamily: 'var(--font-runestars)',
                            }}
                          >
                            Enggal Group Indonesia
                          </div>
                          <div style={{ display: 'flex', marginTop: '20px', marginLeft: '26px', fontSize: `${fontSize * 0.5}px`, fontFamily: 'var(--font-runestars)' }}>
                            <div style={{ color: textColor, marginRight: '44px' }}>
                              1/1/2026
                            </div>
                            <div style={{ color: textColor }}>
                              081234567890
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center">
                        <p className="text-sm text-gray-500">Belum ada template</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#4F4F4F] mb-2 text-center">Belakang</p>
                  <div
                    className="rounded-xl overflow-hidden bg-gray-100"
                    style={{ width: '336px', height: '192px' }}
                  >
                    {template?.data?.backImage ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}${template.data.backImage}?t=${timestamp}`}
                        alt="Template Belakang Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center">
                        <p className="text-sm text-gray-500">Belum ada template</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Preview menggunakan data contoh. Kartu asli akan menggunakan data member yang terdaftar.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDialog(false)}
            disabled={isLoading}
            className="rounded-xl border-[#F0F1F3] bg-[#F9FBFD] text-[#4F4F4F] hover:bg-[#f1f3f7]"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSaveConfig}
            disabled={isLoading}
            className="rounded-xl bg-[#6E0112] hover:bg-[#5a010e]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RouteComponent() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [pagination, setPagination] = React.useState({ page: 1, limit: 15 });
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [sortConfig, setSortConfig] = React.useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [isExporting, setIsExporting] = React.useState(false);

  const {
    data: dashboardStats,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const numberFormatter = React.useMemo(
    () => new Intl.NumberFormat("id-ID"),
    [],
  );

  const startDateParam = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : undefined;
  const endDateParam = dateRange?.to
    ? format(dateRange.to, "yyyy-MM-dd")
    : undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "memberships",
      pagination.page,
      pagination.limit,
      startDateParam ?? null,
      endDateParam ?? null,
      sortConfig.sortBy,
      sortConfig.sortOrder,
    ],
    queryFn: () =>
      fetchMemberships({
        ...pagination,
        startDate: startDateParam,
        endDate: endDateParam,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      }),
  });

  const queryClient = useQueryClient();

  const deleteMembershipMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/membership/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
    },
  });

  const memberships = React.useMemo(() => {
    const items = data?.data ?? [];
    return items.filter((item) =>
      (item.nama ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.no_hp ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kota ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tanggal_lahir ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.data, searchTerm]);

  const handleLimitChange = (value: string) => {
    const newLimit = Number(value);
    setPagination((prev) => ({
      page: 1,
      limit: Number.isNaN(newLimit) ? prev.limit : newLimit,
    }));
  };

  const handleDateRangeChange = (value: DateRange | undefined) => {
    setDateRange(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (column: string) => {
    setSortConfig((prev) => {
      if (prev.sortBy === column) {
        return { sortBy: column, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      return { sortBy: column, sortOrder: 'asc' };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await downloadMembershipExcel({
        startDate: startDateParam,
        endDate: endDateParam,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      });
      toast.success("Data membership berhasil diekspor ke Excel.");
    } catch (err) {
      toast.error((err as Error)?.message || "Gagal mengekspor file Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const membershipStats = React.useMemo(
    () => [
      {
        label: "Total Member",
        value: dashboardStats?.totalMembership ?? 0,
        img: Users,
      },
      {
        label: "Member Baru Hari Ini",
        value: dashboardStats?.todayNewMembers ?? 0,
        img: Users,
      },
    ],
    [dashboardStats],
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#9C1A1C]">
          Daftar Membership
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 bg-white py-6 px-4 rounded-md">
          {membershipStats.map((stat) => (
            <Card key={stat.label} className="border-[#E0E0E0] ">
              <CardContent className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#B2B2B2]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#2E2E2E]">
                    {isDashboardLoading
                      ? "Memuat..."
                      : isDashboardError
                        ? "—"
                        : numberFormatter.format(stat.value)}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E99E16] text-[#9C0000]">
                  <img src={stat.img} className="size-7" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {isDashboardError && (
          <p className="text-sm text-[#C1272D]">
            {dashboardError instanceof Error
              ? dashboardError.message
              : "Gagal memuat statistik membership."}
          </p>
        )}
      </section>

      <section className="space-y-4 overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-[#9C1A1C]">
            Daftar Membership
          </h2>
          <div className="flex gap-3 flex-shrink-0 items-center">
            <Button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || isLoading}
              className="h-12 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] px-5 text-sm font-semibold text-[#4F4F4F] hover:bg-[#f1f3f7]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 size-4 text-[#A25C67]" />
                  Export Excel
                </>
              )}
            </Button>

            <TemplateManagementDialog />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] px-4 text-sm font-medium text-[#4F4F4F] hover:bg-[#f1f3f7] whitespace-nowrap"
                >
                  <CalendarIcon className="mr-2 size-4 text-[#A25C67]" />
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "MMM dd yyyy")} - ${format(
                      dateRange.to,
                      "MMM dd yyyy",
                    )}`
                    : dateRange?.from
                      ? `${format(dateRange.from, "MMM dd yyyy")} - …`
                      : "Pilih Rentang Tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto rounded-2xl border border-[#F0F1F3] bg-white p-4"
                align="end"
              >
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from ?? dateRange?.to ?? new Date()}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="space-y-6 p-6 overflow-hidden">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 w-full">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#A25C67]" />
                  <Input
                    placeholder="Cari Nama, Email, No HP, Kota, atau Tanggal Lahir"
                    className="h-12 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] pl-11 text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 text-sm text-[#A25C67]">
                  <span>Page</span>
                  <Select
                    value={String(pagination.limit)}
                    onValueChange={handleLimitChange}
                  >
                    <SelectTrigger className="h-12 w-24 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] text-[#4F4F4F]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#F0F1F3] bg-white overflow-x-auto max-w-[1000px] 2xl:max-w-none">
              <Table className="w-full">
                <TableHeader className="bg-[#F6F7F9]">
                  <TableRow className="border-b border-[#F0F1F3]">
                    <TableHead className="w-16 text-center text-[#9C1A1C]">
                      No
                    </TableHead>
                    <TableHead className="w-40 text-[#9C1A1C]">
                      <SortableHeader 
                        column="createdAt" 
                        label="Tanggal Daftar" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="w-48 text-[#9C1A1C]">
                      <SortableHeader 
                        column="membershipId" 
                        label="Membership ID" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="text-[#9C1A1C]">
                      <SortableHeader 
                        column="nama" 
                        label="Nama" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="w-32 text-[#9C1A1C]">
                      <SortableHeader 
                        column="jenis_kelamin" 
                        label="Jenis Kelamin" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="text-[#9C1A1C]">
                      <SortableHeader 
                        column="kota" 
                        label="Kota" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="text-[#9C1A1C]">
                      <SortableHeader 
                        column="tanggal_lahir" 
                        label="Tanggal Lahir" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="w-40 text-[#9C1A1C]">
                      <SortableHeader 
                        column="no_hp" 
                        label="Nomor Whatsapp" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="text-[#9C1A1C]">
                      <SortableHeader 
                        column="email" 
                        label="Email" 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                      />
                    </TableHead>
                    <TableHead className="w-40 text-center text-[#9C1A1C]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-12 text-center text-sm text-[#6B7280]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Memuat data ...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-12 text-center text-sm text-[#C1272D]"
                      >
                        Terjadi kesalahan saat memuat data.
                        <br />
                        <span className="text-xs text-[#9C1A1C]/70">
                          {(error as Error)?.message ?? "Silakan coba lagi."}
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : memberships.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-12 text-center text-sm text-[#6B7280]"
                      >
                        Tidak ada data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    memberships.map((membership, index) => (
                      <TableRow
                        key={membership.id}
                        className="border-b border-[#F0F1F3]"
                      >
                        <TableCell className="text-center text-sm text-[#4F4F4F]">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell className="text-sm text-[#4F4F4F]">
                          {formatDisplayDate(membership.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-[#4F4F4F]">
                          {membership.membershipId}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-[#4F4F4F]">
                          {membership.nama}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {membership.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {membership.kota}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {formatDisplayDate(membership.tanggal_lahir)}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {membership.no_hp}
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {membership.email}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <PreviewButton membership={membership} />
                            <DeleteButton
                              membership={membership}
                              onDelete={async (id: string) => {
                                await deleteMembershipMutation.mutateAsync(id);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6 pt-4 border-t border-[#F0F1F3]">
              <div className="text-sm text-[#6B7280]">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} sampai{" "}
                {Math.min(pagination.page * pagination.limit, data?.meta.total ?? 0)} dari{" "}
                {numberFormatter.format(data?.meta.total ?? 0)} data
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || isLoading}
                  className="h-10 rounded-xl border border-[#F0F1F3] bg-[#F9FBFD] text-[#4F4F4F] hover:bg-[#f1f3f7]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil((data?.meta.total ?? 0) / pagination.limit)) }, (_, i) => {
                    const totalPages = Math.ceil((data?.meta.total ?? 0) / pagination.limit);
                    let pageNumber;

                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.page >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        type="button"
                        variant={pagination.page === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: pageNumber }))}
                        disabled={isLoading}
                        className={`h-10 w-10 rounded-xl ${pagination.page === pageNumber
                          ? "bg-[#6E0112] text-white hover:bg-[#5a010e]"
                          : "border border-[#F0F1F3] bg-[#F9FBFD] text-[#4F4F4F] hover:bg-[#f1f3f7]"
                          }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil((data?.meta.total ?? 0) / pagination.limit) || isLoading}
                  className="h-10 rounded-xl border border-[#F0F1F3] bg-[#F9FBFD] text-[#4F4F4F] hover:bg-[#f1f3f7]"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}