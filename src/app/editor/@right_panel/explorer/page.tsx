'use client';

import { useFileExplorerStore } from '@/store/fileExplorer/store';
import { useProjectStore } from '@/store/project/store';

export default function ExplorerRightPanel() {
	const { path: projectPath } = useProjectStore();
	const { stats, fileTree, loading, error } = useFileExplorerStore();

	// Additional debug for conditional rendering
	const shouldShowData = !loading && !error && fileTree;

	return (
		<div className='flex h-full w-full flex-col overflow-hidden'>
			<div className='shrink-0 border-b p-6'>
				<h2 className='mb-2 text-2xl font-bold'>Thông tin dự án</h2>
				<p className='text-muted-foreground'>
					{projectPath ? `Đường dẫn dự án: ${projectPath}` : 'No project loaded'}
				</p>
			</div>
			<div className='min-h-0 flex-1 overflow-auto p-6'>
				{loading ? (
					<div className='flex h-full items-center justify-center'>
						<div className='text-muted-foreground text-center'>
							<div className='border-primary mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent'></div>
							<p>Loading project data...</p>
						</div>
					</div>
				) : error ? (
					<div className='bg-destructive/10 text-destructive rounded-lg border p-3 text-sm'>{error}</div>
				) : shouldShowData ? (
					<div className='space-y-4'>
						<div>
							<h4 className='mb-1 font-semibold'>Thống kê dự án</h4>
							<div className='text-muted-foreground text-sm'>
								<div>Tổng số tệp: {stats.totalFiles.toLocaleString('en-US')}</div>
								<div>Tổng số thư mục: {stats.totalDirectories.toLocaleString('en-US')}</div>
							</div>
						</div>
						<div>
							<h4 className='mb-1 font-semibold'>Project</h4>
							<div className='text-muted-foreground text-sm'>
								<div>Name: {fileTree.name}</div>
								<div>Path: {fileTree.path}</div>
							</div>
						</div>
						<div>
							<h4 className='mb-1 font-semibold'>Mô tả</h4>
							<div className='text-muted-foreground text-sm'>
								Tôi chưa rõ tôi sẽ làm tính năng gì ở đây. Bạn có thể đề xuất ý tưởng.
							</div>
						</div>
					</div>
				) : projectPath ? (
					<div className='text-muted-foreground text-center'>
						<p>No project data available</p>
						<p className='mt-2 text-xs'>
							Debug: fileTree={String(!!fileTree)}, loading={String(loading)}, error={String(!!error)}
						</p>
					</div>
				) : (
					<div className='text-muted-foreground text-center'>
						<p>Select a project folder to view information</p>
					</div>
				)}
			</div>
		</div>
	);
}
