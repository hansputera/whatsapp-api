import {stat, rm} from 'node:fs/promises';

export const removeSessionDirectory = async (dir: string) => {
	const stats = await stat(dir).catch(() => undefined);
	if (!stats || stats.size <= 0) {
		return false;
	}

	if (stats?.isDirectory()) {
		const err = await rm(dir, {recursive: true, force: true}).catch(
			e => e as Error,
		);
		if (err) {
			return false;
		}

		return true;
	}

	return false;
};
