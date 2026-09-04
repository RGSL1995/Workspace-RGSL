import axios from "axios";
import * as cheerio from "cheerio";
import IPO from "../models/IPO";

export interface ParsedIPO {
  company_name: string;
  listing_date: Date;
  price_band_min?: number;
  price_band_max?: number;
  gmp?: number;
  status: "upcoming" | "open" | "closed" | "listed";
  sector?: string;
  exchange?: string;
  link?: string;
  issue_dates?: string;
  est_listing?: string;
  trend?: string;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function parseIPODate(dateStr: string): Date {
  const currentYear = new Date().getFullYear();
  if (!dateStr || dateStr.trim() === "-" || dateStr.trim() === "—") {
    return new Date();
  }

  const cleaned = dateStr.trim().toLowerCase();

  let foundMonth = -1;
  for (const [mName, mIdx] of Object.entries(MONTHS)) {
    if (cleaned.includes(mName)) {
      foundMonth = mIdx;
      break;
    }
  }

  if (foundMonth !== -1) {
    const match = cleaned.match(/(\d+)\s*(?:-\s*(\d+))?/);
    if (match) {
      const day = match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
      return new Date(currentYear, foundMonth, day);
    }
  }

  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) return direct;

  return new Date();
}

function parseGMP(gmpStr: string): number {
  if (!gmpStr) return 0;
  const match = gmpStr.replace(/,/g, "").match(/[-+]?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function parsePrice(priceStr: string): { min?: number; max?: number } {
  if (!priceStr || (priceStr.includes("-") && !priceStr.match(/\d/))) return {};
  const cleaned = priceStr.replace(/[₹,]/g, "").trim();
  const rangeMatch = cleaned.match(/(\d+)\s*(?:[-–to]+)\s*(\d+)/i);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  }
  const singleMatch = cleaned.match(/\d+/);
  if (singleMatch) {
    const val = parseInt(singleMatch[0], 10);
    return { min: val, max: val };
  }
  return {};
}

function parseStatus(
  statusStr: string,
  date: Date
): "upcoming" | "open" | "closed" | "listed" {
  const s = (statusStr || "").toLowerCase().trim();
  if (s.includes("open") || s.includes("ongoing") || s.includes("live")) return "open";
  if (s.includes("closed")) return "closed";
  if (s.includes("listed")) return "listed";
  if (s.includes("upcoming")) return "upcoming";

  const now = new Date();
  if (date < now) return "closed";
  return "upcoming";
}

export const scrapeMoneycontrolIPOs = async (): Promise<ParsedIPO[]> => {
  console.log("\n🔄 [IPO SCRAPER] Starting live IPO & GMP scraping...");

  try {
    const url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/";
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    };

    console.log(`📡 [IPO SCRAPER] Fetching: ${url}`);
    const response = await axios.get(url, { headers, timeout: 15000 });

    if (response.status !== 200) {
      console.error(`❌ [IPO SCRAPER] Failed to fetch: ${response.status}`);
      return getSampleIPOs();
    }

    const $ = cheerio.load(response.data);
    const ipos: ParsedIPO[] = [];
    const seenNames = new Set<string>();

    // Table 0 (Mainboard IPOs) & Table 1 (SME IPOs)
    $("table").each((tableIdx, tbl) => {
      if (tableIdx > 1) return;
      const isSME = tableIdx === 1;

      $(tbl)
        .find("tbody tr")
        .each((_, row) => {
          try {
            const $row = $(row);
            const cells = $row
              .find("td")
              .map((_, td) => $(td).text().trim().replace(/\s+/g, " "))
              .get();

            if (cells.length < 5) return;

            const rawName = cells[0]?.trim();
            const junk = ["ipo name", "open date", "close date", "date", "status", "price band", "gmp", "ipo", "trend"];
            if (
              !rawName ||
              rawName.length < 2 ||
              junk.includes(rawName.toLowerCase())
            ) {
              return;
            }

            const cleanName = isSME ? `${rawName} (SME)` : rawName;
            const normKey = cleanName.toLowerCase().trim();
            if (seenNames.has(normKey)) return;
            seenNames.add(normKey);

            const gmp = parseGMP(cells[1]);
            const trend = cells[2] || undefined;
            const price = parsePrice(cells[3]);
            const estListing = cells[4] && cells[4] !== "₹- (0.00%)" ? cells[4] : undefined;
            const issueDates = cells[5] && cells[5] !== "-" ? cells[5] : undefined;
            const listingDate = parseIPODate(cells[5]);
            const status = parseStatus(cells[6], listingDate);
            const link = $row.find("a").first().attr("href") || undefined;

            ipos.push({
              company_name: cleanName,
              gmp,
              trend,
              price_band_min: price.min,
              price_band_max: price.max,
              est_listing: estListing,
              issue_dates: issueDates,
              listing_date: listingDate,
              status,
              sector: isSME ? "SME IPO" : "Mainboard IPO",
              exchange: isSME ? "NSE SME / BSE SME" : "NSE / BSE",
              link,
            });
          } catch (rowError) {
            console.warn(`  ⚠️ [IPO SCRAPER] Row error:`, (rowError as Error).message);
          }
        });
    });

    // Table 2 (Recently Listed IPOs)
    const tbl2 = $("table").eq(2);
    if (tbl2.length) {
      tbl2.find("tbody tr").each((_, row) => {
        try {
          const $row = $(row);
          const cells = $row
            .find("td")
            .map((_, td) => $(td).text().trim().replace(/\s+/g, " "))
            .get();

          if (cells.length < 3) return;

          const rawName = cells[0]?.trim();
          const junk = ["ipo name", "ipo price", "gmp", "listing price", "ipo"];
          if (!rawName || rawName.length < 2 || junk.includes(rawName.toLowerCase())) return;

          const normKey = rawName.toLowerCase().trim();
          if (seenNames.has(normKey)) return;
          seenNames.add(normKey);

          const price = parsePrice(cells[1]);
          const gmp = parseGMP(cells[2]);
          const estListing = cells[3] ? `Listed at ₹${cells[3].replace(/[₹,]/g, "")}` : undefined;
          const link = $row.find("a").first().attr("href") || undefined;

          ipos.push({
            company_name: rawName,
            gmp,
            price_band_min: price.min,
            price_band_max: price.max,
            est_listing: estListing,
            listing_date: new Date(),
            status: "listed",
            sector: "Listed Equity",
            exchange: "NSE / BSE",
            link,
          });
        } catch (listedError) {
          // ignore row error
        }
      });
    }

    if (ipos.length > 0) {
      console.log(`✅ [IPO SCRAPER] Successfully scraped ${ipos.length} live IPOs with GMP!`);
      return ipos;
    }

    console.warn("⚠️ [IPO SCRAPER] No rows found, using fallback IPOs");
    return getSampleIPOs();
  } catch (error) {
    console.error("❌ [IPO SCRAPER] Scraping error:", error);
    return getSampleIPOs();
  }
};

