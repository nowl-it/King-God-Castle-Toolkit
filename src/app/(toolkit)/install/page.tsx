'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { APP_PACKAGE_ID } from '@/utils/consts';
import { log } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { AlertCircle, Download, Info, Layers, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const InstallFormSchema = z.object({
	version: z
		.string({
			error: () => ({ message: 'Vui lòng chọn phiên bản' }),
		})
		.min(2)
		.max(100),
});

export default function InstallPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const [installSavePath, setInstallSavePath] = useState<string | null>(null);

	const installForm = useForm<z.infer<typeof InstallFormSchema>>({
		resolver: zodResolver(InstallFormSchema),
	});

	const versionsQuery = useQuery({
		queryKey: ['get_app_versions', APP_PACKAGE_ID],
		queryFn: (): Promise<string[]> =>
			invoke('get_app_versions', {
				appName: APP_PACKAGE_ID,
			}),
		staleTime: 10 * 60 * 1000,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	const downloadMutation = useMutation({
		mutationFn: ({ appName, version, outPath }: { appName: string; version: string; outPath: string }) =>
			invoke('download_app', { appName, version, outPath }),
		onMutate: () => {
			toast.info(t('pages.toolkit.toast.downloadStarted'), {
				description: t('pages.toolkit.toast.downloadingXapk'),
				duration: 3000,
			});
		},
		onSuccess: () => {
			toast.success(t('pages.toolkit.toast.downloadSuccess'), {
				description: t('pages.toolkit.toast.savedAt', { path: installSavePath }),
				duration: 5000,
			});
			if (installSavePath) {
				// Navigate to convert page after successful download
				router.push('/convert');
			}
		},
		onError: (error: Error) => {
			log.error('Download error in install page', 'InstallPage', { error });
			let errorMessage = error?.message || '';
			if (error?.message) {
				if (error.message.includes('timeout')) {
					errorMessage = t('pages.toolkit.toast.downloadTimeout');
				} else if (error.message.includes('No buffer space available')) {
					errorMessage = t('pages.toolkit.toast.systemOverload');
				} else if (error.message.includes('network')) {
					errorMessage = t('pages.toolkit.toast.networkError');
				}
			}
			toast.error(t('pages.toolkit.toast.downloadFailed'), {
				description: errorMessage,
				duration: 6000,
			});
		},
	});

	async function onInstallSubmit(data: z.infer<typeof InstallFormSchema>) {
		if (downloadMutation.isPending) {
			toast.warning(t('pages.toolkit.toast.downloadInProgress'));
			return;
		}

		const saveTo = await open({
			directory: true,
			multiple: false,
			save: true,
			title: t('pages.toolkit.dialog.selectSavePath'),
		});
		if (!saveTo) {
			toast.warning(t('pages.toolkit.toast.noSavePath'));
			return;
		}

		setInstallSavePath(saveTo);

		toast.info(t('pages.toolkit.toast.downloadStarted'), {
			description: t('pages.toolkit.toast.version', { version: data.version }),
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

	return (
		<div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500'>
			<div className='flex items-end justify-between'>
				<div>
					<h2 className='text-3xl font-bold tracking-tight'>{t('pages.toolkit.install.title')}</h2>
					<p className='text-muted-foreground mt-2 text-lg'>{t('pages.toolkit.install.subtitle')}</p>
				</div>
				<Badge variant='outline' className='h-fit gap-1 px-3 py-1'>
					<Layers className='size-3' />
					{t('pages.toolkit.install.badge')}
				</Badge>
			</div>
			<Separator />

			<div className='grid gap-6 lg:grid-cols-3'>
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>{t('pages.toolkit.install.configTitle')}</CardTitle>
						<CardDescription>{t('pages.toolkit.install.configDesc')}</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...installForm}>
							<form onSubmit={installForm.handleSubmit(onInstallSubmit)} className='space-y-6'>
								<FormField
									control={installForm.control}
									name='version'
									render={({ field }) => (
										<FormItem className='flex justify-between'>
											<FormLabel>{t('pages.toolkit.install.versionLabel')}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger className='h-11'>
														<SelectValue
															placeholder={t('pages.toolkit.install.selectVersion')}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent className='max-h-60 overflow-y-auto'>
													{versionsQuery.isLoading && (
														<SelectItem value='loading' disabled>
															<div className='flex items-center gap-2'>
																<Loader2 className='size-4 animate-spin' />
																{t('pages.toolkit.install.loadingVersions')}
															</div>
														</SelectItem>
													)}
													{versionsQuery.isError && (
														<SelectItem value='error' disabled>
															<div className='text-destructive flex items-center gap-2'>
																<AlertCircle className='size-4' />
																{t('pages.toolkit.install.errorLoading')}
															</div>
														</SelectItem>
													)}
													{versionsQuery.data?.map((version) => (
														<SelectItem key={version} value={version}>
															{version}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className='bg-muted/30 rounded-lg border p-4'>
									<div className='flex items-center justify-between'>
										<div className='space-y-1'>
											<Label className='text-base'>
												{t('pages.toolkit.install.storageLabel')}
											</Label>
											<p className='text-muted-foreground text-xs'>
												{t('pages.toolkit.install.storageDesc')}
											</p>
										</div>
										{installSavePath ? (
											<Badge variant='secondary' className='font-mono font-normal'>
												{installSavePath}
											</Badge>
										) : (
											<Badge variant='outline'>{t('pages.toolkit.install.notSelected')}</Badge>
										)}
									</div>
								</div>

								<Button
									type='submit'
									size='lg'
									disabled={downloadMutation.isPending || versionsQuery.isLoading}
									className='w-full'>
									{downloadMutation.isPending ? (
										<>
											<Loader2 className='mr-2 size-4 animate-spin' />
											{t('pages.toolkit.install.downloading')}
										</>
									) : (
										<>
											<Download className='mr-2 size-4' />
											{t('pages.toolkit.install.startDownload')}
										</>
									)}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>

				<div className='space-y-6'>
					<Card className='bg-primary/5 border-primary/20'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-base'>
								<Info className='text-primary size-4' />
								{t('pages.toolkit.install.infoTitle')}
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2 text-sm'>
							<p>
								{t('pages.toolkit.install.infoFormat')}{' '}
								<code className='bg-background rounded px-1 py-0.5 font-mono text-xs'>.xapk</code>
							</p>
							<p className='text-muted-foreground'>{t('pages.toolkit.install.infoNext')}</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
