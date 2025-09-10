import EditorTab from '@/components/editor/tab';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ReactNode } from 'react';

interface EditorLayoutProps {
	children: ReactNode;
	left_panel?: ReactNode;
	right_panel?: ReactNode;
}

export default function EditorLayout({ children, left_panel, right_panel }: EditorLayoutProps) {
	return (
		<section className='flex h-full max-h-[calc(100vh-.25rem*9)] w-full flex-col items-center justify-center overflow-hidden'>
			<ResizablePanelGroup direction='horizontal'>
				<ResizablePanel defaultSize={20} maxSize={40}>
					{left_panel || <div className='text-muted-foreground p-4'>No left panel content</div>}
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel className='grid h-full grid-cols-1 grid-rows-[40px_1fr]'>
					<EditorTab />
					{right_panel || children || <div className='text-muted-foreground p-4'>No content</div>}
				</ResizablePanel>
			</ResizablePanelGroup>
		</section>
	);
}
