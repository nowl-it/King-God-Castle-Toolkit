import Component from './_component';

export default function Page() {
	const env = process.env;

	return <Component env={{ ...env }} />;
}
