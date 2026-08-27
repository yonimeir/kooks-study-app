import { HDate } from '@hebcal/hdate';

// Mapping from standard English month names returned by hebcal to our schedule keys and Hebrew month names
export const monthMap: { [key: string]: { key: string; heTitle: string } } = {
  'Elul': { key: 'Elul', heTitle: 'אלול' },
  'Tishrei': { key: 'Tishrei', heTitle: 'תשרי' },
  'Cheshvan': { key: 'Cheshvan', heTitle: 'חשוון' },
  'Kislev': { key: 'Kislev', heTitle: 'כסלו' },
  'Tevet': { key: 'Tevet', heTitle: 'טבת' },
  'Sh\'vat': { key: 'Shevat', heTitle: 'שבט' },
  'Adar': { key: 'Adar', heTitle: 'אדר' },
  'Adar I': { key: 'Adar', heTitle: 'אדר א\'' },
  'Adar II': { key: 'Adar', heTitle: 'אדר ב\'' },
  'Nisan': { key: 'Nissan', heTitle: 'ניסן' },
  'Iyar': { key: 'Iyar', heTitle: 'אייר' },
  'Sivan': { key: 'Sivan', heTitle: 'סיון' },
  'Tamuz': { key: 'Tammuz', heTitle: 'תמוז' },
  'Av': { key: 'Av', heTitle: 'אב' }
};

// Gematriya helper to convert numbers into Hebrew letters (1 -> א, 15 -> טו, 30 -> ל)
export function getHebrewDayChar(day: number): string {
  const units = ["", "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'"];
  const tens = ["", "י'", "כ'", "ל'"];

  if (day === 15) return 'ט"ו';
  if (day === 16) return 'ט"ז';

  if (day <= 9) return units[day];
  
  const tenDigit = Math.floor(day / 10);
  const unitDigit = day % 10;

  if (unitDigit === 0) {
    return tens[tenDigit].replace("'", "");
  }

  const tenStr = tens[tenDigit].replace("'", "");
  const unitStr = units[unitDigit].replace("'", "");
  return `${tenStr}\"${unitStr}`;
}

// Convert month name to Hebrew
export function getHebrewMonthName(hebcalMonth: string): string {
  return monthMap[hebcalMonth]?.heTitle || hebcalMonth;
}

// Get today's Hebrew date details
export interface HebrewDateInfo {
  day: number;
  dayHebrew: string;
  monthEnglish: string;
  monthHebrew: string;
  monthKey: string;
  year: number;
}

export function getTodayHebrewDate(): HebrewDateInfo {
  const hd = new HDate(new Date());
  const monthName = hd.getMonthName();
  const info = monthMap[monthName] || { key: monthName, heTitle: monthName };
  
  return {
    day: hd.getDate(),
    dayHebrew: getHebrewDayChar(hd.getDate()),
    monthEnglish: monthName,
    monthHebrew: info.heTitle,
    monthKey: info.key,
    year: hd.getFullYear()
  };
}

// Fetch text from Sefaria API
export async function fetchSefariaText(ref: string): Promise<string[]> {
  try {
    const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Sefaria API returned status: ${response.status}`);
    }
    const data = await response.json();
    if (data.he && Array.isArray(data.he)) {
      // Sometimes Sefaria returns an array of strings (paragraphs)
      return data.he.map((p: string) => p.replace(/<\/?[^>]+(>|$)/g, "")); // strip HTML
    } else if (data.he && typeof data.he === 'string') {
      return [data.he.replace(/<\/?[^>]+(>|$)/g, "")];
    }
    return ["לא נמצא טקסט עבור קטע זה בספריא."];
  } catch (error) {
    console.error("Error fetching from Sefaria:", error);
    return ["שגיאה בטעינת הטקסט מספריא. אנא בדוק את החיבור לאינטרנט."];
  }
}

// Fetch text from Wikisource API (for Reish Millin)
export async function fetchWikisourceText(pageRef: string): Promise<string[]> {
  try {
    const encodedPage = encodeURIComponent(`ראש_מילין/${pageRef}`);
    const url = `https://he.wikisource.org/w/api.php?action=parse&page=${encodedPage}&format=json&prop=text&origin=*`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Wikisource API returned status: ${response.status}`);
    }
    const data = await response.json();
    if (data.parse && data.parse.text && data.parse.text["*"]) {
      const htmlContent = data.parse.text["*"];
      // Create a temporary DOM parser to extract paragraphs
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Wikisource texts are in divs, usually inside p elements
      const paragraphs = Array.from(doc.querySelectorAll('p'));
      const textArray = paragraphs
        .map(p => p.textContent?.trim() || "")
        .filter(t => t.length > 5 && !t.includes("ויקיטקסט") && !t.includes("ראש מילין"));
        
      if (textArray.length > 0) {
        return textArray;
      }
      
      // Fallback: extract text content directly and split by double newlines
      const cleanText = doc.body.textContent || "";
      return cleanText
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 10 && !t.includes("ויקיטקסט"));
    }
    return ["לא נמצא טקסט עבור פרק זה בויקיטקסט."];
  } catch (error) {
    console.error("Error fetching from Wikisource:", error);
    return ["שגיאה בטעינת הטקסט מויקיטקסט. אנא בדוק את החיבור לאינטרנט."];
  }
}
