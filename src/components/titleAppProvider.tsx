"use client";

import { useMutation } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";

export default function TitleAppProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [loading, isLoading] = useState(true);
	const pathname = usePathname();

	const setAppTitleQuery = useMutation({
		mutationFn: (title: string) => invoke("set_app_title", { title }),
		onMutate: () => {
			isLoading(true);
		},
		onSettled: () => {
			isLoading(false);
		},
	});

	// biome-ignore lint: security/use-external-input: <explanation>
	useEffect(() => {
		const { title } = document;
		setAppTitleQuery.mutateAsync(title);
	}, [pathname]);

	if (loading) {
		return (
			<section className="flex h-dvh w-full items-center justify-center">
				<Spinner size="large" />
			</section>
		);
	}

	return <>{children}</>;
}
