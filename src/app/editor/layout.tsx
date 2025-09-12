import EditorTab from '@/components/editor/tab';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ReactNode } from 'react';

interface EditorLayoutProps {
	children: ReactNode;
	left_panel: ReactNode;
	right_panel: ReactNode;
}

export default function EditorLayout({ children, left_panel, right_panel }: EditorLayoutProps) {
	return (
		<section className='flex h-full max-h-[calc(100vh-.25rem*9)] w-full flex-row overflow-hidden'>
			{/* Toolbar - VSCode-like activity bar */}
			<div className='bg-sidebar w-16 flex-shrink-0 border-r'>
				<EditorTab />
			</div>

			{/* Main content area with left and right panels */}
			<div className='flex-1'>
				<ResizablePanelGroup direction='horizontal'>
					<ResizablePanel defaultSize={15} minSize={15} maxSize={40}>
						<div className='bg-sidebar/50 h-full border-r'>{left_panel}</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel>
						<div className='bg-background h-full'>{right_panel ?? children}</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		</section>
	);
}
