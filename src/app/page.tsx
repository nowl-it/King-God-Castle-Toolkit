"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_PACKAGE_ID } from "@/utils/consts";
import { log } from "@/utils/logger";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const InstallFormSchema = z.object({
	version: z
		.string({
			error: () => ({ message: "Vui lòng chọn phiên bản" }),
		})
		.min(2)
		.max(100),
});

export default function ToolPage() {
	const [activeTab, setActiveTab] = useState("install");
	const [downloadedPath, setDownloadedPath] = useState<string | null>(null);

	// --- Install Logic ---
	const [installSavePath, setInstallSavePath] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const installForm = useForm<z.infer<typeof InstallFormSchema>>({
		resolver: zodResolver(InstallFormSchema),
	});

	const versionsQuery = useQuery({
		queryKey: ["get_app_versions", APP_PACKAGE_ID],
		queryFn: (): Promise<string[]> =>
			invoke("get_app_versions", {
				appName: APP_PACKAGE_ID,
			}),
		staleTime: 10 * 60 * 1000,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	const downloadMutation = useMutation({
		mutationFn: ({
			appName,
			version,
			outPath,
		}: { appName: string; version: string; outPath: string }) =>
			invoke("download_app", { appName, version, outPath }),
		onMutate: () => {
			toast("🚀 Bắt đầu tải...", {
				description: "Đang tải file XAPK, vui lòng đợi...",
				duration: 3000,
			});
		},
		onSuccess: () => {
			toast("🎉 Tải thành công!", {
				description: `Đã lưu tại: ${installSavePath}`,
				duration: 5000,
			});
			// Auto switch to convert tab and set path
			if (installSavePath) {
				// Assuming the file name format, but we only have the directory here.
				// Ideally we should get the full file path from the backend response.
				// For now, we just switch tabs.
				setDownloadedPath(installSavePath); // This might need adjustment if it's just a dir
				setActiveTab("convert");
			}
		},
		onError: (error: Error) => {
			log.error("Download error in install page", "ToolPage", { error });
			let errorMessage = "Có lỗi xảy ra khi tải file";
			if (error?.message) {
				if (error.message.includes("timeout")) {
					errorMessage =
						"Tải file bị timeout. Vui lòng kiểm tra kết nối mạng và thử lại.";
				} else if (error.message.includes("No buffer space available")) {
					errorMessage = "Hệ thống đang quá tải. Vui lòng đợi và thử lại sau.";
				} else if (error.message.includes("network")) {
					errorMessage = "Lỗi kết nối mạng, kiểm tra internet của bạn";
				} else {
					errorMessage = error.message;
				}
			}
			toast("❌ Tải thất bại!", {
				description: errorMessage,
				duration: 6000,
			});
		},
	});

	async function onInstallSubmit(data: z.infer<typeof InstallFormSchema>) {
		if (downloadMutation.isPending) {
			toast("⚠️ Đang có quá trình tải khác, vui lòng đợi.");
			return;
		}

		const saveTo = await open({
			directory: true,
			multiple: false,
			save: true,
			title: "Chọn nơi lưu file",
		});
		if (!saveTo) {
			toast("⚠️ Bạn chưa chọn nơi lưu file.");
			return;
		}

		setInstallSavePath(saveTo);

		toast("📦 Bắt đầu tải...", {
			description: `Phiên bản: ${data.version}`,
			duration: 3000,
		});

		try {
			await downloadMutation.mutateAsync({
				appName: APP_PACKAGE_ID,
				version: data.version,
				outPath: saveTo,
			});
		} catch (error) {
			// Error handled in mutation
		}
	}

	// --- Convert Logic ---
	const [c2uAppPath, setC2uAppPath] = useState<string | null>(null);
	const [c2uExportPath, setC2uExportPath] = useState<string | null>(null);

	const assetRipperCheckerQuery = useQuery({
		queryKey: ["check_asset_ripper", APP_PACKAGE_ID],
		queryFn: (): Promise<string[]> => invoke("check_asset_ripper"),
		staleTime: 10 * 60 * 1000,
	});

	const C2UMutation = useMutation({
		mutationFn: ({ appPath, outPath }: { appPath: string; outPath: string }) =>
			invoke("c2u", { appPath, outPath }),
		onSuccess: () => {
			toast("🎉 Chuyển đổi thành công!", {
				description: `Đã lưu tại: ${c2uExportPath}`,
				duration: 5000,
			});
		},
		onError: (error: Error) => {
			toast("❌ Chuyển đổi thất bại!", {
				description: error ? error.message : "Có lỗi xảy ra khi chuyển đổi file",
				duration: 5000,
			});
		},
	});

	async function checkAppPath() {
		const saveTo = await open({
			title: "Chọn ứng dụng (.xapk)",
			directory: false,
			multiple: false,
			defaultPath: downloadedPath || undefined,
		});
		if (!saveTo) {
			toast("⚠️ Bạn chưa chọn file.");
			return;
		}
		setC2uAppPath(saveTo);
	}

	async function checkExportPath() {
		const saveTo = await open({
			title: "Chọn nơi lưu dự án Unity",
			directory: true,
			multiple: false,
		});
		if (!saveTo) {
			toast("⚠️ Bạn chưa chọn nơi lưu file.");
			return;
		}
		setC2uExportPath(saveTo);
	}

	async function onConvertSubmit() {
		if (!c2uAppPath) {
			toast("⚠️ Bạn chưa chọn ứng dụng.");
			return;
		}
		if (!c2uExportPath) {
			toast("⚠️ Bạn chưa chọn nơi lưu file.");
			return;
		}
		try {
			await C2UMutation.mutateAsync({
				appPath: c2uAppPath,
				outPath: c2uExportPath,
			});
		} catch (error) {
			log.error("Convert to Unity failed", "ToolPage", {
				appPath: c2uAppPath,
				exportPath: c2uExportPath,
				error,
			});
		}
	}

	return (
		<section className="flex h-full w-full flex-col items-center justify-center gap-6 p-4">
			<Card className="w-full max-w-2xl border-0 shadow-2xl backdrop-blur-md bg-background/60">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<CardHeader>
						<div className="flex items-center justify-between mb-4">
							<div>
								<CardTitle className="text-2xl font-bold">Bộ Công Cụ</CardTitle>
								<CardDescription className="text-base mt-2">
									Hỗ trợ King God Castle
								</CardDescription>
							</div>
						</div>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="install">Tải Game</TabsTrigger>
							<TabsTrigger value="convert">Chuyển đổi</TabsTrigger>
						</TabsList>
					</CardHeader>
					<CardContent>
						<TabsContent value="install" className="space-y-4">
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-primary">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
										<polyline points="7 10 12 15 17 10" />
										<line x1="12" x2="12" y1="15" y2="3" />
									</svg>
									<h3 className="font-semibold">Tải phiên bản game</h3>
								</div>

								{versionsQuery.isLoading ? (
									<div className="flex justify-center p-4">
										<Spinner size="large" />
									</div>
								) : versionsQuery.error ? (
									<Alert variant="destructive">
										<AlertCircleIcon className="h-4 w-4" />
										<AlertTitle>Lỗi</AlertTitle>
										<AlertDescription>
											Không thể tải danh sách phiên bản.
											<Button
												variant="link"
												className="pl-2 h-auto p-0 text-destructive underline"
												onClick={() => versionsQuery.refetch()}
											>
												Thử lại
											</Button>
										</AlertDescription>
									</Alert>
								) : (
									<Form {...installForm}>
										<form
											onSubmit={installForm.handleSubmit(onInstallSubmit)}
											className="space-y-4"
										>
											<FormField
												control={installForm.control}
												name="version"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Phiên bản Game</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Chọn phiên bản..." />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{versionsQuery.data?.map((version) => {
																	if (!version.trim()) return null;
																	return (
																		<SelectItem key={version} value={version}>
																			{version}
																		</SelectItem>
																	);
																})}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
											<Button
												type="submit"
												className="w-full"
												disabled={downloadMutation.isPending}
											>
												{downloadMutation.isPending ? (
													<div className="flex items-center gap-2">
														<Spinner
															size="small"
															className="text-primary-foreground"
														/>
														<span>Đang tải...</span>
													</div>
												) : (
													"Tải xuống"
												)}
											</Button>
										</form>
									</Form>
								)}
								{installSavePath && (
									<div className="rounded-lg bg-muted/50 p-3 text-xs font-mono truncate">
										Lưu tại: {installSavePath}
									</div>
								)}
							</div>
						</TabsContent>

						<TabsContent value="convert" className="space-y-6">
							<Alert
								variant="destructive"
								className="border-red-500/50 bg-red-500/10"
							>
								<AlertCircleIcon className="h-5 w-5" />
								<AlertTitle className="text-lg font-semibold ml-2">
									Lưu ý quan trọng
								</AlertTitle>
								<AlertDescription className="mt-2">
									<ul className="list-inside list-disc space-y-2 text-sm">
										<li>
											File game phải có định dạng{" "}
											<strong>{"<APP_ID>@<VERSION>.xapk"}</strong>
										</li>
										<li>
											Yêu cầu: <strong>8GB RAM</strong> và{" "}
											<strong>40GB bộ nhớ trống</strong>
										</li>
										<li>
											Quá trình mất từ <strong>15-45 phút</strong>. Không tắt
											máy hoặc để máy ngủ.
										</li>
									</ul>
								</AlertDescription>
							</Alert>

							{assetRipperCheckerQuery.error ? (
								<Alert variant="destructive">
									<AlertTitle>Lỗi AssetRipper</AlertTitle>
									<AlertDescription>
										AssetRipper không khả dụng.
										<Button
											variant="link"
											className="pl-2 h-auto p-0 text-destructive underline"
											onClick={() => assetRipperCheckerQuery.refetch()}
										>
											Kiểm tra lại
										</Button>
									</AlertDescription>
								</Alert>
							) : (
								!C2UMutation.isPending && (
									<div className="space-y-4">
										<div className="flex w-full items-center justify-between space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
											<div className="flex flex-col overflow-hidden">
												<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
													File Game (.xapk)
												</span>
												{c2uAppPath ? (
													<p
														className="truncate text-sm font-medium mt-1"
														title={c2uAppPath}
													>
														{c2uAppPath}
													</p>
												) : (
													<span className="text-sm text-muted-foreground italic mt-1">
														Chưa chọn file
													</span>
												)}
											</div>
											<Button
												type="button"
												variant="secondary"
												onClick={checkAppPath}
												className="shrink-0"
											>
												Chọn File
											</Button>
										</div>

										<div className="flex w-full items-center justify-between space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
											<div className="flex flex-col overflow-hidden">
												<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Thư mục Xuất
												</span>
												{c2uExportPath ? (
													<p
														className="truncate text-sm font-medium mt-1"
														title={c2uExportPath}
													>
														{c2uExportPath}
													</p>
												) : (
													<span className="text-sm text-muted-foreground italic mt-1">
														Chưa chọn thư mục
													</span>
												)}
											</div>
											<Button
												type="button"
												variant="secondary"
												onClick={checkExportPath}
												className="shrink-0"
											>
												Chọn Thư mục
											</Button>
										</div>
									</div>
								)
							)}

							<Button
								type="button"
								className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
								onClick={onConvertSubmit}
								disabled={
									!c2uAppPath || !c2uExportPath || C2UMutation.isPending
								}
							>
								{C2UMutation.isPending ? (
									<div className="flex items-center gap-2">
										<Spinner size="small" className="text-primary-foreground" />
										<span>Đang chuyển đổi...</span>
									</div>
								) : (
									"Bắt đầu Chuyển đổi"
								)}
							</Button>
						</TabsContent>
					</CardContent>
				</Tabs>
			</Card>
		</section>
	);
}
