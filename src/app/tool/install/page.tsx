'use client';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { APP_PACKAGE_ID } from '@/utils/consts';
import { log } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const FormSchema = z.object({
	version: z
		.string({
			error: () => ({ message: 'Vui lòng chọn phiên bản' }),
		})
		.min(2)
		.max(100),
});

// Ensure `useCallback` is called in a consistent order
export default function Page() {
	const [savePath, setSavePath] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	const versionsQuery = useQuery({
		queryKey: ['get_app_versions', APP_PACKAGE_ID],
		queryFn: (): Promise<string[]> =>
			invoke('get_app_versions', {
				appName: APP_PACKAGE_ID,
			}),
		staleTime: 10 * 60 * 1000, // 10 minutes
		retry: 3, // Retry 3 times on failure
		retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
	});

	// Mutation để download
	const downloadMutation = useMutation({
		mutationFn: ({ appName, version, outPath }: { appName: string; version: string; outPath: string }) =>
			invoke('download_app', { appName, version, outPath }),
		onMutate: () => {
			// Show loading toast
			toast('🚀 Bắt đầu tải...', {
				description: 'Đang tải file XAPK, vui lòng đợi...',
				duration: 3000,
			});
		},
		onSuccess: () => {
			toast('🎉 Tải thành công!', {
				description: `Đã lưu tại: ${savePath}`,
				duration: 5000,
			});
		},
		onError: (error: any) => {
			log.error('Download error in install page', 'InstallPage', { error });

			let errorMessage = 'Có lỗi xảy ra khi tải file';

			if (error?.message) {
				if (error.message.includes('timeout')) {
					errorMessage = 'Tải file bị timeout. Vui lòng kiểm tra kết nối mạng và thử lại.';
				} else if (error.message.includes('No buffer space available')) {
					errorMessage = 'Hệ thống đang quá tải. Vui lòng đợi và thử lại sau.';
				} else if (error.message.includes('network')) {
					errorMessage = 'Lỗi kết nối mạng, kiểm tra internet của bạn';
				} else {
					errorMessage = error.message;
				}
			}

			toast('❌ Tải thất bại!', {
				description: errorMessage,
				duration: 6000, // Reduced duration since no retry info
				action: {
					label: 'Thử lại',
					onClick: () => {
						// Retry the download with the same parameters
						const formData = form.getValues();
						if (savePath && formData.version) {
							setTimeout(() => {
								downloadMutation.mutate({
									appName: APP_PACKAGE_ID!,
									version: formData.version,
									outPath: savePath,
								});
							}, 2000); // Wait 2 seconds before retry
						}
					},
				},
			});
		},
	});

	// Loading state
	if (versionsQuery.isLoading) {
		return (
			<section className='flex h-full w-full flex-col items-center justify-center'>
				<Spinner size='large' />
				<p className='text-muted-foreground mt-4 text-sm'>Đang tải danh sách phiên bản...</p>
			</section>
		);
	}

	// Error state - Apkeep not available
	if (versionsQuery.error) {
		return (
			<section className='flex h-full w-full flex-col items-center justify-center'>
				<Card className='w-full max-w-md border-red-200 bg-red-50'>
					<CardHeader>
						<CardTitle className='text-red-700'>Lỗi Apkeep</CardTitle>
						<CardDescription className='text-red-600'>
							Apkeep không khả dụng. Vui lòng kiểm tra cài đặt.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{versionsQuery.error && (
							<p className='mb-4 text-sm text-red-600'>Chi tiết: {versionsQuery.error.message}</p>
						)}
						<Button
							onClick={() => versionsQuery.refetch()}
							disabled={versionsQuery.isLoading}
							variant='destructive'
						>
							{versionsQuery.isLoading ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
						</Button>
					</CardContent>
				</Card>
			</section>
		);
	}

	// Error state - Versions loading failed
	if (versionsQuery && versionsQuery.error) {
		return (
			<section className='flex h-full w-full flex-col items-center justify-center'>
				<Card className='w-full max-w-md border-red-200 bg-red-50'>
					<CardHeader>
						<CardTitle className='text-red-700'>Lỗi tải phiên bản</CardTitle>
						<CardDescription className='text-red-600'>
							Không thể tải danh sách phiên bản ứng dụng.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='mb-4 text-sm text-red-600'>Chi tiết: {versionsQuery}</p>
						<Button
							onClick={() =>
								queryClient.invalidateQueries({
									queryKey: ['apkeep_get_version', APP_PACKAGE_ID],
								})
							}
							variant='destructive'
						>
							Thử lại
						</Button>
					</CardContent>
				</Card>
			</section>
		);
	}

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		// Check if there's already a download in progress
		if (downloadMutation.isPending) {
			toast('⚠️ Đang có quá trình tải khác, vui lòng đợi.');
			return;
		}

		const saveTo = await open({
			directory: true,
			multiple: false,
			save: true,
			title: 'Chọn nơi lưu file',
		});
		if (!saveTo) {
			toast('⚠️ Bạn chưa chọn nơi lưu file.');
			return;
		}

		setSavePath(saveTo);

		// Show initial progress toast
		toast('📦 Bắt đầu tải...', {
			description: `Phiên bản: ${data.version}`,
			duration: 3000,
		});

		try {
			await downloadMutation.mutateAsync({
				appName: APP_PACKAGE_ID!,
				version: data.version,
				outPath: saveTo,
			});
		} catch (error) {
			log.error('Download failed in install handler', 'InstallPage', { error });
			// Error handling is done in the mutation onError callback
		}
	}

	return (
		<section className='flex h-full w-full flex-col items-center justify-center gap-6'>
			<Card className='w-full max-w-md border-0 shadow-xl backdrop-blur-md'>
				<CardHeader>
					<CardTitle>Install Toolkit</CardTitle>
					<CardDescription>Tải game King God Castle</CardDescription>
					<CardAction>
						<Link href='/tool/c2u' className='text-primary/80 text-sm underline'>
							Tôi đã tải game
						</Link>
					</CardAction>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-6'>
							<FormField
								control={form.control}
								name='version'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Version ({versionsQuery.data?.length} available)</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger className='w-full'>
													<SelectValue placeholder='Select a version' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{versionsQuery.data?.map(version => {
													if (!version.trim()) {
														log.warn('Skipping empty version value', 'InstallPage', {
															version,
														});
														return null;
													}
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
							{!downloadMutation.isSuccess ? (
								<Button type='submit' className='w-full' disabled={downloadMutation.isPending}>
									{downloadMutation.isPending ? 'Đang tải...' : 'Install'}
								</Button>
							) : (
								<div>
									<Button type='button' className='w-full' asChild>
										<Link href='/tool/c2u'>Chuyển đổi thành dự án Unity</Link>
									</Button>
									<Link
										href='/tool/install'
										className='text-primary/60 hover:text-primary mt-2 block text-center text-xs underline transition-colors duration-300'
									>
										Tải thêm phiên bản khác
									</Link>
								</div>
							)}
						</form>
					</Form>
				</CardContent>
				<CardFooter>
					{savePath && <p className='text-muted-foreground text-xs'>Lưu tại: {savePath}</p>}
				</CardFooter>
			</Card>
		</section>
	);
}
