import { Suspense } from 'react';

export const experimental_ppr = true;

export default function Page() {
	return (
		<Suspense fallback={<div>Loading</div>}>
			<div>Legacy</div>
		</Suspense>
	);
}
