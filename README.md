# Ouidrop — Pages de borne

## Fichiers
- `index.html` : accueil, accès aux modes et messages rapides.
- `communication.html` : le champ de saisie EST l’affichage client. Icônes en bas : effacer, support, patienter, intervention, fin d’intervention, cloche (fonds du `body` et du `.message-field` bleu/blanc toutes les 500 ms pendant 5 s). Icônes en haut à droite : accueil et affichage verrouillé.
- `maintenance.html` : message + média (fichier de l’ordinateur **ou** lien), aperçu, validation.
- `affichage.html` : affichage plein écran du contenu validé.
- `config.js` : **réglages à modifier** (numéro du support, lien du dossier Drive, taille max, textes des messages).
- `ouidrop.js` : code partagé (messages, stockage, liens, affichage des médias).
- `style.css` : charte Ouidrop commune.

Tous les fichiers vont dans le même dossier.

## Avant mise en service
1. Dans `config.js` : renseigner `supportPhone` (remplace `01 02 03 04 05` partout) et, si besoin, `driveFolderUrl`.
2. Déposer l’ensemble du dossier sur GitHub Pages (ou le servir en local, voir ci-dessous).

## Médias
- **Depuis l’ordinateur** : bouton « Depuis cet ordinateur ». Le fichier est stocké dans le navigateur (IndexedDB), jamais envoyé sur un serveur. Limite par défaut : 200 Mo.
- **Depuis un lien** : coller le lien puis Entrée / « Charger » (ou simplement coller).
  - Lien **Google Drive d’un fichier** (`…/file/d/ID/view…`) : converti automatiquement. Le fichier doit être partagé « Toute personne disposant du lien ». Un lien de **dossier** est refusé avec une explication.
  - Pour une **vidéo Drive**, choisir le type « Vidéo » : elle est lue dans le lecteur Drive intégré (lecture manuelle, pas de boucle automatique).
  - Lien direct (`https://…/photo.jpg`, `.mp4`, `.webm`…) : affiché tel quel. Les liens Dropbox sont convertis. Un lien vers une *page web* (article, Google Images, Google Photos) ne fonctionne pas : il faut l’adresse directe de l’image.
- Les vidéos de l’affichage sont muettes et en boucle (Firefox bloque l’autoplay avec le son).
- Vidéos locales : sur Linux/ARM, Firefox lit sans souci le **WebM** ; le **MP4/H.264** dépend des codecs installés sur l’Odroid. Si un MP4 ne s’affiche pas, le convertir en WebM.

## Limites à connaître
- **Ne pas ouvrir les pages en `file://`** : depuis Firefox, les pages locales ont chacune leur propre espace de stockage, la page d’affichage risque donc de ne rien recevoir. Utiliser GitHub Pages, ou un serveur local : `cd dossier && python3 -m http.server 8000` puis `http://localhost:8000/`.
- Le contenu validé est conservé dans le navigateur de la borne (il survit à la fermeture de l’onglet). La navigation privée ne permet pas de le conserver.
- Le « verrouillage » est un mode d’affichage de la page, pas une sécurité système : un utilisateur peut quitter Firefox. Pour un vrai mode kiosque, voir la configuration Linux/Firefox (à part).
- Retour depuis l’affichage : icône discrète en bas à droite ou touche `Échap`. `F11` met Firefox en plein écran. `Ctrl+W` ferme l’onglet.
- Le raccourci système (ex. `Ctrl+Alt+M`) pour ouvrir Firefox sur la page de communication se configure dans Linux, pas dans la page.
- Le code n’a pas été testé sur un Odroid réel.
