/* ------------------------------------------------------------------
   Ouidrop — réglages à modifier ICI (valables pour toutes les pages)
   ------------------------------------------------------------------ */
window.OUIDROP_CONFIG = {
  // Numéro de téléphone inséré dans le message « support »
  supportPhone: '01 02 03 04 05',

  // Lien du dossier Google Drive partagé (bouton de la page maintenance).
  // Exemple : 'https://drive.google.com/drive/folders/XXXXXXXXXXXX'
  // Laisser vide si inutilisé.
  driveFolderUrl: '',

  // Taille maximale d’un fichier importé depuis l’ordinateur (en Mo)
  maxFileMB: 200,

  // Messages prédéfinis. {phone} est remplacé par supportPhone.
  messages: {
    support: 'Pour obtenir de l’aide, appelez le support technique au {phone}.',
    wait:    'Merci de patienter, nous intervenons sur votre borne.',
    repair:  'Une intervention technique est en cours. Merci de patienter.',
    done:    'L’intervention est terminée. Merci de votre patience.'
  }
};
