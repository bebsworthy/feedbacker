/**
 * SVG icon strings for vanilla TS rendering
 * Ported from React JSX icons
 */

function svg(size: number, content: string, viewBox = '0 0 24 24', fill = 'none'): string {
  return `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="${fill}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

function stroke(d: string, color = 'currentColor'): string {
  return `<path d="${d}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function megaphoneIcon(size = 24, color = 'currentColor'): string {
  return svg(size, `<path d="M480-360q17 0 28.5-11.5T520-400q0-17-11.5-28.5T480-440q-17 0-28.5 11.5T440-400q0 17 11.5 28.5T480-360Zm-40-160h80v-240h-80v240ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" fill="${color}"/>`, '0 -960 960 960', color);
}

export function closeIcon(size = 24, color = 'currentColor'): string {
  return svg(size, stroke('M18 6L6 18M6 6L18 18', color));
}

export function messageIcon(size = 20, color = 'currentColor'): string {
  return svg(size, stroke('M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z', color));
}

export function listIcon(size = 20, color = 'currentColor'): string {
  return svg(size, stroke('M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01', color));
}

export function trashIcon(size = 20, color = 'currentColor'): string {
  return svg(size, stroke('M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z', color));
}

export function arrowDownTrayIcon(size = 20, color = 'currentColor'): string {
  return svg(size, stroke('M3 16.5V18.75C3 19.9926 4.00736 21 5.25 21H18.75C19.9926 21 21 19.9926 21 18.75V16.5M16.5 12L12 16.5M12 16.5L7.5 12M12 16.5V3', color));
}

export function pencilIcon(size = 16, color = 'currentColor'): string {
  return svg(size, stroke('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', color));
}

export function copyIcon(size = 20, color = 'currentColor'): string {
  return svg(size, stroke('M8 16H6C5.46957 16 4.96086 15.7893 4.58579 15.4142C4.21071 15.0391 4 14.5304 4 14V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H14C14.5304 4 15.0391 4.21071 15.4142 4.58579C15.7893 4.96086 16 5.46957 16 6V8M10 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V10C20 9.46957 19.7893 8.96086 19.4142 8.58579C19.0391 8.21071 18.5304 8 18 8H10C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10V18C8 18.5304 8.21071 19.0391 8.58579 19.4142C8.96086 19.7893 9.46957 20 10 20Z', color));
}

export function chevronDownIcon(size = 16, color = 'currentColor'): string {
  return svg(size, stroke('M19 9L12 16L5 9', color));
}

export function chevronUpIcon(size = 16, color = 'currentColor'): string {
  return svg(size, stroke('M5 15L12 8L19 15', color));
}

export function documentTextIcon(size = 24, color = 'currentColor'): string {
  return svg(size, stroke('M9 12H15M9 16H15M17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H12.586C12.8512 3.00006 13.1055 3.10545 13.293 3.293L18.707 8.707C18.8946 8.89449 18.9999 9.14881 19 9.414V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21Z', color));
}

export function archiveBoxIcon(size = 24, color = 'currentColor'): string {
  return svg(size, stroke('M20.25 7.5L19.625 18.132C19.5913 18.705 19.3399 19.2436 18.9222 19.6373C18.5045 20.031 17.9539 20.2502 17.378 20.25H6.622C6.04613 20.2502 5.49549 20.031 5.07783 19.6373C4.66017 19.2436 4.40871 18.705 4.375 18.132L3.75 7.5M10 11.25H14M3.375 7.5H20.625C21.2463 7.5 21.75 6.99632 21.75 6.375V4.125C21.75 3.50368 21.2463 3 20.625 3H3.375C2.75368 3 2.25 3.50368 2.25 4.125V6.375C2.25 6.99632 2.75368 7.5 3.375 7.5Z', color));
}

export function minimizeIcon(size = 20, color = 'currentColor'): string {
  return svg(size, stroke('M20 12H4', color));
}
