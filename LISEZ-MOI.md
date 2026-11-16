# Krosciculus — version application (PWA)

## Mettre le jeu en ligne sur GitHub Pages (une seule fois)
1. Crée un compte sur github.com (gratuit), puis **New repository** : nom `krosciculus`, visibilité **Public**.
2. Dans le dépôt vide : **uploading an existing file** → glisse **tout le contenu** de ce dossier (index.html, sw.js, manifest.webmanifest, .nojekyll, dossier icons) → **Commit changes**.
   (Le fichier index.html fait ~12 Mo : c'est accepté, la limite du site web est 25 Mo par fichier.)
3. **Settings → Pages** → *Source* : « Deploy from a branch » → branche `main`, dossier `/ (root)` → **Save**.
4. Après 1 à 2 minutes, le jeu est sur `https://TON-PSEUDO.github.io/krosciculus/`.

## Installer sur téléphone / PC
- **Android (Chrome)** : ouvrir le lien → menu ⋮ → « Installer l'application ».
- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil ».
- **PC (Chrome/Edge)** : icône d'installation dans la barre d'adresse.
Après la première ouverture, le jeu marche **hors ligne**.

## Publier une mise à jour
1. Remplace `index.html` dans le dépôt (Add file → Upload files, même nom).
2. Ouvre `sw.js` et change `const VERSION = 'v1';` en `'v2'`, puis `'v3'`… à chaque mise à jour.
3. Les joueurs reçoivent la nouvelle version au 2e lancement (fermer puis rouvrir l'app).

## Notes
- Les polices (Lilita One, Nunito) viennent de Google Fonts : elles sont mises en cache après le 1er lancement en ligne.
- Les icônes (lettre K dorée) sont provisoires : remplace les fichiers du fichiers `icon-*.png`, `maskable-512.png` et `apple-touch-icon.png` (mêmes noms/tailles : 192, 512, maskable 512, 180) pour mettre ton logo.
- La sauvegarde du jeu reste locale à chaque appareil.
