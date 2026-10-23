/* ------------------------------------------------------------------
   Ouidrop — réglages à modifier ICI (valables pour toutes les pages)
   ------------------------------------------------------------------ */
window.OUIDROP_CONFIG = {
  // Numéro de téléphone inséré dans le message « support »
  supportPhone: '09 70 70 22 23',

  // Lien du dossier Google Drive partagé (bouton de la page maintenance).
  // Exemple : 'https://drive.google.com/drive/folders/XXXXXXXXXXXX'
  // Laisser vide si inutilisé.
  driveFolderUrl: 'https://drive.google.com/drive/folders/1UsoBL6WYIAFCLH1szO87Rt5rAdL8x8Wj',

  // Taille maximale d’un fichier importé depuis l’ordinateur (en Mo)
  maxFileMB: 20,

  // Messages prédéfinis. {phone} est remplacé par supportPhone.
  messages: {
    support: 'Ici le support technique, veuillez nous contacter au {phone}.',
    wait:    'Merci de patienter, nous intervenons sur votre borne.',
    done:    'L’intervention est terminée. Merci de votre patience. Le processus va reprendre son cours dans quelques secondes.',
  }
};
