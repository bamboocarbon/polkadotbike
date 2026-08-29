import { promises as fs } from 'fs';
import path from 'path';
import { FsStore } from '../lib/calendar/store';
import { renderCalendarDocument } from '../lib/calendar/renderCalendarDocument';

async function main() {
  const filePath = process.env.CALENDAR_FS_PATH || path.join(__dirname, '../data/events.json');
  const store = new FsStore(filePath);
  const data = await store.read();

  const html = renderCalendarDocument(data, { editable: false });

  const outDir = path.join(__dirname, '../dist');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'calendar.html');
  await fs.writeFile(outPath, html);

  console.log(`Wrote ${data.events.length} events to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
