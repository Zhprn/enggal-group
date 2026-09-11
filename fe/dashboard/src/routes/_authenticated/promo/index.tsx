import * as React from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ApiError, apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import Edit from "@/assets/icons/edit.svg";

export const Route = createFileRoute("/_authenticated/promo/")({
  component: RouteComponent,
});

type PromoItem = {
  id: string;
  title: string;
  status: "aktif" | "archive";
  berlakuHingga: string;
  brand: {
    id: string,
    nama: string
  }
};

type PromoListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

async function fetchPromo({
  page,
  limit,
  status,
  startDate,
  endDate,
  sortBy,
  sortOrder,
}: {
  page: number;
  limit: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status && status !== "all") {
    params.set("status", status);
  }

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

  const response = await apiClient.get<PromoItem[], PromoListMeta>(
    `/promo?${params}`,
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

function RouteComponent() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [pagination, setPagination] = React.useState({ page: 1, limit: 15 });
  const [selectedStatus, setSelectedStatus] = React.useState<string>("aktif");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined,
  );
  const [sortConfig, setSortConfig] = React.useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({ sortBy: 'berlakuHingga', sortOrder: 'desc' });
  const queryClient = useQueryClient();
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(
    null,
  );
  const [statusTargetId, setStatusTargetId] = React.useState<string | null>(
    null,
  );

  const startDateParam = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : undefined;
  const endDateParam = dateRange?.to
    ? format(dateRange.to, "yyyy-MM-dd")
    : undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "promos",
      pagination.page,
      pagination.limit,
      selectedStatus,
      startDateParam ?? null,
      endDateParam ?? null,
      sortConfig.sortBy,
      sortConfig.sortOrder,
    ],
    queryFn: () =>
      fetchPromo({
        ...pagination,
        status: selectedStatus,
        startDate: startDateParam,
        endDate: endDateParam,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      }),
  });

  const promos = React.useMemo(() => {
    const items = data?.data ?? [];
    return items.filter((item) =>
      (item.brand.nama ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data?.data, searchTerm]);

  const handleLimitChange = (value: string) => {
    const newLimit = Number(value);
    setPagination((prev) => ({
      page: 1,
      limit: Number.isNaN(newLimit) ? prev.limit : newLimit,
    }));
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aktif" | "archive" }) => {
      await apiClient.patch(`/promo/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
      toast.success(
        variables.status === "archive"
          ? "Promo berhasil diarsipkan."
          : "Promo berhasil diaktifkan kembali."
      );
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof ApiError
          ? mutationError.message || "Gagal memperbarui status promo."
          : mutationError instanceof Error
            ? mutationError.message
            : "Gagal memperbarui status promo.";
      toast.error(message);
    },
    onSettled: () => {
      setStatusTargetId(null);
    },
  });

  const handleToggleStatus = (promo: PromoItem) => {
    const nextStatus = promo.status === "aktif" ? "archive" : "aktif";
    setStatusTargetId(promo.id);
    updateStatusMutation.mutate({ id: promo.id, status: nextStatus });
  };

  const deletePromoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/promo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
      toast.success("Promo berhasil dihapus.");
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof ApiError
          ? mutationError.message || "Gagal menghapus promo."
          : mutationError instanceof Error
            ? mutationError.message
            : "Gagal menghapus promo. Silakan coba lagi.";

      toast.error(message);
    },
    onSettled: () => {
      setDeleteTargetId(null);
    },
  });

  const { mutate: deletePromo, isPending: isDeletePending } =
    deletePromoMutation;

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    deletePromo(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold text-[#9C1A1C]">Daftar Promo</h1>
        <div className="flex space-x-4">
          

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] px-4 text-sm font-medium text-[#4F4F4F] hover:bg-[#f1f3f7]"
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
          <Button
            type="button"
            asChild
            className="h-12 rounded-2xl bg-[#6E0112] px-6 text-sm font-semibold text-white hover:bg-[#5a010e]"
          >
            <Link to="/promo/create">
              <Plus className="mr-2 size-4" />
              Tambah Promo
            </Link>
          </Button>
        </div>
      </div>
      <Card className="border-none shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#A25C67]" />
              <Input
                placeholder="Cari Promo"
                className="h-12 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] pl-11 text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            

            <div className="flex items-center gap-3 text-sm text-[#A25C67]">
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-12 w-36 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] px-4 text-sm font-medium text-[#4F4F4F]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-[#F0F1F3] bg-white">
              <SelectItem value="aktif">Promo Aktif</SelectItem>
              <SelectItem value="archive">Promo Arsip</SelectItem>
              <SelectItem value="all">Semua Status</SelectItem>
            </SelectContent>
          </Select>
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

          <div className="overflow-hidden rounded-3xl border border-[#F0F1F3] bg-white">
            <Table>
              <TableHeader className="bg-[#F6F7F9]">
                <TableRow className="border-b border-[#F0F1F3]">
                  <TableHead className="w-16 text-center text-[#9C1A1C]">
                    No
                  </TableHead>
                  <TableHead className="text-[#9C1A1C]">
                    <SortableHeader 
                      column="title" 
                      label="Nama Promo" 
                      sortConfig={sortConfig} 
                      onSort={handleSort} 
                    />
                  </TableHead>
                  <TableHead className="text-[#9C1A1C]">
                    <SortableHeader 
                      column="brand.nama" 
                      label="Brand" 
                      sortConfig={sortConfig} 
                      onSort={handleSort} 
                    />
                  </TableHead>
                  <TableHead className="w-40 text-[#9C1A1C]">
                    <SortableHeader 
                      column="berlakuHingga" 
                      label="Berlaku Hingga" 
                      sortConfig={sortConfig} 
                      onSort={handleSort} 
                    />
                  </TableHead>
                  <TableHead className="w-36 text-center text-[#9C1A1C]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-[#6B7280]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Memuat data promo...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-[#C1272D]"
                    >
                      Terjadi kesalahan saat memuat data promo.
                      <br />
                      <span className="text-xs text-[#9C1A1C]/70">
                        {(error as Error)?.message ?? "Silakan coba lagi."}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : promos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-[#6B7280]"
                    >
                      Tidak ada data promo yang tersedia.
                    </TableCell>
                  </TableRow>
                ) : (
                  promos.map((promo, index) => (
                    <TableRow
                      key={promo.id}
                      className="border-b border-[#F0F1F3]"
                    >
                      <TableCell className="text-center text-sm text-[#4F4F4F]">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#4F4F4F]">
                        {promo.title}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {promo.brand.nama}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {formatDisplayDate(promo.berlakuHingga)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            size="icon"
                            type="button"
                            asChild
                            className="h-10 w-10 rounded-xl bg-[#FFECC9] hover:bg-[#FFD700]"
                          >
                            <Link
                              to="/promo/$promoId/edit"
                              params={{ promoId: promo.id }}
                            >
                              <img
                                src={Edit}
                                alt="Edit promo"
                                className="size-4"
                              />
                            </Link>
                          </Button>

                          <Button
                            size="icon"
                            type="button"
                            onClick={() => handleToggleStatus(promo)}
                            disabled={updateStatusMutation.isPending && statusTargetId === promo.id}
                            className={`h-10 w-10 rounded-xl ${
                              promo.status === "aktif"
                                ? "bg-[#E0E7FF] text-[#3730A3] hover:bg-[#C7D2FE]"
                                : "bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]"
                            }`}
                            title={promo.status === "aktif" ? "Arsipkan Promo" : "Aktifkan Promo"}
                          >
                            {updateStatusMutation.isPending && statusTargetId === promo.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : promo.status === "aktif" ? (
                              <Archive className="size-4" />
                            ) : (
                              <ArchiveRestore className="size-4" />
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                type="button"
                                className="h-10 w-10 rounded-xl bg-[#C1272D] hover:bg-[#a01f24]"
                                disabled={
                                  isDeletePending && deleteTargetId === promo.id
                                }
                              >
                                {isDeletePending &&
                                  deleteTargetId === promo.id ? (
                                  <Loader2 className="size-4 animate-spin text-white" />
                                ) : (
                                  <Trash2 className="size-4 text-white" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Hapus promo ini?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Promo
                                  yang dihapus akan hilang secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-2xl">
                                  Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-2xl bg-[#C1272D] hover:bg-[#a01f24]"
                                  disabled={
                                    isDeletePending &&
                                    deleteTargetId === promo.id
                                  }
                                  onClick={() => handleDelete(promo.id)}
                                >
                                  {isDeletePending &&
                                    deleteTargetId === promo.id ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                  ) : null}
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
