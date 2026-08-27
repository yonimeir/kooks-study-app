import urllib.request
import urllib.parse
import json
import re
import time

headers = {
    'User-Agent': 'KooksStudyApp/1.0 (https://kooks-study-app.vercel.app; kooks@study.app)'
}

def clean_html(text):
    if not text:
        return ""
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    text = re.sub(r'<sup[^>]*>.*?</sup>', '', text, flags=re.DOTALL)
    text = text.replace('</p>', '\n').replace('<br>', '\n').replace('<br/>', '\n')
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()

def get_sefaria(ref):
    url = f"https://www.sefaria.org/api/texts/{urllib.parse.quote(ref)}?context=0"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            he = data.get('he')
            if not he:
                return []
            if isinstance(he, str):
                c = clean_html(he)
                return [c] if c else []
            if isinstance(he, list):
                res = []
                for item in he:
                    if isinstance(item, list):
                        res.extend([clean_html(x) for x in item if clean_html(x)])
                    elif isinstance(item, str) and clean_html(item):
                        res.append(clean_html(item))
                return res
    except Exception as e:
        print(f"Sefaria error for {ref}: {e}")
        return []

def get_wikisource_page(title):
    url = f"https://he.wikisource.org/w/api.php?action=parse&page={urllib.parse.quote(title)}&format=json&prop=text&origin=*"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            html = data.get('parse', {}).get('text', {}).get('*', '')
            raw_text = clean_html(html)
            lines = [l.strip() for l in raw_text.split('\n') if len(l.strip()) > 15]
            filtered = [l for l in lines if not any(x in l for x in ["ויקיטקסט", "קטגוריה:", "מהדורת", "רישיון", "ספר זה"])]
            return filtered
    except Exception as e:
        print(f"Wikisource error for {title}: {e}")
        return []

# Step 1: Load all chapters of Orot HaTeshuvah from Wikisource
teshuvah_chapters = {}
he_letters = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב", "יג", "יד", "טו", "טז", "יז"]

print("Fetching complete Orot HaTeshuvah from Wikisource...")
# Also try full page
full_teshuvah = get_wikisource_page("אורות_התשובה")
time.sleep(0.5)

for num in range(1, 18):
    letter = he_letters[num]
    paras = get_wikisource_page(f"אורות_התשובה/פרק_{letter}")
    if not paras:
        paras = get_wikisource_page(f"אורות_התשובה/{letter}")
    if not paras:
        # Fallback to Sefaria
        paras = get_sefaria(f"Orot HaTeshuvah {num}")
    teshuvah_chapters[num] = paras
    print(f"Orot HaTeshuvah Chapter {num} ({letter}): {len(paras)} paragraphs")
    time.sleep(0.4)

# Intro to Orot HaTeshuvah
teshuvah_intro = get_wikisource_page("אורות_התשובה/פתיחה") or get_sefaria("Orot HaTeshuvah, Introduction") or get_sefaria("Orot HaTeshuvah, Foreword")

# Musar Avikha Introduction
musar_intro = get_wikisource_page("מוסר_אביך/הקדמה") or get_sefaria("Musar Avikha, Introduction 1")

# Orot לדגל ירושלים
le_degel = get_wikisource_page("אורות/לדגל_ירושלים") or get_wikisource_page("לדגל_ירושלים")

# Orot HaTorah לחיזוק דברי תורה
chizuk_torah = get_wikisource_page("אורות_התורה/לחיזוק_דברי_תורה")

# Load existing Reish Millin
with open('src/data/reishMillin.json', 'r', encoding='utf-8') as f:
    reish_millin = json.load(f)

# Load schedule
with open('src/data/schedule.json', 'r', encoding='utf-8') as f:
    schedule = json.load(f)

# Step 2: Fix schedule.json refs to accurate Sefaria node names
# Correct Middot HaRa'ayah node names in Sefaria:
# Elevation of Sparks -> Raising the Sparks
# Fear -> Awe
# Fearfulness -> Cowardice
# Will -> Desire

# Correct Orot Ideals node names in Sefaria:
# פרק א -> The Godly and the National Ideal in the Individual
# פרק ב -> The Godly and the National Ideal in Israel
# פרק ג -> Dissolution of Ideals
# פרק ד -> The Situation in Exile
# פרק ה -> The First and Second Temples; Religion
# פרק ו -> Unification of Ideals

