import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { SiFacebook, SiGithub } from '@icons-pack/react-simple-icons';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'About',
	description: 'Công cụ hỗ trợ cho cộng đồng King God Castle Việt Nam.',
};

export default function Page() {
	return (
		<section className='from-primary-foreground to-primary-foreground/20 flex h-full w-full flex-col items-center justify-center bg-gradient-to-br px-4 py-12'>
			<Card className='bg-background w-full max-w-md border-0 shadow-xl backdrop-blur-md'>
				<CardHeader className='flex flex-col items-center gap-2 pb-0'>
					<Avatar className='size-24'>
						<AvatarImage src='/favicon.ico' alt='King God Castle Toolkit' />
						<AvatarFallback>KGCT</AvatarFallback>
					</Avatar>
					<CardTitle className='text-center text-2xl font-bold'>King God Castle Toolkit</CardTitle>
					<CardDescription className='text-muted-foreground text-center'>
						Công cụ hỗ trợ cho cộng đồng King God Castle Việt Nam.
						<br />
						Được phát triển bởi{' '}
						<HoverCard>
							<HoverCardTrigger asChild>
								<Link
									href='https://github.com/nowl-it'
									target='_blank'
									rel='noopener noreferrer'
									aria-label='nowl GitHub'
									className='text-primary font-bold'
								>
									nowl
								</Link>
							</HoverCardTrigger>
							<HoverCardContent>
								<div className='flex justify-between gap-4'>
									<Avatar>
										<AvatarImage src='https://github.com/nowl-it.png' />
										<AvatarFallback>NOwL IT</AvatarFallback>
									</Avatar>
									<div className='space-y-1'>
										<h4 className='text-sm font-semibold'>@nowl-it</h4>
										<p className='text-sm'>NOwL IT - Developer</p>
										<div className='text-muted-foreground text-xs'>
											I&#39;m a passionate developer with a focus on building user-friendly
											applications.
										</div>
									</div>
								</div>
							</HoverCardContent>
						</HoverCard>
					</CardDescription>
				</CardHeader>
				<CardContent className='mt-4 flex flex-col items-center gap-4'>
					<p className='text-muted-foreground text-center text-base'>
						Tool hỗ trợ tải, convert, quản lý và chia sẻ tài nguyên cho cộng đồng King God Castle.
						<br />
						Mọi đóng góp, phản hồi hoặc ý tưởng phát triển xin gửi về các kênh bên dưới.
					</p>
					<div className='mt-2 flex gap-3'>
						<Button asChild variant='outline' size='icon'>
							<a
								href='https://github.com/nowl-it/kgc-toolkit'
								target='_blank'
								rel='noopener noreferrer'
								aria-label='GitHub'
							>
								<SiGithub />
							</a>
						</Button>
						<Button asChild variant='outline' size='icon'>
							<a
								href='https://fb.com/9owlsama'
								aria-label='Facebook'
								target='_blank'
								rel='noopener noreferrer'
							>
								<SiFacebook />
							</a>
						</Button>
					</div>
				</CardContent>
				<CardFooter className='mt-2 flex flex-col items-center gap-1'>
					<span className='text-muted-foreground text-xs'>
						© {new Date().getFullYear()} King God Castle Toolkit
					</span>
				</CardFooter>
			</Card>
		</section>
	);
}
