import XLSX from "xlsx";
import AnchorFreeDate, { IAnchorFreeDate } from "../models/AnchorFreeDate";
import IPO from "../models/IPO";

/**
 * Parse Excel file and extract anchor free dates
 * Expected columns: Company Name, Free Date, Notes (optional)
 */
export const parseExcelFile = (fileBuffer: Buffer): Array<any> => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new Error("Excel file is empty");
    }

    console.log(`✅ [ANCHOR] Parsed ${data.length} rows from Excel`);

    return data;
  } catch (error) {
    console.error("[ANCHOR] Error parsing Excel:", error);
    throw error;
  }
};

/**
 * Validate and normalize anchor free date data
 */
export const validateAnchorData = (
  data: any[]
): Array<{ company_name: string; free_date: Date; notes?: string }> => {
  const validated: Array<any> = [];

  for (const row of data) {
    try {
      // Find company name (try multiple column names)
      const companyName =
        row["Company Name"] ||
        row["company_name"] ||
        row["Company"] ||
        row["company"];

      if (!companyName) {
        console.warn("[ANCHOR] Skipping row: No company name found");
        continue;
      }

      // Find free date (try multiple column names)
      const freeDateValue =
        row["Free Date"] ||
        row["free_date"] ||
        row["Freedom Date"] ||
        row["Date"];

      if (!freeDateValue) {
        console.warn(`[ANCHOR] Skipping ${companyName}: No free date found`);
        continue;
      }

      // Parse date
      const freeDate = parseDate(freeDateValue);
      if (!freeDate) {
        console.warn(
          `[ANCHOR] Skipping ${companyName}: Invalid date format: ${freeDateValue}`
        );
        continue;
      }

      // Get notes if available
      const notes =
        row["Notes"] || row["notes"] || row["Remarks"] || row["remarks"] || "";

      validated.push({
        company_name: companyName.trim(),
        free_date: freeDate,
        notes: notes ? notes.toString().trim() : undefined,
      });
    } catch (error) {
      console.error("[ANCHOR] Error validating row:", error);
      continue;
    }
  }

  if (validated.length === 0) {
    throw new Error("No valid anchor free dates found in Excel");
  }

  console.log(`✅ [ANCHOR] Validated ${validated.length} anchor free dates`);

  return validated;
};

/**
 * Parse date from various formats
 */
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's a number (Excel serial date)
  if (typeof dateValue === "number") {
    // Excel dates are stored as days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 86400000);
    return isValidDate(date) ? date : null;
  }

  // If it's a string, try parsing
  if (typeof dateValue === "string") {
    // Try common formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateValue.match(format);
      if (match) {
        let year, month, day;

        if (format === formats[1]) {
          // YYYY-MM-DD
          [, year, month, day] = match;
        } else if (format === formats[2]) {
          // DD-MM-YYYY
          [, day, month, year] = match;
        } else {
          // Try both formats for DD/MM/YYYY vs MM/DD/YYYY
          const first = parseInt(match[1]);
          const second = parseInt(match[2]);

          if (first <= 12 && second <= 12) {
            // Ambiguous, assume DD/MM/YYYY
            [, day, month, year] = match;
          } else if (first > 12) {
            // Must be DD/MM/YYYY
            [, day, month, year] = match;
          } else {
            // Must be MM/DD/YYYY
            [, month, day, year] = match;
          }
        }

        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isValidDate(date)) {
          return date;
        }
      }
    }

    // Try native parsing
    const date = new Date(dateValue);
    if (isValidDate(date)) {
      return date;
    }
  }

  return null;
}

/**
 * Check if date is valid
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Sync anchor free dates from Excel data
 * Replaces all existing dates with new ones
 */
export const syncAnchorFreeDates = async (
  data: Array<{ company_name: string; free_date: Date; notes?: string }>
): Promise<number> => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🔄 [ANCHOR] Syncing anchor free dates...");

    // Clear existing dates
    await AnchorFreeDate.deleteMany({});
    console.log("✅ [ANCHOR] Cleared existing anchor free dates");

    // Insert new dates
    const inserted = await AnchorFreeDate.insertMany(data);

    console.log(`✅ [ANCHOR] Inserted ${inserted.length} anchor free dates`);

    // Try to link with IPOs by company name
    for (const anchorDate of inserted) {
      try {
        const ipo = await IPO.findOne({
          company_name: new RegExp(anchorDate.company_name, "i"),
        });

        if (ipo) {
          anchorDate.ipo_id = ipo._id;
          await anchorDate.save();
        }
      } catch (error) {
        // Continue even if linking fails
      }
    }

    console.log("✅ [ANCHOR] Sync complete");
    console.log("=".repeat(60));

    return inserted.length;
  } catch (error) {
    console.error("[ANCHOR] Error syncing anchor free dates:", error);
    throw error;
  }
};

