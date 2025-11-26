import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";

export default function ZoomableImage({
	src,
	alt,
	className,
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
	if (!src) return null;
	return (
		<Dialog>
			<DialogTitle hidden>{alt}</DialogTitle>
			<DialogTrigger asChild>
				<img
					draggable={false}
					src={src as string}
					alt={alt || ""}
					className={cn(className, "cursor-zoom-in")}
				/>
			</DialogTrigger>
			<DialogContent className="max-w-7xl border-0 bg-transparent p-0">
				<div className="bg-primary-foreground relative overflow-clip rounded-md shadow-md">
					<img
						src={src as string}
						draggable={false}
						alt={alt || ""}
						className="h-full w-full object-contain p-4"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
