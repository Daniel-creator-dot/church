import { WorshipPlan, Announcement, ChurchEvent, Devotional } from '../types';

interface BulletinData {
  churchName?: string;
  plan?: WorshipPlan | null;
  announcements: Announcement[];
  events: ChurchEvent[];
  devotional?: Devotional | null;
}

export function printSundayBulletin(data: BulletinData) {
  const { churchName = 'Liberty Assemblies of God', plan, announcements, events, devotional } = data;
  const sortedItems = [...(plan?.items || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const upcoming = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const orderHtml = sortedItems.length > 0
    ? sortedItems.map((item, i) => `
        <tr><td style="padding:6px 8px;border-bottom:1px solid #eee;width:30px;font-weight:bold;color:#b45309">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-transform:capitalize">${item.itemType}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:600">${item.title}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#666">${item.assignedTo || '—'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${item.durationMinutes ? item.durationMinutes + 'm' : ''}</td></tr>
      `).join('')
    : '<tr><td colspan="5" style="padding:12px;color:#999;text-align:center">No worship plan selected — add items in Worship Planning first.</td></tr>';

  const annHtml = announcements.slice(0, 6).map(a => `
    <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #eee">
      <div style="font-size:10px;color:#b45309;font-weight:bold;text-transform:uppercase">${a.category}</div>
      <div style="font-weight:700;margin:4px 0">${a.title}</div>
      <div style="font-size:12px;color:#555;line-height:1.5">${a.content}</div>
    </div>
  `).join('') || '<p style="color:#999">No announcements this week.</p>';

  const eventsHtml = upcoming.map(e => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:12px">
      <span><strong>${e.title}</strong><br><span style="color:#666">${e.time} · ${e.location}</span></span>
      <span style="font-weight:bold;color:#b45309">${new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
    </div>
  `).join('') || '<p style="color:#999">No upcoming events.</p>';

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head><title>${churchName} — Sunday Bulletin</title>
    <style>
      @media print { body { margin: 0; } .no-print { display: none; } }
      body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 32px; color: #1a202c; }
      h1 { font-size: 28px; margin: 0; letter-spacing: -0.5px; }
      h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #b45309; border-bottom: 2px solid #b45309; padding-bottom: 6px; margin-top: 28px; }
      .header { text-align: center; border-bottom: 3px double #1a202c; padding-bottom: 20px; margin-bottom: 24px; }
      .subtitle { color: #666; font-size: 13px; margin-top: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .devotional { background: #fffbeb; border-left: 4px solid #b45309; padding: 16px; margin: 16px 0; font-style: italic; }
      .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
    </style></head><body>
    <div class="no-print" style="margin-bottom:20px;text-align:center">
      <button onclick="window.print()" style="background:#b45309;color:white;border:none;padding:10px 24px;font-size:14px;cursor:pointer;border-radius:8px">Print Bulletin</button>
    </div>
    <div class="header">
      <h1>${churchName}</h1>
      <div class="subtitle">Sunday Worship Bulletin · ${plan?.serviceDate || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
      ${plan ? `<div class="subtitle" style="margin-top:4px;font-weight:bold">${plan.title}</div>` : ''}
    </div>
    ${devotional ? `
      <h2>Today's Word</h2>
      <div class="devotional">
        <strong>${devotional.title}</strong> — ${devotional.reference || devotional.verse}<br><br>
        ${devotional.devotionText?.slice(0, 300) || ''}
      </div>
    ` : ''}
    <h2>Order of Service</h2>
    <table><thead><tr style="background:#f8fafc">
      <th style="padding:8px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">#</th>
      <th style="padding:8px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Type</th>
      <th style="padding:8px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Item</th>
      <th style="padding:8px;text-align:left;font-size:10px;text-transform:uppercase;color:#666">Led By</th>
      <th style="padding:8px;text-align:right;font-size:10px;text-transform:uppercase;color:#666">Time</th>
    </tr></thead><tbody>${orderHtml}</tbody></table>
    <h2>Announcements</h2>${annHtml}
    <h2>Upcoming Events</h2>${eventsHtml}
    <div class="footer">Generated by ${churchName} Management Portal · ${new Date().toLocaleString()}</div>
    </body></html>
  `);
  win.document.close();
}
