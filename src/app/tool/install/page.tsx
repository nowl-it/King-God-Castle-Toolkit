'use client';

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import Link from 'next/link';
import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';
import { selectSavePath } from '@/lib/selectSavePath';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

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
		queryKey: ['get_app_versions', process.env.NEXT_PUBLIC_APK_NAME],
		queryFn: (): Promise<string[]> =>
			invoke('get_app_versions', {
				appName: process.env.NEXT_PUBLIC_APK_NAME,
			}),
		staleTime: 10 * 60 * 1000, // 10 minutes
	});

	// Mutation để download
	const downloadMutation = useMutation({
		mutationFn: ({ appName, version, outPath }: { appName: string; version: string; outPath: string }) =>
			invoke('download_app', { appName, version, outPath }),
		onSuccess: () => {
			toast('🎉 Tải thành công!', {
				description: `Đã lưu tại: ${savePath}`,
				duration: 5000,
			});
		},
		onError: (error: any) => {
			toast('❌ Tải thất bại!', {
				description: error?.message || 'Có lỗi xảy ra khi tải file',
				duration: 5000,
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
									queryKey: ['apkeep_get_version', process.env.NEXT_PUBLIC_APK_NAME],
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
		const saveTo = await selectSavePath();
		if (!saveTo) {
			toast('⚠️ Bạn chưa chọn nơi lưu file.');
			return;
		}

		setSavePath(saveTo);

		try {
			await downloadMutation.mutateAsync({
				appName: process.env.NEXT_PUBLIC_APK_NAME!,
				version: data.version,
				outPath: saveTo,
			});
		} catch (error) {
			console.error('Download failed:', error);
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
														console.warn('Skipping empty version value');
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
										className='text-xs text-center block mt-2 underline text-primary/60 hover:text-primary transition-colors duration-300'
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
