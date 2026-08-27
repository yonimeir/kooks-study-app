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

// Book name mapping from English keys to Hebrew titles
export const bookNameMap: { [key: string]: string } = {
  'Orot': 'אורות',
  'Orot HaTorah': 'אורות התורה',
  'Orot HaTeshuvah': 'אורות התשובה',
  'Musar Avikha': 'מוסר אביך',
  'Middot HaRa\'ayah': 'מידות הראי"ה',
  'Reish Millin': 'ריש מילין'
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

// Convert Hebrew year number (e.g. 5786) to Hebrew characters (e.g. תשפ"ו)
export function formatHebrewYear(year: number): string {
  const num = year % 1000;
  
  const hundredsMap: { [key: number]: string } = {
    100: "ק", 200: "ר", 300: "ש", 400: "ת",
    500: "תק", 600: "תר", 700: "תש", 800: "תת", 900: "תתק"
  };
  const tensMap: { [key: number]: string } = {
    10: "י", 20: "כ", 30: "ל", 40: "מ", 50: "נ", 60: "ס", 70: "ע", 80: "פ", 90: "צ"
  };
  const unitsMap: { [key: number]: string } = {
    1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט"
  };

  const hundreds = Math.floor(num / 100) * 100;
  const rem100 = num % 100;
  const tens = Math.floor(rem100 / 10) * 10;
  const units = rem100 % 10;

  let str = (hundredsMap[hundreds] || "") + (tensMap[tens] || "") + (unitsMap[units] || "");

  if (rem100 === 15) {
    str = (hundredsMap[hundreds] || "") + "טו";
  } else if (rem100 === 16) {
    str = (hundredsMap[hundreds] || "") + "טז";
  }

  if (str.length > 1) {
    return str.slice(0, -1) + '"' + str.slice(-1);
  } else if (str.length === 1) {
    return str + "'";
  }
  return str;
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
  yearHebrew: string;
}

export function getTodayHebrewDate(): HebrewDateInfo {
  const hd = new HDate(new Date());
  const monthName = hd.getMonthName();
  const info = monthMap[monthName] || { key: monthName, heTitle: monthName };
  const yearNum = hd.getFullYear();
  
  return {
    day: hd.getDate(),
    dayHebrew: getHebrewDayChar(hd.getDate()),
    monthEnglish: monthName,
    monthHebrew: info.heTitle,
    monthKey: info.key,
    year: yearNum,
    yearHebrew: formatHebrewYear(yearNum)
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
      return data.he.map((p: string) => p.replace(/<\/?[^>]+(>|$)/g, ""));
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
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      const paragraphs = Array.from(doc.querySelectorAll('p'));
      const textArray = paragraphs
        .map(p => p.textContent?.trim() || "")
        .filter(t => t.length > 5 && !t.includes("ויקיטקסט") && !t.includes("ראש מילין"));
        
      if (textArray.length > 0) {
        return textArray;
      }
      
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
