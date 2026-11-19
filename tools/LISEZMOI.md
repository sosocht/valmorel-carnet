# Carnet de voyage Valmorel

Page statique (GitHub Pages). L'itinéraire est public, les billets, références, passes Wallet et reçus sont chiffrés par mot de passe.

## Modifier une étape
Éditer `js/data.js` (étapes, horaires, adresses, infos pratiques), puis recharger la page.

## Ajouter ou changer un billet ou un reçu
1. Déposer le fichier dans `secret/` (dossier jamais publié).
2. L'ajouter dans `secret/secret.src.json` (liste `docs`, avec l'étape `step`, ou `frais` pour un reçu ; `refs` pour les numéros de réservation ; `frais.lignes` pour les montants).
3. Relancer le chiffrement : `CARNET_MDP="le mot de passe" node tools/build.mjs`
4. Publier le dossier sans `secret/` ni `tools/`.

## Changer le mot de passe
Relancer `build.mjs` avec le nouveau mot de passe, puis le redonner à Jules.