function getSampleIPOs(): ParsedIPO[] {
  const currentYear = new Date().getFullYear();
  return [
    {
      company_name: "Veegaland Developers Limited",
      listing_date: new Date(`${currentYear}-09-15`),
      price_band_min: 140,
      price_band_max: 155,
      gmp: 18,
      status: "upcoming",
      sector: "Mainboard IPO",
      exchange: "NSE / BSE",
      issue_dates: "10-15 Sept",
      est_listing: "₹158 (12.86%)",
      link: "https://ipowatch.in/veegaland-developers-ipo/",
    },
    {
      company_name: "Kanohar Electricals Limited",
      listing_date: new Date(`${currentYear}-09-10`),
      price_band_min: 632,
      price_band_max: 670,
      gmp: 200,
      status: "upcoming",
      sector: "Mainboard IPO",
      exchange: "NSE / BSE",
      issue_dates: "8-10 Sept",
      est_listing: "₹832 (31.65%)",
      link: "https://ipowatch.in/kanohar-electricals-ipo/",
    },
    {
      company_name: "Qualiance International (SME)",
      listing_date: new Date(`${currentYear}-09-08`),
      price_band_min: 127,
      price_band_max: 127,
      gmp: 55,
      status: "open",
      sector: "SME IPO",
      exchange: "NSE SME / BSE SME",
      issue_dates: "4-8 Sept",
      est_listing: "₹182 (43.31%)",
      link: "https://ipowatch.in/",
    },
    {
      company_name: "Deepa Jewellers Limited",
      listing_date: new Date(`${currentYear}-09-03`),
      price_band_min: 177,
      price_band_max: 185,
      gmp: 18,
      status: "closed",
      sector: "Mainboard IPO",
      exchange: "NSE / BSE",
      issue_dates: "1-3 Sept",
      est_listing: "₹195 (10.17%)",
      link: "https://ipowatch.in/deepa-jewellers-ipo/",
    },
    {
      company_name: "Augmont Enterprises Limited",
      listing_date: new Date(`${currentYear}-09-01`),
      price_band_min: 788,
      price_band_max: 788,
      gmp: 290,
      status: "listed",
      sector: "Listed Equity",
      exchange: "NSE / BSE",
      est_listing: "Listed at ₹961",
      link: "https://ipowatch.in/",
    },
  ];
}

export const saveIPOs = async (ipos: ParsedIPO[]): Promise<number> => {
  console.log(`\n💾 [IPO SCRAPER] Saving ${ipos.length} IPOs to database...`);

  if (!ipos || ipos.length === 0) return 0;

  try {
    const operations = ipos.map((ipo) => ({
      updateOne: {
        filter: { company_name: ipo.company_name },
        update: {
          $set: {
            ...ipo,
            last_synced: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await IPO.bulkWrite(operations);
    const newCount = result.upsertedCount || 0;
    const updatedCount = result.modifiedCount || 0;

    console.log(`✅ [IPO SCRAPER] Saved: ${newCount} new, ${updatedCount} updated`);
    return newCount;
  } catch (error) {
    console.error(`❌ [IPO SCRAPER] Error in bulkWrite:`, error);
    return 0;
  }
};

export const getNewIPOs = async (sinceLast: number = 3600000): Promise<any[]> => {
  const since = new Date(Date.now() - sinceLast);
  const newIPOs = await IPO.find({
    created_at: { $gte: since },
  }).sort({ created_at: -1 });

  return newIPOs;
};
