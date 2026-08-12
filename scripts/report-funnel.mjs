import { execFileSync } from "node:child_process";

const days = Number(process.argv[2] || 7);
if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error("Use a period between 1 and 90 days.");

const sql = `SELECT property,
  SUM(CASE WHEN event = 'page_view' THEN event_count ELSE 0 END) AS views,
  SUM(CASE WHEN event = 'property_open' THEN event_count ELSE 0 END) AS property_opens,
  SUM(CASE WHEN event = 'availability_view' THEN event_count ELSE 0 END) AS dates_viewed,
  SUM(CASE WHEN event = 'dates_selected' THEN event_count ELSE 0 END) AS dates_selected,
  SUM(CASE WHEN event = 'enquiry_start' THEN event_count ELSE 0 END) AS enquiries_started,
  SUM(CASE WHEN event = 'enquiry_whatsapp_open' THEN event_count ELSE 0 END) AS whatsapp_enquiries,
  SUM(CASE WHEN event = 'enquiry_email_sent' THEN event_count ELSE 0 END) AS email_enquiries
FROM conversion_daily
WHERE event_date >= date('now', '-${days - 1} days') AND property <> 'none'
GROUP BY property ORDER BY views DESC, property ASC;`;

execFileSync("npx", ["wrangler", "d1", "execute", "cumbuco-net-br-conversions", "--remote", "--command", sql], { stdio: "inherit" });
