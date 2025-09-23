import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY; // Récupérer la clé de l'environnement

if (!key) {
  // Lancer une erreur dès le début pour éviter les problèmes
  throw new Error('ENCRYPTION_KEY variable d\'environnement est manquante.');
}

const iv = crypto.randomBytes(16); // IV (vecteur d'initialisation)

// Chiffrer un texte
export function encrypt(text: string): string {
  // Utiliser `key as string` pour rassurer TypeScript que la clé est définie
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key as string, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Déchiffrer un texte
export function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(':');
  // Utiliser `key as string` pour rassurer TypeScript
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key as string, 'hex'), Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
