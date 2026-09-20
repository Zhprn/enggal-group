import * as React from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Trash2, Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Edit from "@/assets/icons/edit.svg";

type Brand = {
  id: number;
  nama: string;
  logo: string;
  description: string;
};

type BrandListMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

async function fetchBrand({ page, limit }: { page: number; limit: number }) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiClient.get<Brand[], BrandListMeta>(
    `/brand?${params}`,
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

export const Route = createFileRoute("/_authenticated/brand/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [pagination, setPagination] = React.useState({ page: 1, limit: 15 });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["brands", pagination.page, pagination.limit],
    queryFn: () =>
      fetchBrand({
        ...pagination,
      }),
  });

  const brands = React.useMemo(() => {
    const items = data?.data ?? [];
    return items.filter((item) =>
      (item.nama ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data?.data, searchTerm]);

  const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(
    null,
  );

  const queryClient = useQueryClient();

  const { mutate: mutateDeleteBrand, isPending: isDeletePending } = useMutation(
    {
      mutationFn: async (id: number) => {
        await apiClient.delete(`/brand/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        toast.success("Brand berhasil dihapus.");
      },
      onError: (mutationError: unknown) => {
        const message =
          mutationError instanceof ApiError
            ? mutationError.message || "Gagal menghapus brand."
            : mutationError instanceof Error
              ? mutationError.message
              : "Gagal menghapus brand. Silakan coba lagi.";

        toast.error(message);
      },
      onSettled: () => {
        setDeleteTargetId(null);
      },
    },
  );

  const handleSearchTermChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchTerm(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleLimitChange = (value: string) => {
    const newLimit = Number(value);
    setPagination((prev) => ({
      page: 1,
      limit: Number.isNaN(newLimit) ? prev.limit : newLimit,
    }));
  };

  const totalItems = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  React.useEffect(() => {
    if (!isLoading && pagination.page > totalPages) {
      setPagination((prev) => ({
        ...prev,
        page: totalPages,
      }));
    }
  }, [isLoading, pagination.page, totalPages]);

  const handlePageChange = (direction: "prev" | "next") => {
    setPagination((prev) => {
      const nextPage =
        direction === "prev"
          ? Math.max(1, prev.page - 1)
          : Math.min(totalPages, prev.page + 1);
      if (nextPage === prev.page) {
        return prev;
      }
      return {
        ...prev,
        page: nextPage,
      };
    });
  };

  const isPrevDisabled = pagination.page <= 1 || isLoading;
  const isNextDisabled = pagination.page >= totalPages || isLoading;
  const shouldShowPagination = totalPages > 1;
  const startItemIndex =
    totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItemIndex =
    totalItems === 0
      ? 0
      : Math.min(totalItems, pagination.page * pagination.limit);

  const handleDeleteBrand = (id: number) => {
    setDeleteTargetId(id);
    mutateDeleteBrand(id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#9C1A1C]">Daftar Brand</h1>
      <Card className="border-none shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#A25C67]" />
                <Input
                  placeholder="Cari Nama Brand"
                  className="h-12 rounded-2xl border border-[#F0F1F3] bg-[#F9FBFD] pl-11 text-sm text-[#4F4F4F] ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchTerm}
                  onChange={handleSearchTermChange}
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
            <Button
              type="button"
              onClick={() => navigate({ to: "/brand/create" })}
              className="h-12 rounded-2xl bg-[#6E0112] px-6 text-sm font-semibold text-white hover:bg-[#5a010e]"
            >
              <Plus className="mr-2 size-4" />
              Tambah Brand
            </Button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[#F0F1F3] bg-white">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-[#F6F7F9]">
                <TableRow className="border-b border-[#F0F1F3]">
                  <TableHead className="w-16 text-center text-[#9C1A1C]">
                    No
                  </TableHead>
                  <TableHead className="w-32 text-[#9C1A1C]">
                    Logo Brand
                  </TableHead>
                  <TableHead className="text-[#9C1A1C]">Nama Brand</TableHead>
                  <TableHead className="text-[#9C1A1C]">
                    Deskripsi Brand
                  </TableHead>
                  <TableHead className="w-32 text-center text-[#9C1A1C]">
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
                        Memuat data brand...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-[#C1272D]"
                    >
                      Terjadi kesalahan saat memuat data brand.
                      <br />
                      <span className="text-xs text-[#9C1A1C]/70">
                        {(error as Error)?.message ?? "Silakan coba lagi."}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : brands.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-[#6B7280]"
                    >
                      Tidak ada brand yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand, index) => (
                    <TableRow
                      key={brand.id}
                      className="border-b border-[#F0F1F3]"
                    >
                      <TableCell className="text-center text-sm text-[#4F4F4F]">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <img
                          src={brand.logo}
                          className="flex h-12 w-12 items-center justify-center rounded-full object-contain object-center bg-[#FFF3E0]"
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#4F4F4F]">
                        {brand.nama}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280] max-w-[300px] truncate">
                        {brand.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-[#FFECC9] hover:bg-[#FFD700]"
                            type="button"
                            onClick={() =>
                              navigate({
                                to: "/brand/$brandId/edit",
                                params: { brandId: String(brand.id) },
                              })
                            }
                          >
                            <img
                              src={Edit}
                              alt="Edit promo"
                              className="size-4"
                            />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                type="button"
                                className="h-10 w-10 rounded-xl bg-[#C1272D] hover:bg-[#a01f24]"
                                disabled={
                                  isDeletePending && deleteTargetId === brand.id
                                }
                              >
                                {isDeletePending &&
                                  deleteTargetId === brand.id ? (
                                  <Loader2 className="size-4 animate-spin text-white" />
                                ) : (
                                  <Trash2 className="size-4 text-white" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Hapus brand ini?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Brand
                                  yang dihapus tidak bisa dikembalikan.
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
                                    deleteTargetId === brand.id
                                  }
                                  onClick={() => handleDeleteBrand(brand.id)}
                                >
                                  {isDeletePending &&
                                    deleteTargetId === brand.id ? (
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
          {shouldShowPagination ? (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#6B7280]">
                Menampilkan {startItemIndex}-{endItemIndex} dari {totalItems}{" "}
                brand
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-2xl border border-[#D6DAE1] bg-white px-4 text-sm font-medium text-[#4F4F4F]"
                  onClick={() => handlePageChange("prev")}
                  disabled={isPrevDisabled}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm font-medium text-[#4F4F4F]">
                  Halaman {pagination.page} dari {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-2xl border border-[#D6DAE1] bg-white px-4 text-sm font-medium text-[#4F4F4F]"
                  onClick={() => handlePageChange("next")}
                  disabled={isNextDisabled}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
