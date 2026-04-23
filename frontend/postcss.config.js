/**
 * @file postcss.config.js
 * @description Archivo de configuración para PostCSS.
 * Utiliza 'tailwindcss' directamente, ya que las versiones recientes de Next.js
 * lo manejan internamente sin necesidad del plugin @tailwindcss/postcss.
 * También incluye Autoprefixer para la compatibilidad entre navegadores.
 */
 module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};