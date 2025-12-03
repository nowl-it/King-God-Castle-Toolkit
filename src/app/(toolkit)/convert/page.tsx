'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { APP_PACKAGE_ID } from '@/utils/consts';
import { log } from '@/utils/logger';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { ArrowRight, FileArchive, FolderOpen, Info, Loader2, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ConvertPage() {
	const { t } = useTranslation();
	const [c2uAppPath, setC2uAppPath] = useState<string | null>(null);
	const [c2uExportPath, setC2uExportPath] = useState<string | null>(null);

	const assetRipperCheckerQuery = useQuery({
		queryKey: ['check_asset_ripper', APP_PACKAGE_ID],
		queryFn: (): Promise<string[]> => invoke('check_asset_ripper'),
		staleTime: 10 * 60 * 1000,
	});

	const C2UMutation = useMutation({
		mutationFn: ({ appPath, outPath }: { appPath: string; outPath: string }) => invoke('c2u', { appPath, outPath }),
		onSuccess: () => {
			toast.success(t('pages.toolkit.toast.convertSuccess'), {
				description: t('pages.toolkit.toast.savedAt', { path: c2uExportPath }),
				duration: 5000,
			});
		},
		onError: (error: Error) => {
			toast.error(t('pages.toolkit.toast.convertFailed'), {
				description: error?.message || '',
				duration: 5000,
			});
		},
	});

	async function checkAppPath() {
		const saveTo = await open({
			title: t('pages.toolkit.dialog.selectXapk'),
			directory: false,
			multiple: false,
		});
		if (!saveTo) {
			toast.warning(t('pages.toolkit.toast.noFile'));
			return;
		}
		setC2uAppPath(saveTo);
	}

	async function checkExportPath() {
		const saveTo = await open({
			title: t('pages.toolkit.dialog.selectUnityPath'),
			directory: true,
			multiple: false,
		});
		if (!saveTo) {
			toast.warning(t('pages.toolkit.toast.noFolder'));
			return;
		}
		setC2uExportPath(saveTo);
	}

	async function onConvertSubmit() {
		if (!c2uAppPath) {
			toast.warning(t('pages.toolkit.toast.noApp'));
			return;
		}
		if (!c2uExportPath) {
			toast.warning(t('pages.toolkit.toast.noFolder'));
			return;
		}
		try {
			await C2UMutation.mutateAsync({
				appPath: c2uAppPath,
				outPath: c2uExportPath,
			});
		} catch (error) {
			log.error('Convert to Unity failed', 'ConvertPage', {
				appPath: c2uAppPath,
				exportPath: c2uExportPath,
				error,
			});
		}
	}

	return (
		<div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500'>
			<div className='flex items-end justify-between'>
				<div>
					<h2 className='text-3xl font-bold tracking-tight'>{t('pages.toolkit.convert.title')}</h2>
					<p className='text-muted-foreground mt-2 text-lg'>{t('pages.toolkit.convert.subtitle')}</p>
				</div>
				<Badge variant='outline' className='h-fit gap-1 px-3 py-1'>
					<Settings className='size-3' />
					{t('pages.toolkit.convert.badge')}
				</Badge>
			</div>
			<Separator />

			<Alert className='border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/50'>
				<Info className='size-4 text-amber-600 dark:text-amber-500' />
				<AlertTitle className='text-amber-900 dark:text-amber-100'>
					{t('pages.toolkit.convert.alertTitle')}
				</AlertTitle>
				<AlertDescription className='text-amber-800 dark:text-amber-200'>
					{t('pages.toolkit.convert.alertDesc')}
					<code className='rounded bg-amber-100 p-1.5 font-mono text-sm font-bold text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'>
						ulimit -n 16384
					</code>
				</AlertDescription>
			</Alert>

			<div className='grid gap-6'>
				<Card>
					<CardHeader>
						<CardTitle>{t('pages.toolkit.convert.configTitle')}</CardTitle>
						<CardDescription>{t('pages.toolkit.convert.configDesc')}</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='grid gap-6 md:grid-cols-2'>
							<div className='space-y-3'>
								<Label>{t('pages.toolkit.convert.sourceLabel')}</Label>
								<div
									className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
										c2uAppPath
											? 'border-primary/20 bg-primary/5'
											: 'hover:border-primary/50 hover:bg-muted/50 border-muted-foreground/25'
									}`}>
									<div className='flex flex-col items-center justify-center gap-2 text-center'>
										<div className='bg-background rounded-full p-3 shadow-sm'>
											<FileArchive className='text-muted-foreground size-6' />
										</div>
										<div className='space-y-1'>
											<p className='text-sm font-medium'>
												{c2uAppPath
													? c2uAppPath.split('/').pop()
													: t('pages.toolkit.convert.notSelectedFile')}
											</p>
											<p className='text-muted-foreground text-xs'>
												{c2uAppPath || t('pages.toolkit.convert.selectFileDesc')}
											</p>
										</div>
										<Button
											variant={c2uAppPath ? 'secondary' : 'outline'}
											size='sm'
											onClick={checkAppPath}
											className='mt-2'>
											{c2uAppPath
												? t('pages.toolkit.convert.changeFile')
												: t('pages.toolkit.convert.selectFile')}
										</Button>
									</div>
								</div>
							</div>

							<div className='space-y-3'>
								<Label>{t('pages.toolkit.convert.destLabel')}</Label>
								<div
									className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
										c2uExportPath
											? 'border-primary/20 bg-primary/5'
											: 'hover:border-primary/50 hover:bg-muted/50 border-muted-foreground/25'
									}`}>
									<div className='flex flex-col items-center justify-center gap-2 text-center'>
										<div className='bg-background rounded-full p-3 shadow-sm'>
											<FolderOpen className='text-muted-foreground size-6' />
										</div>
										<div className='space-y-1'>
											<p className='text-sm font-medium'>
												{c2uExportPath
													? c2uExportPath.split('/').pop()
													: t('pages.toolkit.convert.notSelectedFolder')}
											</p>
											<p className='text-muted-foreground text-xs'>
												{c2uExportPath || t('pages.toolkit.convert.selectFolderDesc')}
											</p>
										</div>
										<Button
											variant={c2uExportPath ? 'secondary' : 'outline'}
											size='sm'
											onClick={checkExportPath}
											className='mt-2'>
											{c2uExportPath
												? t('pages.toolkit.convert.changeFolder')
												: t('pages.toolkit.convert.selectFolder')}
										</Button>
									</div>
								</div>
							</div>
						</div>

						<div className='flex items-center justify-end pt-4'>
							<Button
								size='lg'
								onClick={onConvertSubmit}
								disabled={C2UMutation.isPending || !c2uAppPath || !c2uExportPath}
								className='min-w-[200px]'>
								{C2UMutation.isPending ? (
									<>
										<Loader2 className='mr-2 size-4 animate-spin' />
										{t('pages.toolkit.convert.processing')}
									</>
								) : (
									<>
										{t('pages.toolkit.convert.startConvert')}
										<ArrowRight className='ml-2 size-4' />
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>

				{assetRipperCheckerQuery.isLoading && (
					<div className='text-muted-foreground flex items-center justify-center gap-2 text-sm'>
						<Loader2 className='size-4 animate-spin' />
						{t('pages.toolkit.convert.checkingTools')}
					</div>
				)}
			</div>
		</div>
	);
}
