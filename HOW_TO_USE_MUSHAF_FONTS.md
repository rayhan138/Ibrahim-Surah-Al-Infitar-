# How to Integrate Quran.com V4 Tajweed Fonts

This document explains exactly how the beautiful, colored, overlapping "Tajweed" typography was integrated into this project. Standard Arabic web fonts (like Arial or Amiri Quran) cannot render the complex stacking and coloring seen in the physical Madani Mushaf. To achieve that pixel-perfect look, you must use **Page-Specific SVG Fonts** combined with **PUA Glyph Codes**.

## 1. Understanding the Fonts

The King Fahd Glorious Quran Printing Complex generated a unique font file for **every single page** of the Quran (604 pages total). Quran.com's "V4 Engine" uses the latest **OpenType-SVG** versions of these fonts to support full-color Tajweed rules and beautiful overlapping ligatures.

You can load these fonts directly from the Quran.com frontend repository via a CDN. 
For example, to load Page 586:
```css
@font-face {
    font-family: "PageFont";
    src: url("https://cdn.jsdelivr.net/gh/quran/quran.com-frontend-next@master/public/fonts/quran/hafs/v4/ot-svg/light/woff2/p586.woff2") format("woff2");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
```

## 2. You Cannot Use Standard Arabic Text

If you apply the `p586.woff2` font to standard Arabic text like `إِذَا الشَّمْسُ كُوِّرَتْ`, it will **fail** and render broken or incorrect symbols.

Why? Because the V4 Tajweed fonts do not map to standard Unicode Arabic letters. Instead, they map to secret "Private Use Area" (PUA) codes. Each word in the Quran is mapped to a specific secret symbol in that page's font file.

## 3. The "V2" Glyph Mapping

To use the V4 fonts, you must fetch the specific **`code_v2`** symbols from the official Quran.com API. 

**API Endpoint Example:**
`https://api.quran.com/api/v4/verses/by_chapter/81?words=true&word_fields=code_v2`

**Important Note on Pagination:** 
By default, the Quran.com API only returns 10 verses at a time. To get an entire Surah at once, you must add `&per_page=50` (or higher) to your API request.

If you inspect the JSON data returned by the API, you will see a field called `code_v2` for each word. Instead of standard text, it looks like strange symbols (e.g., `ﱉ` or `ﱊ`). You must take these symbols, join them together with standard spaces (` `), and put *that* string into your HTML.

## 4. The Complete Workflow

If you want to add a new Surah (e.g., Surah Al-Mulk, which starts on Page 562), here is exactly what you must do:

1. **Find the Page Number**: Figure out what page of the Mushaf the Surah starts on (Al-Mulk is page 562).
2. **Inject the Font**: Use JavaScript or CSS to dynamically add an `@font-face` rule pointing to `p562.woff2`.
3. **Fetch the V2 Codes**: Query the Quran.com API for the `code_v2` fields for the entire Surah.
4. **Insert into HTML**: Render those `code_v2` symbols into a `<div>` that has `font-family: "PageFont";` applied to it.
5. **Adjust Font Size**: Because these fonts are extremely tall to accommodate stacked letters, you may need to manually lower your CSS `font-size` (e.g., `3.5rem` instead of `5rem`).

### Bonus: The Bismillah
The Bismillah (In the name of Allah...) at the start of a Surah is usually not included in the page fonts (unless it's Surah Al-Fatihah on Page 1). To render the Bismillah perfectly in the V4 style, we fetched the `code_v2` glyphs for Surah 1, Verse 1 (omitting the verse number glyph), and applied the **Page 1 font** (`p1.woff2`) exclusively to that block.