for month, days in schedule.items():
    for item in days:
        ref = item.get('ref', '')
        heTitle = item.get('heTitle', '')

        # Fix Middot HaRa'ayah
        if "Middot_HaRa'ayah,_Elevation_of_Sparks" in ref:
            item['ref'] = ref.replace("Elevation_of_Sparks", "Raising_the_Sparks")
        elif "Middot_HaRa'ayah,_Fear." in ref:
            item['ref'] = ref.replace("Fear.", "Awe.")
        elif "Middot_HaRa'ayah,_Fearfulness" in ref:
            item['ref'] = ref.replace("Fearfulness", "Cowardice")
        elif "Middot_HaRa'ayah,_Will" in ref:
            item['ref'] = ref.replace("Will", "Desire")

        # Fix Orot Ideals in Av
        if month == 'Av':
            if 13 <= item['day'] <= 14:
                item['ref'] = "Orot, The Process of Ideals in Israel, The Godly and the National Ideal in Israel"
            elif 15 <= item['day'] <= 18:
                item['ref'] = "Orot, The Process of Ideals in Israel, Dissolution of Ideals"
            elif 19 <= item['day'] <= 21:
                item['ref'] = "Orot, The Process of Ideals in Israel, The Situation in Exile"
            elif 22 <= item['day'] <= 29:
                item['ref'] = "Orot, The Process of Ideals in Israel, The First and Second Temples; Religion"
            elif item['day'] == 30:
                item['ref'] = "Orot, The Process of Ideals in Israel, Unification of Ideals"

        if month == 'Elul' and item['day'] in (1, 2):
            item['ref'] = "Orot, The Process of Ideals in Israel, Unification of Ideals"

        if month == 'Nissan' and item['day'] == 1:
            item['ref'] = "לדגל ירושלים"

with open('src/data/schedule.json', 'w', encoding='utf-8') as f:
    json.dump(schedule, f, ensure_ascii=False, indent=2)

print("Schedule refs updated to exact canonical names.")

# Step 3: Build allDailyTexts.json
all_texts = {}

# Insert Reish Millin
for k, v in reish_millin.items():
    all_texts[k] = v

for month, days in schedule.items():
    for item in days:
        day = item['day']
        key = f"{month}-{day}"
        book = item.get('book')
        ref = item.get('ref')
        heTitle = item.get('heTitle')

        if book == 'Reish Millin':
            continue

        paras = []

        # Handle Orot HaTeshuvah
        if "אורות התשובה" in heTitle or "Orot_HaTeshuvah" in str(ref):
            if "פתיחה" in heTitle:
                paras = teshuvah_intro
            else:
                for ch_num in range(1, 18):
                    ch_let = he_letters[ch_num]
                    if f"התשובה {ch_let}" in heTitle or f"התשובה {ch_let}," in heTitle or f"התשובה {ch_let}–" in heTitle or f"התשובה {ch_let}*" in heTitle:
                        paras = teshuvah_chapters.get(ch_num) or []
                        break
                if not paras:
                    m = re.search(r'(\d+)', str(ref))
                    if m:
                        ch_num = int(m.group(1))
                        paras = teshuvah_chapters.get(ch_num) or []

        # Handle לדגל ירושלים
        elif "לדגל ירושלים" in heTitle:
            paras = le_degel

        # Handle לחיזוק דברי תורה
        elif "לחיזוק דברי תורה" in heTitle:
            paras = chizuk_torah

        # Handle Musar Avikha Intro
        elif "מוסר אביך, מעין הקדמה" in heTitle:
            paras = musar_intro

        # Default: Fetch from Sefaria
        if not paras and ref:
            paras = get_sefaria(ref)

        if paras:
            all_texts[key] = paras
            print(f"[{key}] {heTitle} -> OK ({len(paras)} paragraphs)")
        else:
            print(f"[{key}] {heTitle} -> STILL EMPTY!")

with open('src/data/allDailyTexts.json', 'w', encoding='utf-8') as f:
    json.dump(all_texts, f, ensure_ascii=False, indent=2)

print(f"\nFinal bundled database created! Total days with text: {len(all_texts)}")