/**
 * Get upcoming anchor free dates
 */
export const getUpcomingAnchorFreeDates = async (
  days: number = 30
): Promise<IAnchorFreeDate[]> => {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return AnchorFreeDate.find({
    free_date: { $gte: now, $lte: future },
    status: { $in: ["upcoming", "active"] },
  }).sort({ free_date: 1 });
};

/**
 * Get all anchor free dates
 */
export const getAllAnchorFreeDates = async (): Promise<IAnchorFreeDate[]> => {
  return AnchorFreeDate.find().sort({ free_date: 1 });
};

/**
 * Get anchor free date by company name
 */
export const getAnchorFreeDateByCompany = async (
  companyName: string
): Promise<IAnchorFreeDate | null> => {
  return AnchorFreeDate.findOne({
    company_name: new RegExp(companyName, "i"),
  });
};

/**
 * Update anchor free date status
 */
export const updateAnchorFreeeDateStatus = async (): Promise<number> => {
  try {
    const now = new Date();

    // Mark expired
    const expiredResult = await AnchorFreeDate.updateMany(
      { free_date: { $lt: now }, status: { $ne: "expired" } },
      { status: "expired" }
    );

    // Mark active
    const activeResult = await AnchorFreeDate.updateMany(
      {
        free_date: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
          ),
        },
        status: { $ne: "active" },
      },
      { status: "active" }
    );

    const total =
      (expiredResult.modifiedCount || 0) + (activeResult.modifiedCount || 0);

    if (total > 0) {
      console.log(`✅ [ANCHOR] Updated status for ${total} anchor free dates`);
    }

    return total;
  } catch (error) {
    console.error("[ANCHOR] Error updating status:", error);
    return 0;
  }
};

/**
 * Generate anchor free dates section for email
 */
export const getAnchorFreeDateEmailSection = async (): Promise<string> => {
  try {
    const upcomingDates = await getUpcomingAnchorFreeDates(30);

    if (upcomingDates.length === 0) {
      return "";
    }

    const dateRows = upcomingDates
      .map(
        (date) => `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 10px; text-align: left;">
          <p style="margin: 0; font-weight: bold; color: #333;">${date.company_name}</p>
          ${date.notes ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">${date.notes}</p>` : ""}
        </td>
        <td style="padding: 10px; text-align: center;">
          <span style="background: ${getStatusBadgeColor(date.status)}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
            ${date.status.toUpperCase()}
          </span>
        </td>
        <td style="padding: 10px; text-align: center; font-weight: bold; color: #667eea;">
          ${new Date(date.free_date).toLocaleDateString()}
        </td>
      </tr>
    `
      )
      .join("");

    return `
      <!-- Anchor Free Dates Section -->
      <div style="margin-top: 30px; padding-top: 30px; border-top: 2px solid #667eea;">
        <h3 style="margin: 0 0 15px 0; color: #333;">🔓 Anchor Investor Free Dates</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5; border-bottom: 2px solid #667eea;">
              <th style="padding: 10px; text-align: left; font-weight: bold; color: #333;">Company</th>
              <th style="padding: 10px; text-align: center; font-weight: bold; color: #333;">Status</th>
              <th style="padding: 10px; text-align: center; font-weight: bold; color: #333;">Free Date</th>
            </tr>
          </thead>
          <tbody>
            ${dateRows}
          </tbody>
        </table>

        <p style="margin: 15px 0 0 0; font-size: 11px; color: #666;">
          💡 <strong>Note:</strong> Anchor investors can freely sell their shares from the free date onwards.
        </p>
      </div>
    `;
  } catch (error) {
    console.error("[ANCHOR] Error generating email section:", error);
    return "";
  }
};

/**
 * Get badge color based on status
 */
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "active":
      return "#10b981"; // Green
    case "upcoming":
      return "#f59e0b"; // Amber
    case "expired":
      return "#ef4444"; // Red
    default:
      return "#6b7280"; // Gray
  }
}
