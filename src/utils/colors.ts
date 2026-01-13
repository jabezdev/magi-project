/**
 * varying brightness of background colors.
 * Returns 'black' or 'white' based on the luminance of the input hex color.
 */
export function getContrastColor(hexColor: string): string {
    // Remove hash if present
    const hex = hexColor.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance (standard formula)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for bright colors, white for dark colors
    // Threshold can be adjusted (0.5 is standard, 0.6 favors black text more)
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
}
