/**
 * Utilitaire pour générer des avatars basés sur le sexe de l'utilisateur
 */

/**
 * Génère une URL d'avatar SVG en fonction du sexe
 * @param sex - Le sexe de l'utilisateur ('Homme', 'Femme', ou autre)
 * @param size - La taille de l'avatar en pixels (par défaut 40)
 * @returns Une URL data:image/svg+xml encodée
 */
export function getAvatarUrl(sex?: string, size: number = 40): string {
  const isMan = sex === 'Homme';
  const isFemale = sex === 'Femme';
  
  // Couleurs de fond
  const bgColor = isMan ? '#3B82F6' : isFemale ? '#EC4899' : '#9CA3AF';
  
  // SVG pour homme
  const manSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <rect width="100" height="100" fill="${bgColor}"/>
      <circle cx="50" cy="35" r="18" fill="white"/>
      <path d="M 30 65 Q 30 50 50 50 Q 70 50 70 65 L 70 100 L 30 100 Z" fill="white"/>
    </svg>
  `;
  
  // SVG pour femme
  const femaleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <rect width="100" height="100" fill="${bgColor}"/>
      <circle cx="50" cy="35" r="18" fill="white"/>
      <path d="M 25 65 Q 25 50 50 50 Q 75 50 75 65 L 70 100 L 30 100 Z" fill="white"/>
      <ellipse cx="35" cy="55" rx="8" ry="12" fill="white"/>
      <ellipse cx="65" cy="55" rx="8" ry="12" fill="white"/>
    </svg>
  `;
  
  // SVG par défaut (neutre)
  const defaultSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <rect width="100" height="100" fill="${bgColor}"/>
      <circle cx="50" cy="40" r="20" fill="white"/>
      <circle cx="50" cy="85" r="30" fill="white"/>
    </svg>
  `;
  
  const svg = isMan ? manSvg : isFemale ? femaleSvg : defaultSvg;
  
  // Encoder le SVG en base64 pour l'utiliser comme URL
  const encodedSvg = encodeURIComponent(svg.trim());
  return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Obtient l'URL de l'avatar d'un utilisateur
 * Priorité : avatar personnalisé > avatar généré basé sur le sexe
 * @param user - L'objet utilisateur avec les propriétés avatar, sex, et id
 * @param size - La taille de l'avatar en pixels (par défaut 40)
 * @returns L'URL de l'avatar
 */
export function getUserAvatarUrl(
  user: { avatar?: string; sex?: string; id?: string },
  size: number = 40
): string {
  // Si l'utilisateur a un avatar personnalisé, l'utiliser
  if (user.avatar) {
    return user.avatar;
  }
  
  // Sinon, générer un avatar basé sur le sexe
  return getAvatarUrl(user.sex, size);
}
