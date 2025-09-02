'use client';

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { toast } from 'sonner';
import { selectSavePath } from '@/lib/selectSavePath';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AlertCircleIcon } from 'lucide-react';

// Ensure `useCallback` is called in a consistent order
export default function Page() {
	const [appPath, setAppPath] = useState<string | null>(null);
	const [exportPath, setExportPath] = useState<string | null>(null);

	const queryClient = useQueryClient();

	const assetRipperCheckerQuery = useQuery({
		queryKey: ['check_asset_ripper', process.env.NEXT_PUBLIC_APK_NAME],
		queryFn: (): Promise<string[]> => invoke('check_asset_ripper'),
		staleTime: 10 * 60 * 1000, // 10 minutes
	});

	// Mutation để Convert To Unity
	const C2UMutation = useMutation({
		mutationFn: ({ appPath, outPath }: { appPath: string; outPath: string }) => invoke('c2u', { appPath, outPath }),
		onSuccess: () => {
			toast('🎉 Chuyển đổi thành công!', {
				description: `Đã lưu tại: ${exportPath}`,
				duration: 5000,
			});
		},
		onError: (error: Error) => {
			toast('❌ Chuyển đổi thất bại!', {
				description: error ? error.message : 'Có lỗi xảy ra khi chuyển đổi file',
				duration: 5000,
			});
		},
	});

	// Loading state
	if (assetRipperCheckerQuery.isLoading) {
		return (
			<section className='flex h-full w-full flex-col items-center justify-center'>
				<Spinner size='large' />
				<p className='text-muted-foreground mt-4 text-sm'>Đang kiểm tra tool...</p>
			</section>
		);
	}

	// Error state - AssetRipper not available
	if (assetRipperCheckerQuery.error) {
		return (
			<section className='flex h-full w-full flex-col items-center justify-center'>
				<Card className='w-full max-w-md border-red-200 bg-red-50'>
					<CardHeader>
						<CardTitle className='text-red-700'>Lỗi AssetRipper</CardTitle>
						<CardDescription className='text-red-600'>
							AssetRipper không khả dụng. Vui lòng kiểm tra cài đặt.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{assetRipperCheckerQuery.error && (
							<p className='mb-4 text-sm text-red-600'>
								Chi tiết: {assetRipperCheckerQuery.error.message}
							</p>
						)}
						<Button
							onClick={() => assetRipperCheckerQuery.refetch()}
							disabled={assetRipperCheckerQuery.isLoading}
							variant='destructive'
						>
							{assetRipperCheckerQuery.isLoading ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
						</Button>
					</CardContent>
				</Card>
			</section>
		);
	}

	// Error state - Versions loading failed
	if (assetRipperCheckerQuery && assetRipperCheckerQuery.error) {
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
						<p className='mb-4 text-sm text-red-600'>Chi tiết: {assetRipperCheckerQuery}</p>
						<Button
							onClick={() =>
								queryClient.invalidateQueries({
									queryKey: ['AssetRipper_get_version', process.env.NEXT_PUBLIC_APK_NAME],
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

	async function appPathCheck() {
		const saveTo = await selectSavePath({ title: 'Chọn ứng dụng (.xapk)', directory: false });
		if (!saveTo) {
			toast('⚠️ Bạn chưa chọn file.');
			return;
		}
		setAppPath(saveTo);
	}

	async function exportPathCheck() {
		const saveTo = await selectSavePath({ title: 'Chọn nơi lưu dự án Unity' });
		if (!saveTo) {
			toast('⚠️ Bạn chưa chọn nơi lưu file.');
			return;
		}
		setExportPath(saveTo);
	}

	async function onSubmit() {
		if (!exportPath) {
			toast('⚠️ Bạn chưa chọn nơi lưu file.');
			return;
		}

		try {
			await C2UMutation.mutateAsync({
				appPath: appPath!,
				outPath: exportPath,
			});
		} catch (error) {
			console.error('Convert failed:', error);
		}
	}

	return (
		<section className='flex h-full w-full flex-col items-center justify-center gap-6'>
			<Card className='w-full max-w-lg border-0 shadow-xl backdrop-blur-md'>
				<CardHeader>
					<CardTitle>Convert to Unity</CardTitle>
					<CardDescription>Chuyển đổi King God Castle thành dự án Unity</CardDescription>
					<CardAction>
						<Link href='/tool/install' className='text-primary/80 text-sm underline'>
							Tôi chưa tải game
						</Link>
					</CardAction>
				</CardHeader>
				<CardContent className='space-y-4'>
					<Alert variant='destructive'>
						<AlertCircleIcon />
						<AlertTitle>Lưu ý</AlertTitle>
						<AlertDescription>
							<p>Vui lòng đọc kỹ các điều sau trước khi chạy:</p>
							<ul className='list-inside list-decimal text-sm'>
								<li>
									<strong>
										File game tải về phải có định dạng {'<APP_ID>@<VERSION>.xapk'} và phải được tải
										từ mục{' '}
										<Link href='/tool/install' className='text-primary'>
											Tools/Install Game
										</Link>{' '}
										của phần mềm hoặc từ trang APKPure.
									</strong>
								</li>
								<li>
									Để có trải nghiệm tốt nhất, hãy đảm bảo rằng máy bạn có tối thiểu{' '}
									<strong>8Gb RAM</strong> và còn dư <strong>40Gb bộ nhớ</strong>.
								</li>
								<li>
									Không <strong>can thiệp</strong> vào quá trình tải xuống; không để máy của bạn{' '}
									<strong>ngủ hoặc tắt màn hình</strong>.
								</li>
								<li>
									Quá trình chuyển đổi có thể mất từ <strong>15 đến 45 phút</strong>, tùy thuộc vào{' '}
									<strong>hiệu suất máy tính</strong> của bạn.
								</li>
								<li>
									<strong>Không chèn/chạy bất kỳ phần mềm can thiệp</strong> nào vào quá trình chuyển
									đổi.
								</li>
							</ul>
						</AlertDescription>
					</Alert>
					{!C2UMutation.isPending && (
						<>
							<div className='flex items-center justify-between w-full outline p-2 rounded space-x-6'>
								{appPath ? (
									<p className='text-sm truncate'>{appPath}</p>
								) : (
									<span className='text-sm text-gray-500'>Chưa chọn ứng dụng</span>
								)}
								<Button type='button' variant='outline' onClick={appPathCheck}>
									Chọn ứng dụng (.xapk)
								</Button>
							</div>
							<div className='flex items-center justify-between w-full outline p-2 rounded space-x-6'>
								{exportPath ? (
									<p className='text-sm truncate'>{exportPath}</p>
								) : (
									<span className='text-sm text-gray-500'>Chưa chọn thư mục</span>
								)}
								<Button type='button' variant='outline' onClick={exportPathCheck}>
									Chọn thư mục
								</Button>
							</div>
						</>
					)}
					<Button
						type='button'
						variant='outline'
						onClick={onSubmit}
						disabled={!appPath || !exportPath || C2UMutation.isPending}
					>
						{C2UMutation.isPending ? 'Đang chuyển đổi...' : 'Chuyển đổi'}
					</Button>
				</CardContent>
			</Card>
		</section>
	);
}
